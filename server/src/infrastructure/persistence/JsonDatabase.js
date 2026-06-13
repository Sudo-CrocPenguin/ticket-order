const fs = require("node:fs/promises");
const path = require("node:path");

const createEmptyState = () => ({
  companies: [],
  applications: [],
  users: [],
  tickets: [],
});

class JsonDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.writeQueue = Promise.resolve();
  }

  async read() {
    try {
      const content = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(content);

      return {
        ...createEmptyState(),
        ...parsed,
      };
    } catch (error) {
      if (error.code === "ENOENT") {
        return createEmptyState();
      }

      throw error;
    }
  }

  async write(state) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmpFile = `${this.filePath}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(state, null, 2));
    await fs.rename(tmpFile, this.filePath);
  }

  async update(mutator) {
    const operation = this.writeQueue.then(async () => {
      const state = await this.read();
      const result = await mutator(state);
      await this.write(state);
      return result;
    });

    this.writeQueue = operation.catch(() => {});
    return operation;
  }
}

module.exports = {
  JsonDatabase,
  createEmptyState,
};
