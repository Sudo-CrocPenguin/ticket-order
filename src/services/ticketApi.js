import { apiClient } from "./apiClient";

export const loginRequest = (credentials) =>
  apiClient.post("/auth/login", credentials);

export const registerCompanyRequest = (payload) =>
  apiClient.post("/companies/register", payload);

export const loadWorkspaceRequest = async () => {
  const [companyPayload, ticketsPayload] = await Promise.all([
    apiClient.get("/companies/current"),
    apiClient.get("/tickets"),
  ]);

  return {
    company: companyPayload.company,
    applications: companyPayload.applications,
    tickets: ticketsPayload.tickets,
  };
};

export const createTicketRequest = (payload) => apiClient.post("/tickets", payload);

export const createApplicationRequest = (payload) =>
  apiClient.post("/applications", payload);

export const listUsersRequest = () => apiClient.get("/users");

export const createUserRequest = (payload) => apiClient.post("/users", payload);

export const changeTicketStatusRequest = (ticketId, payload) =>
  apiClient.patch(`/tickets/${ticketId}/status`, payload);

export const addTicketEvidenceRequest = (ticketId, payload) =>
  apiClient.post(`/tickets/${ticketId}/evidences`, payload);

export const addTicketCommentRequest = (ticketId, payload) =>
  apiClient.post(`/tickets/${ticketId}/comments`, payload);
