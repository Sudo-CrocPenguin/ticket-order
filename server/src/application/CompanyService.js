const {
  Application,
  AuthorizationError,
  Company,
  DomainError,
  User,
  UserRole,
} = require("../../../shared/domain");
const { createId } = require("../utils/id");

const slugify = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const assertStrongPassword = (password) => {
  const normalized = String(password || "");

  if (normalized.length < 8) {
    throw new DomainError("La contrasena debe tener al menos 8 caracteres.");
  }

  return normalized;
};

class CompanyService {
  constructor({ database, passwordHasher }) {
    this.database = database;
    this.passwordHasher = passwordHasher;
  }

  ensureCompanyAdmin(user) {
    if (!user.canManageCompany()) {
      throw new AuthorizationError(
        "Solo administradores pueden gestionar empresa, aplicaciones y usuarios."
      );
    }
  }

  ensureUniqueCompanySlug(state, slug) {
    if (state.companies.some((company) => company.slug === slug)) {
      throw new DomainError("Ya existe una empresa con ese identificador.");
    }
  }

  ensureUniqueEmail(state, email) {
    if (state.users.some((user) => user.email === email)) {
      throw new DomainError("Ya existe un usuario con ese correo.");
    }
  }

  ensureUniqueEmailForUpdate(state, email, userId) {
    if (state.users.some((user) => user.email === email && user.id !== userId)) {
      throw new DomainError("Ya existe un usuario con ese correo.");
    }
  }

  ensureActiveAdminRemains(state, companyId, targetUserId, nextRole, nextIsActive) {
    const activeAdmins = state.users.filter(
      (item) =>
        item.companyId === companyId &&
        item.id !== targetUserId &&
        item.role === UserRole.ADMIN &&
        item.isActive !== false
    );
    const targetWillRemainAdmin =
      nextRole === UserRole.ADMIN && nextIsActive !== false;

    if (!targetWillRemainAdmin && activeAdmins.length === 0) {
      throw new DomainError("La empresa debe conservar al menos un administrador activo.");
    }
  }

  async registerCompany(payload) {
    return this.database.update((state) => {
      const companySlug = slugify(payload.companySlug || payload.companyName);
      const adminEmail = normalizeEmail(payload.adminEmail);
      const adminPassword = assertStrongPassword(payload.adminPassword);

      this.ensureUniqueCompanySlug(state, companySlug);
      this.ensureUniqueEmail(state, adminEmail);

      const company = Company.create({
        id: createId("cmp"),
        name: payload.companyName,
        slug: companySlug,
      }).toJSON();
      const application = Application.create({
        id: createId("app"),
        companyId: company.id,
        name: payload.applicationName || "Aplicacion Principal",
        description: payload.applicationDescription || "",
      }).toJSON();
      const password = this.passwordHasher.hash(adminPassword);
      const admin = User.create({
        id: createId("usr"),
        companyId: company.id,
        name: payload.adminName,
        email: adminEmail,
        role: UserRole.ADMIN,
        passwordHash: password.passwordHash,
        passwordSalt: password.passwordSalt,
      });

      state.companies.push(company);
      state.applications.push(application);
      state.users.push(admin.toJSON());

      return {
        company,
        application,
        user: admin.toPublicJSON(),
      };
    });
  }

  async getCurrentCompany(user) {
    const state = await this.database.read();
    const company = state.companies.find((item) => item.id === user.companyId);
    const applications = state.applications
      .filter((item) => item.companyId === user.companyId)
      .map((item) => Application.fromPersistence(item).toJSON());

    return {
      company: company ? Company.fromPersistence(company).toJSON() : null,
      applications,
    };
  }

  async createApplication(user, payload) {
    this.ensureCompanyAdmin(user);

    return this.database.update((state) => {
      const existing = state.applications.find(
        (application) =>
          application.companyId === user.companyId &&
          application.name.trim().toLowerCase() ===
            String(payload.name || "").trim().toLowerCase()
      );

      if (existing) {
        throw new DomainError("Ya existe una aplicacion con ese nombre.");
      }

      const application = Application.create({
        id: createId("app"),
        companyId: user.companyId,
        name: payload.name,
        description: payload.description,
      }).toJSON();

      state.applications.push(application);
      return application;
    });
  }

  async updateApplication(user, applicationId, payload) {
    this.ensureCompanyAdmin(user);

    return this.database.update((state) => {
      const index = state.applications.findIndex(
        (application) =>
          application.id === applicationId && application.companyId === user.companyId
      );

      if (index === -1) {
        throw new DomainError("La aplicacion solicitada no existe.");
      }

      const duplicatedName = state.applications.find(
        (application) =>
          application.companyId === user.companyId &&
          application.id !== applicationId &&
          application.name.trim().toLowerCase() ===
            String(payload.name || state.applications[index].name)
              .trim()
              .toLowerCase()
      );

      if (duplicatedName) {
        throw new DomainError("Ya existe una aplicacion con ese nombre.");
      }

      const application = Application.fromPersistence(state.applications[index]).update({
        name: payload.name,
        description: payload.description,
        isActive: payload.isActive,
      });

      state.applications[index] = application.toJSON();
      return state.applications[index];
    });
  }

  async listUsers(user) {
    this.ensureCompanyAdmin(user);

    const state = await this.database.read();

    return state.users
      .filter((item) => item.companyId === user.companyId)
      .map((item) => User.fromPersistence(item).toPublicJSON());
  }

  async createUser(user, payload) {
    this.ensureCompanyAdmin(user);

    return this.database.update((state) => {
      const email = normalizeEmail(payload.email);
      const password = assertStrongPassword(payload.password);
      const role = payload.role || UserRole.DEVELOPER;

      this.ensureUniqueEmail(state, email);

      const userEntity = User.create({
        id: createId("usr"),
        companyId: user.companyId,
        name: payload.name,
        email,
        role,
        ...this.passwordHasher.hash(password),
      });

      state.users.push(userEntity.toJSON());
      return userEntity.toPublicJSON();
    });
  }

  async updateUser(user, userId, payload) {
    this.ensureCompanyAdmin(user);

    return this.database.update((state) => {
      const index = state.users.findIndex(
        (item) => item.id === userId && item.companyId === user.companyId
      );

      if (index === -1) {
        throw new DomainError("El usuario solicitado no existe.");
      }

      const current = User.fromPersistence(state.users[index]);
      const nextEmail =
        payload.email !== undefined ? normalizeEmail(payload.email) : current.email;
      const nextRole = payload.role !== undefined ? payload.role : current.role;
      const nextIsActive =
        payload.isActive !== undefined ? Boolean(payload.isActive) : current.isActive;

      this.ensureUniqueEmailForUpdate(state, nextEmail, current.id);
      this.ensureActiveAdminRemains(
        state,
        user.companyId,
        current.id,
        nextRole,
        nextIsActive
      );

      const updatedUser = current.updateProfile({
        name: payload.name,
        email: nextEmail,
        role: nextRole,
        isActive: nextIsActive,
      });

      state.users[index] = updatedUser.toJSON();
      return updatedUser.toPublicJSON();
    });
  }
}

module.exports = {
  CompanyService,
  slugify,
};
