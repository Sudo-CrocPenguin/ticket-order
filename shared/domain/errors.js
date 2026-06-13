class DomainError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "DomainError";
    this.details = details;
  }
}

class AuthorizationError extends Error {
  constructor(message = "No tienes permisos para ejecutar esta accion.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

class NotFoundError extends Error {
  constructor(message = "El recurso solicitado no existe.") {
    super(message);
    this.name = "NotFoundError";
  }
}

module.exports = {
  AuthorizationError,
  DomainError,
  NotFoundError,
};
