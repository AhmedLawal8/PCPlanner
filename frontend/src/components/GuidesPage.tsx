import {
  Box,
  Card,
  Container,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconBrandYoutube, IconCode } from '@tabler/icons-react'
import { MOCK_GUIDES } from '../constants/guides'

function GuideCard({
  href,
  thumbnail,
  title,
  subtitle,
}: {
  href: string
  thumbnail: string
  title: string
  subtitle: string
}) {
  return (
    <Card
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      withBorder
      radius="md"
      padding={0}
      style={{
        textDecoration: 'none',
        overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <Image src={thumbnail} alt={title} h={160} fit="cover" />
      <Stack gap={4} p="md">
        <Text fw={600} size="sm" lineClamp={2} lh={1.4} c="var(--mantine-color-text)">
          {title}
        </Text>
        <Text size="xs" c="dimmed">
          {subtitle}
        </Text>
      </Stack>
    </Card>
  )
}

export function GuidesPage() {
  const videos = MOCK_GUIDES.filter((g) => g.type === 'video')
  const scripts = MOCK_GUIDES.filter((g) => g.type === 'script')

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="xl">
        Guides
      </Title>

      {/* ── Video guides ── */}
      <Box mb="xl">
        <Group gap="xs" mb="lg">
          <IconBrandYoutube size={22} color="#FF0000" />
          <Title order={3}>Video Guides</Title>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {videos.map((video) => (
            <GuideCard
              key={video.id}
              href={video.url}
              thumbnail={video.thumbnail}
              title={video.title}
              subtitle="YouTube"
            />
          ))}
        </SimpleGrid>
      </Box>

      {/* ── Scripts & tools ── */}
      <Box>
        <Group gap="xs" mb="lg">
          <IconCode size={20} />
          <Title order={3}>Scripts & Tools</Title>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {scripts.map((script) => (
            <GuideCard
              key={script.id}
              href={script.url}
              thumbnail={script.thumbnail}
              title={script.title}
              subtitle="Script / Tool"
            />
          ))}
        </SimpleGrid>
      </Box>
    </Container>
  )
}
