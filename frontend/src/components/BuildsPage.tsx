import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { ConfirmDialog } from './ConfirmDialog'
import { listBuilds, deleteBuild, ApiError, type SavedBuild } from '../api/client'

export function BuildsPage() {
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [buildPendingDelete, setBuildPendingDelete] = useState<SavedBuild | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadSavedBuilds()
  }, [])

  async function loadSavedBuilds() {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const builds = await listBuilds()
      setSavedBuilds(builds)
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load your builds.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirmDelete() {
    if (!buildPendingDelete) return
    setIsDeleting(true)
    try {
      await deleteBuild(buildPendingDelete.id)
      setSavedBuilds((previous) => previous.filter((build) => build.id !== buildPendingDelete.id))
      setBuildPendingDelete(null)
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to delete build.')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleCancelDelete() {
    setBuildPendingDelete(null)
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="sm">
        My Builds
      </Title>
      {errorMessage && (
        <Alert color="red" mb="md">
          {errorMessage}
        </Alert>
      )}
      {!isLoading && savedBuilds.length === 0 ? (
        <Text c="dimmed">Your saved PC builds will show up here.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {savedBuilds.map((build) => (
            <Card key={build.id} withBorder radius="md" p="md">
              <Group justify="space-between" mb="xs">
                <Text fw={700}>{build.name}</Text>
                <Badge color="brandOrange">${build.total_price.toLocaleString()}</Badge>
              </Group>
              <Text size="sm" c="dimmed" lineClamp={3} mb="sm">
                {build.summary}
              </Text>
              <Stack gap={2} mb="md">
                {Object.entries(build.parts).map(([category, part]) => (
                  <Text key={category} size="xs">
                    <Text span fw={600} tt="uppercase">
                      {category}
                    </Text>
                    : {part.name}
                  </Text>
                ))}
              </Stack>
              <Button color="red" variant="light" size="xs" onClick={() => setBuildPendingDelete(build)}>
                Delete
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      )}
      <ConfirmDialog
        opened={buildPendingDelete !== null}
        title="Delete Build"
        message={`Are you sure you want to delete "${buildPendingDelete?.name}"? This can't be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </Container>
  )
}
