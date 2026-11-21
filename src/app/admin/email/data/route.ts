import { folderPath, mailboxId, readMailLocation, readMailPage } from '@/features/email/model'
import { emailErrorMessage, getEmailAdministrator } from '@/features/email/server/access'
import { readMailbox, readMailboxMessage } from '@/features/email/server/imap'

const headers = { 'Cache-Control': 'private, no-store' }

export async function GET(request: Request) {
  if (!await getEmailAdministrator()) {
    return Response.json({ error: 'Sign in as an administrator to open email.' }, { status: 403, headers })
  }

  const params = new URL(request.url).searchParams
  const id = mailboxId.safeParse(params.get('mailbox'))
  const folder = folderPath.safeParse(params.get('folder'))
  const location = readMailLocation(params)
  if (!id.success || !folder.success || ((params.has('uid') || params.has('validity')) && !location)) {
    return Response.json({ error: 'This email link is invalid.' }, { status: 400, headers })
  }

  try {
    if (!location) {
      const view = await readMailbox(id.data, folder.data, readMailPage(params.get('page')))
      return Response.json(view, { headers })
    }
    const message = await readMailboxMessage(id.data, location)
    return message
      ? Response.json(message, { headers })
      : Response.json({ error: 'This message is no longer available in the folder.' }, { status: 404, headers })
  } catch (error) {
    return Response.json({
      error: emailErrorMessage(error, 'Porkbun could not load this email. Try again in a moment.'),
    }, { status: 502, headers })
  }
}
