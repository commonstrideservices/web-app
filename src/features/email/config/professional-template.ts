import { brandedTemplateHtml } from './template-layout'

export const professionalTemplate = {
  id: '1b3ba43a-f173-4998-adbf-5fd0e1c8599d',
  name: 'Common Stride professional email',
}

function visibleUrl(url: URL) {
  return `${url.protocol}//<wbr />${url.host}${url.pathname.replaceAll('/', '/<wbr />')}`
}

export function professionalEmailFragments() {
  const home = new URL('https://commonstrideservices.com/')
  const contact = new URL('/connect', home)
  const facebook = new URL('https://facebook.com/commonstrideservices')
  const logo = new URL('/logo.png', home).href
  const email = 'info@commonstrideservices.com'

  return {
    header: `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td width="52" valign="middle" style="padding:0 8px 10px 0;border-bottom:1px solid #e8ded7">
      <img src="${logo}" width="44" height="44" alt="" />
    </td>
    <td valign="middle" style="padding:0 0 10px;border-bottom:1px solid #e8ded7;color:#1b1917;font-family:Arial,sans-serif">
      <p style="margin:0;font-size:21px;line-height:1.15"><strong>Common <span style="color:#c44900">Stride</span></strong></p>
      <p style="margin:3px 0 0;color:#544d47;font-size:12px;line-height:1.35">Services &amp; Digital Solutions</p>
    </td>
  </tr>
</table>`,
    footer: `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td bgcolor="#faf8f5" style="background-color:#faf8f5;border-top:1px solid #e8ded7;padding:12px 14px;color:#1b1917;font-family:Arial,sans-serif;font-size:13px;line-height:1.45">
      <p style="margin:0 0 8px"><strong>Email</strong><br /><a href="mailto:${email}" style="color:#843900;text-decoration:underline">${email.replace('@', '@<wbr />')}</a></p>
      <p style="margin:0 0 8px"><strong>Website</strong><br /><a href="${home.href}" style="color:#843900;text-decoration:underline">${visibleUrl(home)}</a></p>
      <p style="margin:0 0 8px"><strong>Inquire</strong><br /><a href="${contact.href}" style="color:#843900;text-decoration:underline">${visibleUrl(contact)}</a></p>
      <p style="margin:0"><strong>Facebook</strong><br /><a href="${facebook.href}" style="color:#843900;text-decoration:underline">${visibleUrl(facebook)}</a></p>
    </td>
  </tr>
</table>`,
  }
}

export function professionalEmailHtml() {
  const { header, footer } = professionalEmailFragments()
  return brandedTemplateHtml(header, footer)
}
