const { loadEnv } = require("./config/loadEnv");

loadEnv();

const { assertProductionConfig, config } = require("./config/env");
const { BootstrapService } = require("./application/BootstrapService");
const { AuthService } = require("./application/AuthService");
const { CompanyService } = require("./application/CompanyService");
const { TicketService } = require("./application/TicketService");
const { HttpApp } = require("./infrastructure/http/HttpApp");
const { JsonDatabase } = require("./infrastructure/persistence/JsonDatabase");
const { PasswordHasher } = require("./infrastructure/security/PasswordHasher");
const { TokenService } = require("./infrastructure/security/TokenService");
const { FileStorage } = require("./infrastructure/storage/FileStorage");

const start = async () => {
  assertProductionConfig();

  const database = new JsonDatabase(config.dataFile);
  const passwordHasher = new PasswordHasher();
  const tokenService = new TokenService({
    secret: config.jwtSecret,
    expiresInSeconds: config.tokenExpiresInSeconds,
  });
  const fileStorage = new FileStorage({ uploadDir: config.uploadDir });

  const bootstrapService = new BootstrapService({
    database,
    passwordHasher,
    config,
  });
  const authService = new AuthService({
    database,
    passwordHasher,
    tokenService,
  });
  const companyService = new CompanyService({ database });
  const ticketService = new TicketService({ database, fileStorage });

  const seedResult = await bootstrapService.ensureSeedData();
  const app = new HttpApp({
    authService,
    companyService,
    ticketService,
    config,
  });
  const server = app.createServer();

  server.listen(config.port, config.host, () => {
    process.stdout.write(
      `Ticket Order API escuchando en http://${config.host}:${config.port}\n`
    );

    if (seedResult.created && config.env !== "production") {
      process.stdout.write(
        `Usuario demo: ${config.seed.adminEmail} / ${config.seed.adminPassword}\n`
      );
    }
  });
};

start().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
