import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Container, Group, Stack, Text, TextInput, Title } from '@mantine/core'
import { PreferenceChips } from './PreferenceChips'
import { PartOptionGroup } from './PartOptionGroup'
import { AIOverview } from './AIOverview'
import { GuideCarousel } from './GuideCarousel'
import type { QuizAnswers } from '../constants/quizOptions'
import type { PartCategoryGroup } from '../constants/parts'
import type { Guide } from '../constants/guides'
import { saveBuild, getPartGuide, ApiError, type GenerateBuildResult, type SavedBuild } from '../api/client'

interface SummaryLocationState {
  answers: QuizAnswers
  generatedBuild: GenerateBuildResult
}

function toCategoryGroups(parts: GenerateBuildResult['parts']): PartCategoryGroup[] {
  return Object.entries(parts).map(([category, options]) => {
    const recommendedIndex = options.findIndex((option) => option.tier === 'recommend')
    return { category, options, recommendedIndex: recommendedIndex === -1 ? 0 : recommendedIndex }
  })
}

export function SummaryPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const locationState = state as SummaryLocationState | null
  const answers = locationState?.answers
  const generatedBuild = locationState?.generatedBuild
  const categoryGroups = generatedBuild ? toCategoryGroups(generatedBuild.parts) : []
  const [selectedOptionIndexByCategory, setSelectedOptionIndexByCategory] = useState<Record<string, number>>(() =>
    Object.fromEntries(categoryGroups.map((group) => [group.category, group.recommendedIndex])),
  )
  const [buildName, setBuildName] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedBuild, setSavedBuild] = useState<SavedBuild | null>(null)
  const [partGuides, setPartGuides] = useState<Guide[]>([])
  const [isLoadingGuides, setIsLoadingGuides] = useState(false)

  if (!answers || !generatedBuild) {
    return <Navigate to="/build" replace />
  }

  function handleSelectOption(category: string, optionIndex: number) {
    setSelectedOptionIndexByCategory((previous) => ({ ...previous, [category]: optionIndex }))
  }

  const totalPrice = categoryGroups.reduce((sum, group) => {
    const selectedOption = group.options[selectedOptionIndexByCategory[group.category]]
    return sum + (selectedOption?.price ?? 0)
  }, 0)

  async function handleSaveBuild() {
    setErrorMessage(null)
    setIsSaving(true)
    try {
      const partsPayload: Record<string, { id: number }> = {}
      for (const group of categoryGroups) {
        const selectedOption = group.options[selectedOptionIndexByCategory[group.category]]
        partsPayload[group.category] = { id: selectedOption.id }
      }
      const newSavedBuild = await saveBuild({
        name: buildName.trim() || 'My Build',
        total_price: totalPrice,
        summary: generatedBuild!.summary,
        parts: partsPayload,
      })
      setSavedBuild(newSavedBuild)
      loadPartGuides(newSavedBuild)
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to save build.')
    } finally {
      setIsSaving(false)
    }
  }

  async function loadPartGuides(build: SavedBuild) {
    setIsLoadingGuides(true)
    try {
      const videos = await Promise.all(
        Object.entries(build.parts).map(([category, part]) => getPartGuide(category, part.name)),
      )
      setPartGuides(
        videos
          .filter((video) => video !== null)
          .map((video) => ({ id: video.video_id, title: video.title, thumbnail: video.thumbnail_url, type: 'video', url: video.url })),
      )
    } catch {
      // if no guides are found we can skip 
    } finally {
      setIsLoadingGuides(false)
    }
  }

  function handleContinue() {
    navigate('/home')
  }

  if (savedBuild) {
    return (
      <Container size="xl" py="xl">
        <Title order={2} mb="lg">
          Build Saved!
        </Title>
        <Stack gap="xl">
          <Text>Here are some videos for the parts in "{savedBuild.name}":</Text>
          {isLoadingGuides ? (
            <Text c="dimmed">Loading videos...</Text>
          ) : (
            partGuides.length > 0 && <GuideCarousel title="Part Videos" guides={partGuides} />
          )}
          <Group justify="center">
            <Button onClick={handleContinue}>Continue</Button>
          </Group>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="lg">
        Your Rigify Summary
      </Title>
      <Stack gap="xl">
        <PreferenceChips answers={answers} />
        <Stack gap="lg">
          {categoryGroups.map((group) => (
            <PartOptionGroup
              key={group.category}
              group={group}
              selectedIndex={selectedOptionIndexByCategory[group.category]}
              onSelect={(optionIndex) => handleSelectOption(group.category, optionIndex)}
            />
          ))}
        </Stack>
        <AIOverview text={generatedBuild.summary} />
        <Group justify="space-between" align="flex-end">
          <TextInput
            label="Build name"
            placeholder="My Build"
            value={buildName}
            onChange={(event) => setBuildName(event.currentTarget.value)}
          />
          <Text fw={700} size="lg" c="brandOrange">
            Total: ${totalPrice.toLocaleString()}
          </Text>
        </Group>
        {errorMessage && <Alert color="red">{errorMessage}</Alert>}
        <Group justify="center">
          <Button onClick={handleSaveBuild} loading={isSaving}>
            Save Build
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
