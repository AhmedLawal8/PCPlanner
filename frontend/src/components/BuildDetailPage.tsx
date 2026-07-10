import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Accordion,
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconCheck, IconEdit, IconTrash, IconX, IconArrowLeft, IconBrandYoutube } from '@tabler/icons-react'
import { api, ApiError } from '../services/api'
import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  COMPONENT_FIELDS,
} from '../constants/parts'
import type { SavedBuild, PatchBuildResponse } from '../constants/parts'

interface ComponentDetail {
  id: number
  name: string
  price: number
  [key: string]: unknown
}

interface YoutubeGuide {
  video_id: string
  title: string
  thumbnail_url: string
  channel_title: string
  url: string
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <Box
      p="sm"
      style={{
        borderRadius: 8,
        border: '1px solid var(--mantine-color-gray-3)',
        backgroundColor: 'var(--mantine-color-gray-0)',
      }}
    >
      <Text size="xs" c="dimmed" mb={2}>
        {label}
      </Text>
      <Text size="sm" fw={600}>
        {value}
      </Text>
    </Box>
  )
}

export function BuildDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [build, setBuild] = useState<SavedBuild | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Rename state
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renameLoading, setRenameLoading] = useState(false)

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Inline component detail state
  const [detailKey, setDetailKey] = useState<{ cat: string; partId: number } | null>(null)
  const [detailCache, setDetailCache] = useState<Record<string, ComponentDetail>>({})
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  // YouTube guides
  const [guides, setGuides] = useState<YoutubeGuide[]>([])
  const [guidesLoading, setGuidesLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    api
      .get<SavedBuild>(`/api/builds/${id}`)
      .then((data) => {
        if (!cancelled) {
          setBuild(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) navigate('/signin')
          else setFetchError('Failed to load build.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, navigate])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    api
      .get<YoutubeGuide[]>(`/api/guides/part/${id}`)
      .then((data) => {
        if (!cancelled) setGuides(data)
      })
      .catch(() => {
        // guides are non-critical — silently skip on error
      })
      .finally(() => {
        if (!cancelled) setGuidesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <Center h={300}>
        <Loader color="brandOrange" />
      </Center>
    )
  }

  if (fetchError || !build) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" variant="light">
          {fetchError ?? 'Build not found.'}
        </Alert>
      </Container>
    )
  }

  const partGroups = CATEGORY_ORDER.filter((cat) => build.parts[cat]).map((cat) => ({
    category: cat,
    part: build.parts[cat],
  }))

  const startRename = () => {
    setRenameValue(build.name)
    setRenaming(true)
  }

  const cancelRename = () => setRenaming(false)

  const commitRename = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed) return cancelRename()
    setRenameLoading(true)
    try {
      const updated = await api.patch<PatchBuildResponse>(`/api/builds/${id}`, { name: trimmed })
      setBuild((prev) => (prev ? { ...prev, name: updated.name } : prev))
      if (updated.warnings?.length) setWarnings(updated.warnings)
      setRenaming(false)
    } catch {
      // keep input open
    } finally {
      setRenameLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.delete(`/api/builds/${id}`)
      navigate('/builds')
    } catch {
      setDeleteLoading(false)
    }
  }

  const handleDetails = async (category: string, partId: number) => {
    if (detailKey?.cat === category && detailKey?.partId === partId) {
      setDetailKey(null)
      return
    }
    setDetailKey({ cat: category, partId })
    const cacheKey = `${category}/${partId}`
    if (detailCache[cacheKey]) return
    setLoadingKey(cacheKey)
    try {
      const data = await api.get<ComponentDetail>(`/api/components/${category}/${partId}`)
      setDetailCache((prev) => ({ ...prev, [cacheKey]: data }))
    } catch {
      // leave absent; panel shows error
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <Container size="xl" py="xl">
      {/* Delete confirmation */}
      <Modal
        opened={deleteOpen}
        onClose={() => !deleteLoading && setDeleteOpen(false)}
        title="Delete Build"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">Delete "{build.name}"? This can't be undone.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button color="red" loading={deleteLoading} onClick={handleDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Back link */}
      <Group mb="lg">
        <Text
          component={Link}
          to="/builds"
          size="sm"
          c="dimmed"
          style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
        >
          <IconArrowLeft size={14} />
          My Builds
        </Text>
      </Group>

      {/* Page header with inline rename */}
      <Group justify="space-between" align="flex-start" mb="md">
        {renaming ? (
          <Group gap="xs" wrap="nowrap" style={{ flex: 1, maxWidth: 480 }}>
            <TextInput
              value={renameValue}
              onChange={(e) => setRenameValue(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void commitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              size="md"
              style={{ flex: 1 }}
              autoFocus
            />
            <ActionIcon
              size="lg"
              color="brandOrange"
              loading={renameLoading}
              onClick={() => void commitRename()}
            >
              <IconCheck size={16} />
            </ActionIcon>
            <ActionIcon size="lg" variant="default" onClick={cancelRename}>
              <IconX size={16} />
            </ActionIcon>
          </Group>
        ) : (
          <Group gap="xs">
            <Title order={2}>{build.name}</Title>
            <ActionIcon variant="subtle" color="gray" onClick={startRename}>
              <IconEdit size={16} />
            </ActionIcon>
          </Group>
        )}
        <Text size="sm" c="dimmed" pt={6}>
          {new Date(build.created_at).toLocaleDateString()}
        </Text>
      </Group>

      {/* Compatibility warnings */}
      {warnings.length > 0 && (
        <Stack gap="xs" mb="xl">
          {warnings.map((w, i) => (
            <Alert key={i} color="yellow" variant="light">
              {w}
            </Alert>
          ))}
        </Stack>
      )}

      <Grid gutter="xl" align="flex-start">
        {/* Left — parts accordion */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Accordion multiple variant="separated">
            {partGroups.map(({ category, part }) => {
              const cacheKey = `${category}/${part.id}`
              const isDetailOpen =
                detailKey?.cat === category && detailKey?.partId === part.id
              const detail = detailCache[cacheKey]
              const isDetailLoading = loadingKey === cacheKey
              const fields = (COMPONENT_FIELDS[category] ?? []).filter(
                ({ key }) => detail != null && detail[key] != null,
              )

              return (
                <Accordion.Item key={category} value={category}>
                  <Accordion.Control>
                    <Group justify="space-between" pr="sm" wrap="nowrap" gap="sm">
                      <Text fw={600} style={{ flexShrink: 0 }}>
                        {CATEGORY_LABELS[category] ?? category}
                      </Text>
                      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                        <Text
                          size="sm"
                          c="dimmed"
                          lineClamp={1}
                          style={{ minWidth: 0, flex: 1 }}
                        >
                          {part.name}
                        </Text>
                        <Text size="sm" fw={600} c="brandOrange" style={{ flexShrink: 0 }}>
                          $
                          {part.price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </Group>
                    </Group>
                  </Accordion.Control>

                  <Accordion.Panel>
                    <Stack gap="sm">
                      {/* Part tile */}
                      <Group justify="space-between" align="center">
                        <Text size="sm" fw={600}>
                          {part.name}
                        </Text>
                        <Text
                          size="xs"
                          c={isDetailOpen ? 'brandOrange' : 'dimmed'}
                          fw={isDetailOpen ? 600 : 400}
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => void handleDetails(category, part.id)}
                        >
                          {isDetailOpen ? 'Hide' : 'Details'}
                        </Text>
                      </Group>

                      {/* Inline spec blocks */}
                      {isDetailOpen && (
                        <Box>
                          <Divider
                            mb="sm"
                            label={
                              <Text size="xs" fw={600} c="dimmed">
                                {part.name}
                              </Text>
                            }
                            labelPosition="left"
                          />
                          {isDetailLoading ? (
                            <Center h={72}>
                              <Loader size="sm" color="brandOrange" />
                            </Center>
                          ) : detail ? (
                            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                              {fields.map(({ key, label, format }) => (
                                <StatBlock
                                  key={key}
                                  label={label}
                                  value={
                                    format ? format(detail[key]) : String(detail[key])
                                  }
                                />
                              ))}
                            </SimpleGrid>
                          ) : (
                            <Text size="sm" c="dimmed">
                              Failed to load specs.
                            </Text>
                          )}
                        </Box>
                      )}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              )
            })}
          </Accordion>
        </Grid.Col>

        {/* Right — summary panel */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="lg" radius="md" style={{ position: 'sticky', top: 20 }}>
            <Title order={4} mb="md">
              Build Summary
            </Title>

            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                Total
              </Text>
              <Text fw={700} c="brandOrange">
                $
                {build.total_price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </Group>

            <Divider mb="md" />

            <Stack gap={10} mb="lg">
              {CATEGORY_ORDER.filter((cat) => build.parts[cat]).map((cat) => (
                <Group
                  key={cat}
                  justify="space-between"
                  align="flex-start"
                  gap="xs"
                  wrap="nowrap"
                >
                  <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" fw={600}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {build.parts[cat].name}
                    </Text>
                  </Stack>
                  <Text size="xs" fw={600} style={{ flexShrink: 0, paddingTop: 1 }}>
                    $
                    {build.parts[cat].price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </Group>
              ))}
            </Stack>

            {build.summary && (
              <>
                <Divider mb="md" />
                <Text size="xs" c="dimmed" mb={6} fw={600} tt="uppercase">
                  AI Summary
                </Text>
                <Text size="sm" lh={1.6} c="dimmed">
                  {build.summary}
                </Text>
              </>
            )}

            <Divider mt="lg" mb="md" />

            <Button
              fullWidth
              color="red"
              variant="light"
              leftSection={<IconTrash size={14} />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete Build
            </Button>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* ── Related YouTube guides ── */}
      {(guidesLoading || guides.length > 0) && (
        <Box mt="xl">
          <Group gap="xs" mb="lg">
            <IconBrandYoutube size={22} color="#FF0000" />
            <Title order={3}>Related Guides</Title>
          </Group>

          {guidesLoading ? (
            <Center h={180}>
              <Loader color="brandOrange" />
            </Center>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {guides.map((guide) => (
                <Card
                  key={guide.video_id}
                  component="a"
                  href={guide.url}
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
                  <Image
                    src={guide.thumbnail_url}
                    alt={guide.title}
                    h={160}
                    fit="cover"
                  />
                  <Stack gap={4} p="md">
                    <Text fw={600} size="sm" lineClamp={2} lh={1.4} c="var(--mantine-color-text)">
                      {guide.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {guide.channel_title}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}
    </Container>
  )
}
