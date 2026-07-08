export const TICKET_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

export const TICKET_STATUS_LABELS = {
  [TICKET_STATUS.PENDING]: "Pendiente",
  [TICKET_STATUS.IN_PROGRESS]: "En progreso",
  [TICKET_STATUS.COMPLETED]: "Completado",
};

export const TICKET_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export const TICKET_PRIORITY_LABELS = {
  [TICKET_PRIORITY.LOW]: "Baja",
  [TICKET_PRIORITY.MEDIUM]: "Media",
  [TICKET_PRIORITY.HIGH]: "Alta",
  [TICKET_PRIORITY.CRITICAL]: "Critica",
};
