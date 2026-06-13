const TicketStatus = Object.freeze({
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
});

const TicketStatusLabels = Object.freeze({
  [TicketStatus.PENDING]: "Pendiente",
  [TicketStatus.IN_PROGRESS]: "En progreso",
  [TicketStatus.COMPLETED]: "Completado",
});

const TicketPriority = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
});

const TicketPriorityLabels = Object.freeze({
  [TicketPriority.LOW]: "Baja",
  [TicketPriority.MEDIUM]: "Media",
  [TicketPriority.HIGH]: "Alta",
  [TicketPriority.CRITICAL]: "Critica",
});

const UserRole = Object.freeze({
  ADMIN: "admin",
  DEVELOPER: "developer",
  VIEWER: "viewer",
});

const EvidenceType = Object.freeze({
  IMAGE: "image",
  DOCUMENT: "document",
});

const ALLOWED_EVIDENCE_MIME_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MAX_EVIDENCE_SIZE_BYTES = 10 * 1024 * 1024;

module.exports = {
  ALLOWED_EVIDENCE_MIME_TYPES,
  EvidenceType,
  MAX_EVIDENCE_SIZE_BYTES,
  TicketPriority,
  TicketPriorityLabels,
  TicketStatus,
  TicketStatusLabels,
  UserRole,
};
