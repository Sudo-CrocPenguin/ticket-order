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
    isActive,
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
    this.isActive = isActive !== false;
  }

  canManageTickets() {
    if (!this.isActive) return false;
    return [UserRole.ADMIN, UserRole.DEVELOPER].includes(this.role);
  }

  canManageCompany() {
    return this.isActive && this.role === UserRole.ADMIN;
  }

  updateProfile({ name, email, role, isActive }) {
    if (name !== undefined) {
      this.name = requiredText(name, "El nombre del usuario", 120);
    }

    if (email !== undefined) {
      this.email = requiredText(email, "El correo", 180).toLowerCase();
    }

    if (role !== undefined) {
      this.role = assertInSet(role, Object.values(UserRole), "El rol");
    }

    if (isActive !== undefined) {
      this.isActive = Boolean(isActive);
    }

    this.touch();
    return this;
  }

  toPublicJSON() {
    return {
      id: this.id,
      companyId: this.companyId,
      name: this.name,
      email: this.email,
      role: this.role,
      isActive: this.isActive,
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
