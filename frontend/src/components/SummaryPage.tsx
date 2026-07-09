import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Container, Stack, Title } from '@mantine/core'
import { PreferenceChips } from './PreferenceChips'
import { PartOptionGroup } from './PartOptionGroup'
import { AIOverview } from './AIOverview'
import { MOCK_PART_GROUPS, MOCK_AI_OVERVIEW } from '../constants/parts'
import type { QuizAnswers } from '../constants/quizOptions'

interface SummaryLocationState {
  answers: QuizAnswers
}

export function SummaryPage() {
  const { state } = useLocation()
  const answers = (state as SummaryLocationState | null)?.answers
  const [selections, setSelections] = useState<Record<string, number>>(() =>
    Object.fromEntries(MOCK_PART_GROUPS.map((group) => [group.category, group.recommendedIndex])),
  )

  if (!answers) {
    return <Navigate to="/build" replace />
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="lg">
        Your Rigify Summary
      </Title>
      <Stack gap="xl">
        <PreferenceChips answers={answers} />
        <Stack gap="lg">
          {MOCK_PART_GROUPS.map((group) => (
            <PartOptionGroup
              key={group.category}
              group={group}
              selectedIndex={selections[group.category]}
              onSelect={(index) =>
                setSelections((prev) => ({ ...prev, [group.category]: index }))
              }
            />
          ))}
        </Stack>
        <AIOverview text={MOCK_AI_OVERVIEW} />
      </Stack>
    </Container>
  )
}
