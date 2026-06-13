const { BaseEntity } = require("./BaseEntity");
const { UserRole } = require("./constants");
const { assertInSet, requiredId, requiredText } = require("./validation");

class User extends BaseEntity {
  constructor({
    id,
    companyId,
    name,
    email,
    role,
    passwordHash,
    passwordSalt,
    createdAt,
    updatedAt,
  }) {
    super({ id, createdAt, updatedAt });
    this.companyId = requiredId(companyId, "La empresa");
    this.name = requiredText(name, "El nombre del usuario", 120);
    this.email = requiredText(email, "El correo", 180).toLowerCase();
    this.role = assertInSet(role, Object.values(UserRole), "El rol");
    this.passwordHash = passwordHash || "";
    this.passwordSalt = passwordSalt || "";
  }

  canManageTickets() {
    return [UserRole.ADMIN, UserRole.DEVELOPER].includes(this.role);
  }

  canManageCompany() {
    return this.role === UserRole.ADMIN;
  }

  toPublicJSON() {
    return {
      id: this.id,
      companyId: this.companyId,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static create(payload) {
    return new User(payload);
  }

  static fromPersistence(record) {
    return new User(record);
  }
}

module.exports = {
  User,
};
