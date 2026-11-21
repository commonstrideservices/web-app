import {
  addProfessionalEmailTemplate,
  deleteEmailTemplate,
  makeEmailMailboxDefault,
  saveEmailDraft,
  sendEmailMessage,
  testEmailMailbox,
  updateEmailMailbox,
  updateEmailTemplate,
} from './actions'

export class EmailServerAction {
  static readonly addProfessionalTemplate = addProfessionalEmailTemplate
  static readonly updateMailbox = updateEmailMailbox
  static readonly makeDefault = makeEmailMailboxDefault
  static readonly testMailbox = testEmailMailbox
  static readonly updateTemplate = updateEmailTemplate
  static readonly deleteTemplate = deleteEmailTemplate
  static readonly saveDraft = saveEmailDraft
  static readonly sendMessage = sendEmailMessage
}
