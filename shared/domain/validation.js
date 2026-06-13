const { DomainError } = require("./errors");

const normalizeText = (value) => String(value || "").trim();

const requiredText = (value, fieldName, maxLength) => {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new DomainError(`${fieldName} es obligatorio.`);
  }

  if (maxLength && normalized.length > maxLength) {
    throw new DomainError(`${fieldName} no puede superar ${maxLength} caracteres.`);
  }

  return normalized;
};

const optionalText = (value, fieldName, maxLength) => {
  const normalized = normalizeText(value);

  if (maxLength && normalized.length > maxLength) {
    throw new DomainError(`${fieldName} no puede superar ${maxLength} caracteres.`);
  }

  return normalized;
};

const requiredId = (value, fieldName) => {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new DomainError(`${fieldName} es obligatorio.`);
  }

  return normalized;
};

const assertInSet = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw new DomainError(`${fieldName} no tiene un valor valido.`, {
      allowedValues,
      value,
    });
  }

  return value;
};

module.exports = {
  assertInSet,
  normalizeText,
  optionalText,
  requiredId,
  requiredText,
};
