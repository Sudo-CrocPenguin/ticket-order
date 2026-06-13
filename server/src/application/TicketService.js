const {
  AuthorizationError,
  ALLOWED_EVIDENCE_MIME_TYPES,
  DomainError,
  Evidence,
  MAX_EVIDENCE_SIZE_BYTES,
  NotFoundError,
  Ticket,
  TicketPriority,
  TicketStatus,
  UserRole,
} = require("../../../shared/domain");
const { createId } = require("../utils/id");

const normalizeQuery = (value) => String(value || "").trim().toLowerCase();

const canWriteTickets = (user) =>
  [UserRole.ADMIN, UserRole.DEVELOPER].includes(user.role);

class TicketService {
  constructor({ database, fileStorage }) {
    this.database = database;
    this.fileStorage = fileStorage;
  }

  ensureWriteAccess(user) {
    if (!canWriteTickets(user)) {
      throw new AuthorizationError("Solo administradores y desarrolladores pueden modificar tickets.");
    }
  }

  findApplicationOrFail(state, user, applicationId) {
    const application = state.applications.find(
      (item) => item.id === applicationId && item.companyId === user.companyId
    );

    if (!application) {
      throw new DomainError("La aplicacion seleccionada no pertenece a tu empresa.");
    }

    return application;
  }

  findTicketOrFail(state, user, ticketId) {
    const ticket = state.tickets.find(
      (item) => item.id === ticketId && item.companyId === user.companyId
    );

    if (!ticket) {
      throw new NotFoundError("El ticket solicitado no existe.");
    }

    return ticket;
  }

  async listTickets(user, filters = {}) {
    const state = await this.database.read();
    const query = normalizeQuery(filters.search);

    return state.tickets
      .filter((ticket) => ticket.companyId === user.companyId)
      .filter((ticket) => !filters.status || ticket.status === filters.status)
      .filter(
        (ticket) =>
          !filters.applicationId || ticket.applicationId === filters.applicationId
      )
      .filter((ticket) => {
        if (!query) return true;

        return [
          ticket.id,
          ticket.title,
          ticket.description,
          ticket.status,
          ticket.priority,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async getTicket(user, ticketId) {
    const state = await this.database.read();
    return Ticket.fromPersistence(this.findTicketOrFail(state, user, ticketId)).toJSON();
  }

  async createTicket(user, payload) {
    this.ensureWriteAccess(user);

    return this.database.update((state) => {
      this.findApplicationOrFail(state, user, payload.applicationId);

      const ticket = Ticket.create({
        id: createId("tck"),
        initialLogId: createId("log"),
        companyId: user.companyId,
        applicationId: payload.applicationId,
        createdById: user.id,
        title: payload.title,
        description: payload.description,
        priority: payload.priority || TicketPriority.MEDIUM,
      }).toJSON();

      state.tickets.push(ticket);
      return ticket;
    });
  }

  async changeStatus(user, ticketId, payload) {
    this.ensureWriteAccess(user);

    return this.database.update((state) => {
      const ticketRecord = this.findTicketOrFail(state, user, ticketId);
      const ticket = Ticket.fromPersistence(ticketRecord).changeStatus({
        status: payload.status || TicketStatus.PENDING,
        changedById: user.id,
        note: payload.note,
        logId: createId("log"),
      });
      const index = state.tickets.findIndex((item) => item.id === ticket.id);
      state.tickets[index] = ticket.toJSON();
      return state.tickets[index];
    });
  }

  async addComment(user, ticketId, payload) {
    this.ensureWriteAccess(user);

    return this.database.update((state) => {
      const ticketRecord = this.findTicketOrFail(state, user, ticketId);
      const ticket = Ticket.fromPersistence(ticketRecord).addComment({
        id: createId("cmt"),
        authorId: user.id,
        body: payload.body,
      });
      const index = state.tickets.findIndex((item) => item.id === ticket.id);
      state.tickets[index] = ticket.toJSON();
      return state.tickets[index];
    });
  }

  async addEvidence(user, ticketId, payload) {
    this.ensureWriteAccess(user);

    if (!payload.contentBase64) {
      throw new DomainError("El contenido del archivo es obligatorio.");
    }

    if (!ALLOWED_EVIDENCE_MIME_TYPES.includes(payload.mimeType)) {
      throw new DomainError("El tipo de archivo no esta permitido.");
    }

    const decodedSize = Buffer.byteLength(payload.contentBase64, "base64");

    if (decodedSize > MAX_EVIDENCE_SIZE_BYTES) {
      throw new DomainError("El archivo supera el tamano maximo permitido.", {
        maxBytes: MAX_EVIDENCE_SIZE_BYTES,
        size: decodedSize,
      });
    }

    const state = await this.database.read();
    const ticketRecord = this.findTicketOrFail(state, user, ticketId);
    const evidenceId = createId("evd");
    const storedFile = await this.fileStorage.saveEvidence({
      companyId: user.companyId,
      ticketId,
      evidenceId,
      fileName: payload.fileName,
      contentBase64: payload.contentBase64,
    });

    const evidence = Evidence.create({
      id: evidenceId,
      ticketId,
      companyId: user.companyId,
      uploadedById: user.id,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      size: storedFile.size,
      storagePath: storedFile.relativePath,
      publicUrl: `/api/evidences/${evidenceId}/download`,
    }).toJSON();

    return this.database.update((latestState) => {
      const latestTicketRecord = this.findTicketOrFail(latestState, user, ticketRecord.id);
      const ticket = Ticket.fromPersistence(latestTicketRecord).addEvidence(evidence);
      const index = latestState.tickets.findIndex((item) => item.id === ticket.id);
      latestState.tickets[index] = ticket.toJSON();
      return latestState.tickets[index];
    });
  }

  async getEvidenceFile(user, evidenceId) {
    const state = await this.database.read();
    const ticket = state.tickets
      .filter((item) => item.companyId === user.companyId)
      .find((item) => item.evidences.some((evidence) => evidence.id === evidenceId));

    if (!ticket) {
      throw new NotFoundError("La evidencia solicitada no existe.");
    }

    const evidence = ticket.evidences.find((item) => item.id === evidenceId);
    const content = await this.fileStorage.read(evidence.storagePath);

    return {
      evidence,
      content,
    };
  }
}

module.exports = {
  TicketService,
};
