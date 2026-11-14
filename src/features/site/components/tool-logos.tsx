import Image from 'next/image'

const tools = [
  { name: 'Salesforce', file: 'salesforce.svg' },
  { name: 'Microsoft 365', file: 'microsoft-365.svg' },
  { name: 'Canva', file: 'canva.png' },
  { name: 'Google Drive', file: 'google-drive.svg' },
  { name: 'Slack', file: 'slack.svg' },
  { name: 'Trello', file: 'trello.svg' },
]

export function ToolLogos() {
  return (
    <section aria-label="Tools we work with" className="border-t border-rule bg-white">
      <ul role="list" className="site-shell grid max-w-xl grid-cols-3 place-items-center gap-x-4 gap-y-6 py-8 sm:grid-cols-6 sm:py-10">
        {tools.map(({ name, file }) => (
          <li key={file} className="flex h-9 w-14 items-center justify-center">
            <Image src={`/images/tools/${file}`} alt={name} width={56} height={36} unoptimized
              className="h-full w-full object-contain" />
          </li>
        ))}
      </ul>
    </section>
  )
}
