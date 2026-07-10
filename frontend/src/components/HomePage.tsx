import { Link } from 'react-router-dom'
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Image,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import { MOCK_GUIDES } from '../constants/guides'

const ORANGE = '#C85A1A'

export function HomePage() {
  const { user } = useAuth()
  const ctaTo = user ? '/quiz' : '/signup'

  return (
    <Box style={{ fontFamily: 'Geist, sans-serif' }}>

      {/*  Hero */}
      <Box style={{ backgroundColor: '#faf8f5' }}>
        <Container size="xl" py={80}>
          <Group align="center" justify="space-between" wrap="nowrap" gap={60}>

            {/* Left copy */}
            <Stack gap="lg" maw={520}>
              <Title
                order={1}
                fz={{ base: 52, sm: 68 }}
                fw={800}
                lh={1.05}
                style={{ color: ORANGE, fontFamily: 'Geist, sans-serif' }}
              >
                Rigify
              </Title>

              <Text
                fz={{ base: 'xl', sm: 28 }}
                fw={700}
                lh={1.2}
                style={{ color: '#1a1a1a', fontFamily: 'Geist, sans-serif' }}
              >
                Your next build, done right.
              </Text>

              <Text
                size="lg"
                lh={1.7}
                style={{ color: '#555', fontFamily: 'Geist, sans-serif' }}
              >
                Tell us your budget and use case. Our AI assembles a fully compatible
                PC build in seconds and you pick the tier that fits.
              </Text>

              <Group gap="md" mt="sm">
                <Button
                  component={Link}
                  to={ctaTo}
                  size="lg"
                  style={{
                    backgroundColor: ORANGE,
                    fontFamily: 'Geist, sans-serif',
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    transition: 'background-color 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#a84815'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = ORANGE
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Build My PC
                </Button>
                <Button
                  component={Link}
                  to="/guides"
                  size="lg"
                  variant="outline"
                  style={{
                    color: '#1a1a1a',
                    fontFamily: 'Geist, sans-serif',
                    fontWeight: 500,
                    borderRadius: 8,
                    border: '1.5px solid #1a1a1a',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a'
                    e.currentTarget.style.color = '#faf8f5'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#1a1a1a'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  View Guides
                </Button>
              </Group>
            </Stack>

            {/* Right — PC image */}
            <Image
              src="/images/pc2.png"
              w={420}
              style={{ flexShrink: 0 }}
              visibleFrom="md"
              alt="PC build"
            />
          </Group>
        </Container>
      </Box>

      {/* Built Different */}
      <Box style={{ backgroundColor: '#1a1a18' }} py={80}>
        <Container size="xl">
          <Grid columns={12} align="center" gutter={{ base: 48, md: 80 }}>

            {/* Left — PC image */}
            <Grid.Col span={{ base: 12, md: 5 }} visibleFrom="md">
              <Image
                src="/images/pc3.webp"
                alt="PC build"
                fit="contain"
                style={{ opacity: 0.9, transform: 'scaleX(-1)', marginLeft: -70}}
              />
            </Grid.Col>

            {/* Right — content */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="xl">

                {/* Orange eyebrow */}
                <Text
                  size="xs"
                  fw={700}
                  style={{
                    color: ORANGE,
                    letterSpacing: '0.13em',
                    textTransform: 'uppercase',
                    fontFamily: 'Geist, sans-serif',
                  }}
                >
                  Built Different
                </Text>

                {/* Title */}
                <Title
                  order={2}
                  fz={{ base: 30, sm: 40 }}
                  fw={800}
                  lh={1.1}
                  style={{
                    color: '#f5f5f3',
                    fontFamily: 'Geist, sans-serif',
                    letterSpacing: '-0.02em',
                    marginTop: -8,
                  }}
                >
                  Everything you need to build smarter
                </Title>

                {/* Description */}
                <Text
                  size="md"
                  lh={1.8}
                  style={{
                    color: '#aaa',
                    fontFamily: 'Geist, sans-serif',
                    maxWidth: 500,
                    marginTop: -4,
                  }}
                >
                  Tell us your budget and use case. Our AI picks real parts, flags
                  compatibility issues, and gives you budget, mid-range, and performance
                  options all at once.
                </Text>

                {/* Stat blocks */}
                <Group gap={48} mt={4}>
                  <Box>
                    <Text
                      fw={800}
                      fz={34}
                      lh={1}
                      style={{ color: ORANGE, fontFamily: 'Geist, sans-serif' }}
                    >
                      1,200+
                    </Text>
                    <Text size="sm" style={{ color: '#888', fontFamily: 'Geist, sans-serif' }}>
                      real parts in database
                    </Text>
                  </Box>

                  <Box>
                    <Text
                      fw={800}
                      fz={34}
                      lh={1}
                      style={{ color: ORANGE, fontFamily: 'Geist, sans-serif' }}
                    >
                      4
                    </Text>
                    <Text size="sm" style={{ color: '#888', fontFamily: 'Geist, sans-serif' }}>
                      tier options per category
                    </Text>
                  </Box>
                </Group>

              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* -- Guides preview -- */}
      <Box style={{ backgroundColor: '#faf8f5' }}>
        <Container size="xl" py={72}>
          <Group justify="space-between" align="center" mb={32}>
            <Title
              order={2}
              fw={700}
              style={{ color: '#1a1a1a', fontFamily: 'Geist, sans-serif' }}
            >
              Latest Guides
            </Title>
            <Anchor
              component={Link}
              to="/guides"
              fw={600}
              underline="never"
              style={{ color: ORANGE, fontFamily: 'Geist, sans-serif' }}
            >
              <Group gap={4}>
                View all <IconArrowRight size={16} />
              </Group>
            </Anchor>
          </Group>

          <Grid columns={3} gutter="lg">
            {MOCK_GUIDES.slice(0, 3).map((guide) => (
              <Grid.Col key={guide.id} span={{ base: 3, sm: 1 }}>
                <Card
                  component="a"
                  href={guide.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  padding="md"
                  radius="md"
                  style={{
                    cursor: 'pointer',
                    border: '1px solid #e5e2dc',
                    backgroundColor: '#fff',
                    fontFamily: 'Geist, sans-serif',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = ORANGE}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e2dc'}
                >
                  <Card.Section>
                    <Image src={guide.thumbnail} height={140} alt={guide.title} />
                  </Card.Section>
                  <Group mt="sm" mb={6}>
                    <Badge
                      variant="light"
                      size="xs"
                      style={{
                        backgroundColor: guide.type === 'video' ? '#e8f0fe' : '#e6f4ea',
                        color: guide.type === 'video' ? '#1a56db' : '#137333',
                        fontFamily: 'Geist, sans-serif',
                      }}
                    >
                      {guide.type === 'video' ? 'Video' : 'Script'}
                    </Badge>
                  </Group>
                  <Text
                    fw={600}
                    size="sm"
                    lineClamp={2}
                    style={{ color: '#1a1a1a', fontFamily: 'Geist, sans-serif' }}
                  >
                    {guide.title}
                  </Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}