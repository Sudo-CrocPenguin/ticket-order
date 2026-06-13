const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { TicketStatus } = require("../../../../shared/domain");
const { AuthService } = require("../AuthService");
const { BootstrapService } = require("../BootstrapService");
const { CompanyService } = require("../CompanyService");
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
    companyService: new CompanyService({ database, passwordHasher }),
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

test("registra empresa y permite administrar usuarios y aplicaciones", async () => {
  const { authService, companyService } = await createServices();
  const registration = await companyService.registerCompany({
    companyName: "Nueva Empresa",
    applicationName: "Portal Clientes",
    adminName: "Admin Nuevo",
    adminEmail: "admin@nueva.local",
    adminPassword: "Admin123!",
  });

  const login = await authService.login({
    email: "admin@nueva.local",
    password: "Admin123!",
  });
  const admin = await authService.resolveUserFromToken(login.token);
  const application = await companyService.createApplication(admin, {
    name: "Backoffice",
    description: "Gestion interna.",
  });
  const developer = await companyService.createUser(admin, {
    name: "Dev Uno",
    email: "dev@nueva.local",
    password: "Developer123!",
    role: "developer",
  });
  const users = await companyService.listUsers(admin);

  assert.equal(registration.company.slug, "nueva-empresa");
  assert.equal(application.name, "Backoffice");
  assert.equal(developer.email, "dev@nueva.local");
  assert.equal(users.length, 2);
});

test("actualiza aplicaciones y protege el ultimo administrador activo", async () => {
  const { authService, companyService } = await createServices();
  const login = await authService.login({
    email: "admin@test.local",
    password: "Admin123!",
  });
  const admin = await authService.resolveUserFromToken(login.token);
  const workspace = await companyService.getCurrentCompany(admin);
  const application = workspace.applications[0];

  const updatedApplication = await companyService.updateApplication(admin, application.id, {
    name: "App Renombrada",
    description: "Descripcion ajustada.",
    isActive: false,
  });

  assert.equal(updatedApplication.name, "App Renombrada");
  assert.equal(updatedApplication.isActive, false);

  await assert.rejects(
    () =>
      companyService.updateUser(admin, admin.id, {
        isActive: false,
      }),
    /administrador activo/
  );

  const secondAdmin = await companyService.createUser(admin, {
    name: "Admin Dos",
    email: "admin2@test.local",
    password: "Admin123!",
    role: "admin",
  });
  const disabledAdmin = await companyService.updateUser(admin, admin.id, {
    name: "Admin Test Inactivo",
    isActive: false,
  });

  assert.equal(secondAdmin.role, "admin");
  assert.equal(disabledAdmin.isActive, false);
});
