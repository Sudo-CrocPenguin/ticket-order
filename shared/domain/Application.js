const { BaseEntity } = require("./BaseEntity");
const { optionalText, requiredId, requiredText } = require("./validation");

class Application extends BaseEntity {
  constructor({ id, companyId, name, description, createdAt, updatedAt }) {
    super({ id, createdAt, updatedAt });
    this.companyId = requiredId(companyId, "La empresa");
    this.name = requiredText(name, "El nombre de la aplicacion", 120);
    this.description = optionalText(description, "La descripcion de la aplicacion", 300);
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
