const { BaseEntity } = require("./BaseEntity");
const { optionalText, requiredId, requiredText } = require("./validation");

class Application extends BaseEntity {
  constructor({ id, companyId, name, description, isActive, createdAt, updatedAt }) {
    super({ id, createdAt, updatedAt });
    this.companyId = requiredId(companyId, "La empresa");
    this.name = requiredText(name, "El nombre de la aplicacion", 120);
    this.description = optionalText(description, "La descripcion de la aplicacion", 300);
    this.isActive = isActive !== false;
  }

  update({ name, description, isActive }) {
    if (name !== undefined) {
      this.name = requiredText(name, "El nombre de la aplicacion", 120);
    }

    if (description !== undefined) {
      this.description = optionalText(
        description,
        "La descripcion de la aplicacion",
        300
      );
    }

    if (isActive !== undefined) {
      this.isActive = Boolean(isActive);
    }

    this.touch();
    return this;
  }

  static create(payload) {
    return new Application(payload);
  }

  static fromPersistence(record) {
    return new Application(record);
  }
}

module.exports = {
  Application,
};
