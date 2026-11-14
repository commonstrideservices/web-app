import { IntakeQuestionnaire } from '@/features/intake/components/intake-questionnaire'
import { publicPageMetadata } from '@/features/site/metadata'

export const metadata = publicPageMetadata({
  path: '/connect',
  title: 'Request Digital Services',
  description: 'Tell Common Stride what you need for your website, social media, lead research, or virtual assistance. Send an inquiry to discuss your project.',
})

export default function ConnectPage() {
  return <IntakeQuestionnaire />
}
