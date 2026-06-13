const { BaseEntity } = require("./BaseEntity");
const { TicketPriority, TicketStatus } = require("./constants");
const { assertInSet, optionalText, requiredId, requiredText } = require("./validation");
const { DomainError } = require("./errors");

class TicketStatusLog {
  constructor({ id, ticketId, fromStatus, toStatus, changedById, note, createdAt }) {
    this.id = requiredId(id, "El registro de estado");
    this.ticketId = requiredId(ticketId, "El ticket");
    this.fromStatus = fromStatus || null;
    this.toStatus = assertInSet(
      toStatus,
      Object.values(TicketStatus),
      "El estado destino"
    );
    this.changedById = requiredId(changedById, "El usuario");
    this.note = optionalText(note, "La nota del cambio", 500);
    this.createdAt = createdAt || new Date().toISOString();
  }

  toJSON() {
    return { ...this };
  }
}

class TicketComment {
  constructor({ id, ticketId, authorId, body, createdAt }) {
    this.id = requiredId(id, "El comentario");
    this.ticketId = requiredId(ticketId, "El ticket");
    this.authorId = requiredId(authorId, "El autor");
    this.body = requiredText(body, "El comentario", 1000);
    this.createdAt = createdAt || new Date().toISOString();
  }

  toJSON() {
    return { ...this };
  }
}

class Ticket extends BaseEntity {
  constructor({
    id,
    companyId,
    applicationId,
    createdById,
    title,
    description,
    status,
    priority,
    evidences,
    comments,
    statusHistory,
    createdAt,
    updatedAt,
    completedAt,
  }) {
    super({ id, createdAt, updatedAt });
    this.companyId = requiredId(companyId, "La empresa");
    this.applicationId = requiredId(applicationId, "La aplicacion");
    this.createdById = requiredId(createdById, "El creador");
    this.title = requiredText(title, "El titulo", 120);
    this.description = optionalText(description, "La descripcion", 1200);
    this.status = assertInSet(
      status || TicketStatus.PENDING,
      Object.values(TicketStatus),
      "El estado"
    );
    this.priority = assertInSet(
      priority || TicketPriority.MEDIUM,
      Object.values(TicketPriority),
      "La prioridad"
    );
    this.evidences = Array.isArray(evidences) ? evidences : [];
    this.comments = Array.isArray(comments)
      ? comments.map((comment) => new TicketComment(comment).toJSON())
      : [];
    this.statusHistory = Array.isArray(statusHistory)
      ? statusHistory.map((log) => new TicketStatusLog(log).toJSON())
      : [];
    this.completedAt = completedAt || null;
  }

  changeStatus({ status, changedById, note, logId }) {
    const nextStatus = assertInSet(status, Object.values(TicketStatus), "El estado");

    if (this.status === nextStatus) {
      throw new DomainError("El ticket ya tiene ese estado.");
    }

    const previousStatus = this.status;
    this.status = nextStatus;
    this.completedAt =
      nextStatus === TicketStatus.COMPLETED ? new Date().toISOString() : null;
    this.touch();
    this.statusHistory.unshift(
      new TicketStatusLog({
        id: logId,
        ticketId: this.id,
        fromStatus: previousStatus,
        toStatus: nextStatus,
        changedById,
        note,
      }).toJSON()
    );

    return this;
  }

  addEvidence(evidence) {
    this.evidences.unshift(evidence);
    this.touch();
    return this;
  }

  addComment({ id, authorId, body }) {
    this.comments.unshift(
      new TicketComment({
        id,
        ticketId: this.id,
        authorId,
        body,
      }).toJSON()
    );
    this.touch();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      companyId: this.companyId,
      applicationId: this.applicationId,
      createdById: this.createdById,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      evidences: this.evidences,
      comments: this.comments,
      statusHistory: this.statusHistory,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
    };
  }

  static create(payload) {
    return new Ticket({
      ...payload,
      status: TicketStatus.PENDING,
      statusHistory: [
        new TicketStatusLog({
          id: payload.initialLogId,
          ticketId: payload.id,
          fromStatus: null,
          toStatus: TicketStatus.PENDING,
          changedById: payload.createdById,
          note: "Ticket creado.",
        }).toJSON(),
      ],
    });
  }

  static fromPersistence(record) {
    return new Ticket(record);
  }
}

module.exports = {
  Ticket,
  TicketComment,
  TicketStatusLog,
};
