const { Application, Company, User, UserRole } = require("../../../shared/domain");
const { createId } = require("../utils/id");

class BootstrapService {
  constructor({ database, passwordHasher, config }) {
    this.database = database;
    this.passwordHasher = passwordHasher;
    this.config = config;
  }

  async ensureSeedData() {
    return this.database.update((state) => {
      if (state.companies.length && state.applications.length && state.users.length) {
        return {
          created: false,
          adminEmail: state.users[0].email,
        };
      }

      const company = Company.create({
        id: createId("cmp"),
        name: this.config.seed.companyName,
        slug: this.config.seed.companySlug,
      }).toJSON();

      const application = Application.create({
        id: createId("app"),
        companyId: company.id,
        name: this.config.seed.applicationName,
        description: "Aplicacion base para reportes de bugs y evidencias.",
      }).toJSON();

      const password = this.passwordHasher.hash(this.config.seed.adminPassword);
      const admin = User.create({
        id: createId("usr"),
        companyId: company.id,
        name: this.config.seed.adminName,
        email: this.config.seed.adminEmail,
        role: UserRole.ADMIN,
        passwordHash: password.passwordHash,
        passwordSalt: password.passwordSalt,
      }).toJSON();

      state.companies.push(company);
      state.applications.push(application);
      state.users.push(admin);

      return {
        created: true,
        adminEmail: admin.email,
      };
    });
  }
}

module.exports = {
  BootstrapService,
};
