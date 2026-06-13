export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 1200;

const DEFAULT_COUNTER = 1;

const toIsoDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const validateTicketInput = (title, description = "") => {
  const normalizedTitle = title.trim();
  const normalizedDescription = description.trim();

  if (!normalizedTitle) {
    return {
      ok: false,
      message: "El titulo es obligatorio.",
    };
  }

  if (normalizedTitle.length > MAX_TITLE_LENGTH) {
    return {
      ok: false,
      message: `El titulo no puede superar ${MAX_TITLE_LENGTH} caracteres.`,
    };
  }

  if (normalizedDescription.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      message: `La descripcion no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`,
    };
  }

  return {
    ok: true,
    value: {
      title: normalizedTitle,
      description: normalizedDescription,
    },
  };
};

export const createTicket = ({ id, title, description }) => {
  const createdAt = new Date().toISOString();

  return {
    id,
    title,
    description,
    status: "open",
    createdAt,
    completedAt: null,
    updatedAt: createdAt,
  };
};

export const completeTicket = (ticket) => {
  const completedAt = new Date().toISOString();

  return {
    ...ticket,
    status: "completed",
    completedAt,
    updatedAt: completedAt,
  };
};

export const reopenTicket = (ticket) => {
  const updatedAt = new Date().toISOString();

  return {
    ...ticket,
    status: "open",
    completedAt: null,
    updatedAt,
  };
};

const normalizeTicket = (ticket, fallbackStatus) => {
  const id = Number(ticket?.id);
  const title = String(ticket?.title || "").trim();

  if (!Number.isFinite(id) || !title) {
    return null;
  }

  const createdAt = toIsoDate(ticket.createdAt) || new Date(0).toISOString();
  const completedAt = toIsoDate(ticket.completedAt);
  const status = ticket.status || fallbackStatus;

  return {
    id,
    title,
    description: String(ticket?.description || "").trim(),
    status,
    createdAt,
    completedAt: status === "completed" ? completedAt || createdAt : null,
    updatedAt: toIsoDate(ticket.updatedAt) || completedAt || createdAt,
  };
};

const normalizeTicketList = (tickets, fallbackStatus) => {
  if (!Array.isArray(tickets)) return [];

  return tickets
    .map((ticket) => normalizeTicket(ticket, fallbackStatus))
    .filter(Boolean);
};

export const normalizeTicketState = (state) => {
  const tickets = normalizeTicketList(state?.tickets, "open");
  const history = normalizeTicketList(state?.history, "completed");
  const allIds = [...tickets, ...history].map((ticket) => ticket.id);
  const maxId = allIds.length ? Math.max(...allIds) : 0;
  const persistedCounter = Number(state?.counter);
  const counter =
    Number.isFinite(persistedCounter) && persistedCounter > maxId
      ? persistedCounter
      : maxId + DEFAULT_COUNTER;

  return {
    tickets,
    history,
    counter,
  };
};

export const searchTickets = (tickets, query) => {
  const term = query.trim().toLowerCase();

  if (!term) return tickets;

  return tickets.filter((ticket) => {
    const searchableText = [
      ticket.id,
      ticket.title,
      ticket.description,
      ticket.status,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(term);
  });
};

export const getTicketStats = (tickets, history, allTickets = []) => ({
  active: tickets.length,
  inProgress: allTickets.filter((ticket) => ticket.status === "in_progress").length,
  completed: history.length,
  total: allTickets.length || tickets.length + history.length,
});

export const formatTicketDate = (value) => {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
