const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { TicketStatus } = require("../../../../shared/domain");
const { AuthService } = require("../AuthService");
const { BootstrapService } = require("../BootstrapService");
const { TicketService } = require("../TicketService");
const { JsonDatabase } = require("../../infrastructure/persistence/JsonDatabase");
const { PasswordHasher } = require("../../infrastructure/security/PasswordHasher");
const { TokenService } = require("../../infrastructure/security/TokenService");
const { FileStorage } = require("../../infrastructure/storage/FileStorage");

const createServices = async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ticket-order-test-"));
  const database = new JsonDatabase(path.join(tempDir, "data.json"));
  const passwordHasher = new PasswordHasher({ iterations: 1000 });
  const tokenService = new TokenService({
    secret: "test-secret-with-more-than-32-characters",
    expiresInSeconds: 3600,
  });
  const fileStorage = new FileStorage({ uploadDir: path.join(tempDir, "uploads") });
  const config = {
    seed: {
      companyName: "Empresa Test",
      companySlug: "empresa-test",
      applicationName: "App Test",
      adminName: "Admin Test",
      adminEmail: "admin@test.local",
      adminPassword: "Admin123!",
    },
  };

  await new BootstrapService({ database, passwordHasher, config }).ensureSeedData();

  return {
    authService: new AuthService({ database, passwordHasher, tokenService }),
    database,
    ticketService: new TicketService({ database, fileStorage }),
  };
};

test("login, creacion y cambio de estado de ticket", async () => {
  const { authService, database, ticketService } = await createServices();
  const login = await authService.login({
    email: "admin@test.local",
    password: "Admin123!",
  });
  const user = await authService.resolveUserFromToken(login.token);
  const state = await database.read();
  const application = state.applications[0];

  const ticket = await ticketService.createTicket(user, {
    applicationId: application.id,
    title: "Bug reproducible",
    description: "Falla al guardar evidencias.",
    priority: "high",
  });

  const updated = await ticketService.changeStatus(user, ticket.id, {
    status: TicketStatus.IN_PROGRESS,
    note: "Tomado por el equipo.",
  });

  assert.equal(login.user.email, "admin@test.local");
  assert.equal(ticket.status, TicketStatus.PENDING);
  assert.equal(updated.status, TicketStatus.IN_PROGRESS);
  assert.equal(updated.statusHistory.length, 2);
});
