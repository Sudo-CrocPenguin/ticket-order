const http = require("node:http");
const { URL } = require("node:url");
const {
  AuthorizationError,
  DomainError,
  NotFoundError,
} = require("../../../../shared/domain");

const MAX_JSON_BODY_BYTES = 15 * 1024 * 1024;

const sendJson = (response, statusCode, payload, headers = {}) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  response.end(JSON.stringify(payload));
};

const readJsonBody = async (request) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    request.on("data", (chunk) => {
      size += chunk.length;

      if (size > MAX_JSON_BODY_BYTES) {
        reject(new DomainError("El cuerpo de la solicitud es demasiado grande."));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(new DomainError("El cuerpo de la solicitud debe ser JSON valido."));
      }
    });

    request.on("error", reject);
  });

const getBearerToken = (request) => {
  const authorization = request.headers.authorization || "";
  const [type, token] = authorization.split(" ");
  return type === "Bearer" ? token : "";
};

class HttpApp {
  constructor({ authService, companyService, ticketService, config }) {
    this.authService = authService;
    this.companyService = companyService;
    this.ticketService = ticketService;
    this.config = config;
  }

  createServer() {
    return http.createServer((request, response) => {
      this.handle(request, response).catch((error) =>
        this.handleError(response, error)
      );
    });
  }

  setCors(response) {
    response.setHeader("Access-Control-Allow-Origin", this.config.corsOrigin);
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, OPTIONS"
    );
  }

  async resolveUser(request) {
    const token = getBearerToken(request);

    if (!token) {
      throw new AuthorizationError("Debes iniciar sesion.");
    }

    return this.authService.resolveUserFromToken(token);
  }

  async handle(request, response) {
    this.setCors(response);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    if (request.method === "GET" && pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        service: "ticket-order-api",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
      const body = await readJsonBody(request);
      const result = await this.authService.login(body);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && pathname === "/api/companies/register") {
      const body = await readJsonBody(request);
      const result = await this.companyService.registerCompany(body);
      sendJson(response, 201, result);
      return;
    }

    const user = await this.resolveUser(request);

    if (request.method === "GET" && pathname === "/api/me") {
      sendJson(response, 200, { user: user.toPublicJSON() });
      return;
    }

    if (request.method === "GET" && pathname === "/api/companies/current") {
      const result = await this.companyService.getCurrentCompany(user);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "GET" && pathname === "/api/applications") {
      const result = await this.companyService.getCurrentCompany(user);
      sendJson(response, 200, { applications: result.applications });
      return;
    }

    if (request.method === "POST" && pathname === "/api/applications") {
      const body = await readJsonBody(request);
      const application = await this.companyService.createApplication(user, body);
      sendJson(response, 201, { application });
      return;
    }

    if (request.method === "GET" && pathname === "/api/users") {
      const users = await this.companyService.listUsers(user);
      sendJson(response, 200, { users });
      return;
    }

    if (request.method === "POST" && pathname === "/api/users") {
      const body = await readJsonBody(request);
      const createdUser = await this.companyService.createUser(user, body);
      sendJson(response, 201, { user: createdUser });
      return;
    }

    if (request.method === "GET" && pathname === "/api/tickets") {
      const tickets = await this.ticketService.listTickets(user, {
        search: url.searchParams.get("search"),
        status: url.searchParams.get("status"),
        applicationId: url.searchParams.get("applicationId"),
      });
      sendJson(response, 200, { tickets });
      return;
    }

    if (request.method === "POST" && pathname === "/api/tickets") {
      const body = await readJsonBody(request);
      const ticket = await this.ticketService.createTicket(user, body);
      sendJson(response, 201, { ticket });
      return;
    }

    const ticketMatch = pathname.match(/^\/api\/tickets\/([^/]+)$/);
    if (request.method === "GET" && ticketMatch) {
      const ticket = await this.ticketService.getTicket(user, ticketMatch[1]);
      sendJson(response, 200, { ticket });
      return;
    }

    const statusMatch = pathname.match(/^\/api\/tickets\/([^/]+)\/status$/);
    if (request.method === "PATCH" && statusMatch) {
      const body = await readJsonBody(request);
      const ticket = await this.ticketService.changeStatus(user, statusMatch[1], body);
      sendJson(response, 200, { ticket });
      return;
    }

    const evidenceMatch = pathname.match(/^\/api\/tickets\/([^/]+)\/evidences$/);
    if (request.method === "POST" && evidenceMatch) {
      const body = await readJsonBody(request);
      const ticket = await this.ticketService.addEvidence(user, evidenceMatch[1], body);
      sendJson(response, 201, { ticket });
      return;
    }

    const commentMatch = pathname.match(/^\/api\/tickets\/([^/]+)\/comments$/);
    if (request.method === "POST" && commentMatch) {
      const body = await readJsonBody(request);
      const ticket = await this.ticketService.addComment(user, commentMatch[1], body);
      sendJson(response, 201, { ticket });
      return;
    }

    const downloadMatch = pathname.match(/^\/api\/evidences\/([^/]+)\/download$/);
    if (request.method === "GET" && downloadMatch) {
      const { evidence, content } = await this.ticketService.getEvidenceFile(
        user,
        downloadMatch[1]
      );
      response.writeHead(200, {
        "Content-Type": evidence.mimeType,
        "Content-Length": content.length,
        "Content-Disposition": `attachment; filename="${evidence.fileName.replace(/"/g, "")}"`,
      });
      response.end(content);
      return;
    }

    throw new NotFoundError("Ruta no encontrada.");
  }

  handleError(response, error) {
    this.setCors(response);

    if (error instanceof DomainError) {
      sendJson(response, 400, {
        error: error.message,
        details: error.details || {},
      });
      return;
    }

    if (error instanceof AuthorizationError) {
      sendJson(response, 401, { error: error.message });
      return;
    }

    if (error instanceof NotFoundError) {
      sendJson(response, 404, { error: error.message });
      return;
    }

    sendJson(response, 500, {
      error: "Error interno del servidor.",
    });
  }
}

module.exports = {
  HttpApp,
};
