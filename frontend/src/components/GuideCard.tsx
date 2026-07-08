import { Card, Image, Text, UnstyledButton } from '@mantine/core'
import type { Guide } from '../constants/guides'

interface GuideCardProps {
  guide: Guide
}
function handleGuideClick(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <UnstyledButton onClick={() => handleGuideClick(guide.url)} w="100%">
      <Card withBorder radius="md" p="sm">
        <Card.Section>
          <Image src={guide.thumbnail} alt={guide.title} h={160} fit="cover" />
        </Card.Section>
        <Text fw={600} mt="sm" lineClamp={2} mih="3rem">
          {guide.title}
        </Text>
      </Card>
    </UnstyledButton>
  )
}
