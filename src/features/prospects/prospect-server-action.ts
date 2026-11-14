import { reviewProspectSubmission, updateProspect } from './actions'

export class ProspectServerAction {
  static readonly update = updateProspect
  static readonly review = reviewProspectSubmission
}
