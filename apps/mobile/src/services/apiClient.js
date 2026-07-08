import { API_URL } from "../config/environment";

class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

class ApiClient {
  constructor({ baseUrl }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = "";
  }

  setToken(token) {
    this.token = token || "";
  }

  async request(path, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new ApiError(
        payload?.error || "No se pudo completar la solicitud.",
        response.status,
        payload?.details || {}
      );
    }

    return payload;
  }

  get(path) {
    return this.request(path);
  }

  post(path, body) {
    return this.request(path, {
      method: "POST",
      body,
    });
  }

  patch(path, body) {
    return this.request(path, {
      method: "PATCH",
      body,
    });
  }
}

export const apiClient = new ApiClient({ baseUrl: API_URL });
export { ApiClient, ApiError };
