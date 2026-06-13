const { AuthorizationError, User } = require("../../../shared/domain");

class AuthService {
  constructor({ database, passwordHasher, tokenService }) {
    this.database = database;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async login({ email, password }) {
    const state = await this.database.read();
    const userRecord = state.users.find(
      (user) => user.email === String(email || "").trim().toLowerCase()
    );

    if (
      !userRecord ||
      !this.passwordHasher.verify(
        password,
        userRecord.passwordHash,
        userRecord.passwordSalt
      )
    ) {
      throw new AuthorizationError("Correo o contrasena incorrectos.");
    }

    const user = User.fromPersistence(userRecord);
    const token = this.tokenService.sign({
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
    });

    return {
      token,
      user: user.toPublicJSON(),
    };
  }

  async resolveUserFromToken(token) {
    const payload = this.tokenService.verify(token);
    const state = await this.database.read();
    const userRecord = state.users.find((user) => user.id === payload.sub);

    if (!userRecord) {
      throw new AuthorizationError("La sesion no corresponde a un usuario activo.");
    }

    return User.fromPersistence(userRecord);
  }
}

module.exports = {
  AuthService,
};
