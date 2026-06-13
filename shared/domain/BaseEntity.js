class BaseEntity {
  constructor({ id, createdAt, updatedAt }) {
    this.id = id;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || this.createdAt;
  }

  touch(date = new Date()) {
    this.updatedAt = date.toISOString();
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = {
  BaseEntity,
};
