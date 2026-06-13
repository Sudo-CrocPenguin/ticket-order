const { BaseEntity } = require("./BaseEntity");
const { requiredText } = require("./validation");

class Company extends BaseEntity {
  constructor({ id, name, slug, createdAt, updatedAt }) {
    super({ id, createdAt, updatedAt });
    this.name = requiredText(name, "El nombre de la empresa", 120);
    this.slug = requiredText(slug, "El identificador de la empresa", 80);
  }

  static create(payload) {
    return new Company(payload);
  }

  static fromPersistence(record) {
    return new Company(record);
  }
}

module.exports = {
  Company,
};
