const {
  ALLOWED_EVIDENCE_MIME_TYPES,
  EvidenceType,
  MAX_EVIDENCE_SIZE_BYTES,
} = require("./constants");
const { BaseEntity } = require("./BaseEntity");
const { assertInSet, requiredId, requiredText } = require("./validation");
const { DomainError } = require("./errors");

const inferEvidenceType = (mimeType) =>
  String(mimeType || "").startsWith("image/")
    ? EvidenceType.IMAGE
    : EvidenceType.DOCUMENT;

class Evidence extends BaseEntity {
  constructor({
    id,
    ticketId,
    companyId,
    uploadedById,
    fileName,
    mimeType,
    size,
    storagePath,
    publicUrl,
    createdAt,
    updatedAt,
  }) {
    super({ id, createdAt, updatedAt });
    this.ticketId = requiredId(ticketId, "El ticket");
    this.companyId = requiredId(companyId, "La empresa");
    this.uploadedById = requiredId(uploadedById, "El usuario");
    this.fileName = requiredText(fileName, "El nombre del archivo", 180);
    this.mimeType = assertInSet(
      mimeType,
      ALLOWED_EVIDENCE_MIME_TYPES,
      "El tipo de archivo"
    );
    this.type = inferEvidenceType(this.mimeType);
    this.size = Number(size || 0);
    this.storagePath = requiredText(storagePath, "La ruta de almacenamiento", 500);
    this.publicUrl = publicUrl || "";

    if (!Number.isFinite(this.size) || this.size <= 0) {
      throw new DomainError("El archivo no tiene un tamano valido.");
    }

    if (this.size > MAX_EVIDENCE_SIZE_BYTES) {
      throw new DomainError("El archivo supera el tamano maximo permitido.", {
        maxBytes: MAX_EVIDENCE_SIZE_BYTES,
        size: this.size,
      });
    }
  }

  static create(payload) {
    return new Evidence(payload);
  }

  static fromPersistence(record) {
    return new Evidence(record);
  }
}

module.exports = {
  Evidence,
  inferEvidenceType,
};
