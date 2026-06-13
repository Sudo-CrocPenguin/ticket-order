const { Application, Company } = require("../../../shared/domain");

class CompanyService {
  constructor({ database }) {
    this.database = database;
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
}

module.exports = {
  CompanyService,
};
