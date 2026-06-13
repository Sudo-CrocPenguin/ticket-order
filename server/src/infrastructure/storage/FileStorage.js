const fs = require("node:fs/promises");
const path = require("node:path");

const sanitizeFileName = (fileName) =>
  String(fileName || "evidence")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

class FileStorage {
  constructor({ uploadDir }) {
    this.uploadDir = uploadDir;
  }

  async saveEvidence({ companyId, ticketId, evidenceId, fileName, contentBase64 }) {
    const safeName = sanitizeFileName(fileName);
    const relativePath = path.join(companyId, ticketId, `${evidenceId}-${safeName}`);
    const absolutePath = path.join(this.uploadDir, relativePath);
    const buffer = Buffer.from(contentBase64, "base64");

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);

    return {
      absolutePath,
      relativePath,
      size: buffer.byteLength,
    };
  }

  async read(relativePath) {
    return fs.readFile(path.join(this.uploadDir, relativePath));
  }
}

module.exports = {
  FileStorage,
  sanitizeFileName,
};
