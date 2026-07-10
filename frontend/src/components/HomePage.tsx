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
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconBrain,
  IconAdjustments,
  IconShieldCheck,
  IconDeviceFloppy,
  IconArrowRight,
} from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import { MOCK_GUIDES } from '../constants/guides'

const ORANGE = '#C85A1A'
const ORANGE_LIGHT = '#fde8d8'

const FEATURES = [
  {
    icon: IconBrain,
    title: 'AI-Powered Builds',
    description:
      'Give us your budget and what you’re looking to do, and our AI will piece together a fully compatible build in no time',
  },
  {
    icon: IconAdjustments,
    title: 'Tier System',
    description:
      'Budget, Best Value, Recommended, and Performance options then you choose what fits.',
  },
  {
    icon: IconShieldCheck,
    title: 'Compatibility Checks',
    description:
      'Socket mismatches and PSU warnings are caught automatically before you save.',
  },
  {
    icon: IconDeviceFloppy,
    title: 'Save & Load',
    description: 'Save multiple builds to your account and revisit them anytime.',
  },
]

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

      {/*Features*/}
      <Box style={{ backgroundColor: '#1a1a18' }} py={72}>
        <Container size="xl">
          <Title
            order={2}
            ta="center"
            fw={700}
            mb={8}
            style={{ color: '#f5f5f3', fontFamily: 'Geist, sans-serif' }}
          >
            Everything you need to build smarter
          </Title>
          <Text
            ta="center"
            mb={48}
            style={{ color: '#888', fontFamily: 'Geist, sans-serif' }}
          >
            No spreadsheets. No guesswork. Just a build that works.
          </Text>

          {/* 22-col grid: first card 1.4× wider */}
          <Grid columns={22} gutter="md">
            {FEATURES.map(({ icon: Icon, title, description }, i) => (
              <Grid.Col key={title} span={{ base: 22, sm: 11, lg: i === 0 ? 7 : 5 }}>
                <Card
                  padding="xl"
                  h="100%"
                  style={{
                    backgroundColor: '#252522',
                    border: i === 0
                      ? '1px solid #3a3a37'
                      : '1px solid #2e2e2b',
                    borderLeft: i === 0 ? `3px solid ${ORANGE}` : undefined,
                    borderRadius: 12,
                    fontFamily: 'Geist, sans-serif',
                  }}
                >
                  {/* Icon badge */}
                  <Box
                    mb="md"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: i === 0 ? 'rgba(200, 90, 26, 0.18)' : 'rgba(200, 90, 26, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: i === 0
                        ? '0 0 12px 3px rgba(200, 90, 26, 0.45), 0 0 28px 6px rgba(200, 90, 26, 0.2)'
                        : 'none',
                    }}
                  >
                    <Icon size={22} color={ORANGE} />
                  </Box>

                  <Text
                    fw={600}
                    mb={6}
                    style={{ color: '#f0ede8', fontFamily: 'Geist, sans-serif' }}
                  >
                    {title}
                  </Text>
                  <Text
                    size="sm"
                    lh={1.65}
                    style={{ color: '#999', fontFamily: 'Geist, sans-serif' }}
                  >
                    {description}
                  </Text>
                </Card>
              </Grid.Col>
            ))}
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