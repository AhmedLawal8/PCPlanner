import { useEffect, useState } from 'react'
import { Alert, Container, Stack, Title } from '@mantine/core'
import { GuideCarousel } from './GuideCarousel'
import type { Guide } from '../constants/guides'
import { getGeneralGuides, ApiError } from '../api/client'

export function GuidesPage() {
  const [videoGuides, setVideoGuides] = useState<Guide[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    loadVideoGuides()
  }, [])

  async function loadVideoGuides() {
    setErrorMessage(null)
    try {
      const videos = await getGeneralGuides()
      setVideoGuides(
        videos.map((video) => ({
          id: video.topic ?? video.video_id,
          title: video.title,
          thumbnail: video.thumbnail_url,
          type: 'video',
          url: video.url,
        })),
      )
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load guides.')
    }
  }

  return (
    <Container size="xl" py="lg">
      <Title order={1} mb="xl">
        Guides
      </Title>
      <Stack gap="xl">
        {errorMessage && <Alert color="red">{errorMessage}</Alert>}
        <GuideCarousel title="Videos" guides={videoGuides} />
      </Stack>
    </Container>
  )
}
