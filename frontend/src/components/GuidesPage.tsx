import { Container, Stack, Title } from '@mantine/core'
import { GuideCarousel } from './GuideCarousel'
import { MOCK_GUIDES } from '../constants/guides'

export function GuidesPage() {
  const scripts = MOCK_GUIDES.filter((guide) => guide.type === 'script')
  const videos = MOCK_GUIDES.filter((guide) => guide.type === 'video')

  return (
    <Container size="xl" py="lg">
      <Title order={1} mb="xl">
        Guides
      </Title>
      <Stack gap="xl">
        <GuideCarousel title="Scripts" guides={scripts} />
        <GuideCarousel title="Videos" guides={videos} />
      </Stack>
    </Container>
  )
}
