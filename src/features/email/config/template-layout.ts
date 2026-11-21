export const bodySlot = '{{body}}'
export const composeBodySlotAttribute = 'data-compose-body-slot'
export const maxTemplateHtmlLength = 40_000

const messageStyle = 'text-align:left;font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#242424'

export function plainTemplateHtml(message = bodySlot) {
  return `<div align="left" style="margin:0;${messageStyle}">${message}</div>`
}

export function brandedTemplateHtml(header: string, footer: string, message = bodySlot) {
  return `<div style="max-width:600px;margin:0;text-align:left">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
    ${header ? `<tr><td style="padding:16px 24px">${header}</td></tr>` : ''}
    <tr><td style="padding:16px 24px;${messageStyle}">${message}</td></tr>
    ${footer ? `<tr><td style="padding:16px 24px">${footer}</td></tr>` : ''}
  </table>
</div>`
}
