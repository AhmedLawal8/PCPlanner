import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconCheck, IconEdit, IconTrash, IconX } from '@tabler/icons-react'
import { api, ApiError } from '../services/api'
import { CATEGORY_LABELS } from '../constants/parts'
import type { SavedBuild } from '../constants/parts'

export function BuildsPage() {
  const navigate = useNavigate()
  const [builds, setBuilds] = useState<SavedBuild[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Inline rename state
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameLoading, setRenameLoading] = useState(false)

  // Delete confirm state
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get<SavedBuild[]>('/api/builds/')
      .then((data) => {
        if (!cancelled) {
          setBuilds(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) navigate('/signin')
          else setFetchError('Failed to load builds.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  const startRename = (build: SavedBuild) => {
    setRenamingId(build.id)
    setRenameValue(build.name)
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  const commitRename = async (id: number) => {
    const trimmed = renameValue.trim()
    if (!trimmed) return cancelRename()
    setRenameLoading(true)
    try {
      await api.patch(`/api/builds/${id}`, { name: trimmed })
      setBuilds((prev) => prev.map((b) => (b.id === id ? { ...b, name: trimmed } : b)))
      cancelRename()
    } catch {
      // keep input open on error
    } finally {
      setRenameLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteId == null) return
    setDeleteLoading(true)
    try {
      await api.delete(`/api/builds/${deleteId}`)
      setBuilds((prev) => prev.filter((b) => b.id !== deleteId))
      setDeleteId(null)
    } catch {
      // keep modal open on error
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Container size="xl" py="xl">
      {/* Delete confirmation modal */}
      <Modal
        opened={deleteId != null}
        onClose={() => !deleteLoading && setDeleteId(null)}
        title="Delete Build"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">Are you sure? This can't be undone.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteId(null)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button color="red" loading={deleteLoading} onClick={handleDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" mb="xl">
        <Title order={2}>My Builds</Title>
        <Button color="brandOrange" onClick={() => navigate('/quiz')}>
          New Build
        </Button>
      </Group>

      {loading ? (
        <Center h={200}>
          <Loader color="brandOrange" />
        </Center>
      ) : fetchError ? (
        <Alert color="red" variant="light">
          {fetchError}
        </Alert>
      ) : builds.length === 0 ? (
        <Center h={300}>
          <Stack align="center" gap="md">
            <Text c="dimmed" size="lg">
              No saved builds yet.
            </Text>
            <Button color="brandOrange" onClick={() => navigate('/quiz')}>
              Build my PC
            </Button>
          </Stack>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {builds.map((build) => (
            <Card key={build.id} withBorder radius="md" padding="lg">
              <Stack gap="sm">
                {/* Name row */}
                {renamingId === build.id ? (
                  <Group gap="xs" wrap="nowrap">
                    <TextInput
                      size="sm"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void commitRename(build.id)
                        if (e.key === 'Escape') cancelRename()
                      }}
                      style={{ flex: 1 }}
                      autoFocus
                    />
                    <ActionIcon
                      size="sm"
                      color="brandOrange"
                      loading={renameLoading}
                      onClick={() => void commitRename(build.id)}
                    >
                      <IconCheck size={14} />
                    </ActionIcon>
                    <ActionIcon size="sm" variant="default" onClick={cancelRename}>
                      <IconX size={14} />
                    </ActionIcon>
                  </Group>
                ) : (
                  <Group gap="xs" wrap="nowrap">
                    <Text fw={700} style={{ flex: 1 }} lineClamp={1}>
                      {build.name}
                    </Text>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => startRename(build)}
                    >
                      <IconEdit size={14} />
                    </ActionIcon>
                  </Group>
                )}

                {/* Price + date */}
                <Group justify="space-between">
                  <Badge color="brandOrange" variant="light" size="lg">
                    $
                    {build.total_price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {new Date(build.created_at).toLocaleDateString()}
                  </Text>
                </Group>

                {/* Parts list */}
                <Box>
                  {Object.entries(build.parts).map(([cat, part]) => (
                    <Group key={cat} justify="space-between" gap="xs" wrap="nowrap" py={1}>
                      <Text size="xs" fw={600} style={{ flexShrink: 0 }}>
                        {CATEGORY_LABELS[cat] ?? cat}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={1} ta="right" style={{ minWidth: 0 }}>
                        {part.name}
                      </Text>
                    </Group>
                  ))}
                </Box>

                {/* Actions */}
                <Group justify="space-between" mt="xs">
                  <Button
                    size="xs"
                    color="brandOrange"
                    onClick={() => navigate(`/builds/${build.id}`)}
                  >
                    View
                  </Button>
                  <ActionIcon
                    size="sm"
                    color="red"
                    variant="subtle"
                    onClick={() => setDeleteId(build.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  )
}
