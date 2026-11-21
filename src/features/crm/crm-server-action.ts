import { searchCompanies, upsertCompany, upsertContact } from './actions'

export class CrmServerAction {
  static readonly saveCompany = upsertCompany
  static readonly saveContact = upsertContact
  static readonly searchCompanies = searchCompanies
}
