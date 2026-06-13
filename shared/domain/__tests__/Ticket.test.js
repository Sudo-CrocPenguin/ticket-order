const assert = require("node:assert/strict");
const test = require("node:test");
const { DomainError, Ticket, TicketStatus } = require("..");

test("crea un ticket pendiente con historial inicial", () => {
  const ticket = Ticket.create({
    id: "tck_1",
    initialLogId: "log_1",
    companyId: "cmp_1",
    applicationId: "app_1",
    createdById: "usr_1",
    title: "Error en login",
    description: "Falla al autenticar usuarios validos.",
  });

  assert.equal(ticket.status, TicketStatus.PENDING);
  assert.equal(ticket.statusHistory.length, 1);
  assert.equal(ticket.statusHistory[0].toStatus, TicketStatus.PENDING);
});

test("cambia estado y registra auditoria", () => {
  const ticket = Ticket.create({
    id: "tck_1",
    initialLogId: "log_1",
    companyId: "cmp_1",
    applicationId: "app_1",
    createdById: "usr_1",
    title: "Error en carga",
  });

  ticket.changeStatus({
    status: TicketStatus.IN_PROGRESS,
    changedById: "usr_2",
    note: "Tomado por desarrollo.",
    logId: "log_2",
  });

  assert.equal(ticket.status, TicketStatus.IN_PROGRESS);
  assert.equal(ticket.statusHistory.length, 2);
  assert.equal(ticket.statusHistory[0].fromStatus, TicketStatus.PENDING);
  assert.equal(ticket.statusHistory[0].toStatus, TicketStatus.IN_PROGRESS);
});

test("rechaza tickets sin titulo", () => {
  assert.throws(
    () =>
      Ticket.create({
        id: "tck_1",
        initialLogId: "log_1",
        companyId: "cmp_1",
        applicationId: "app_1",
        createdById: "usr_1",
        title: " ",
      }),
    DomainError
  );
});
