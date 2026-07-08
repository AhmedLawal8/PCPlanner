import { Navigate, useLocation } from 'react-router-dom'
import { Container, Stack, Title } from '@mantine/core'
import { PreferenceChips } from './PreferenceChips'
import { PartRow } from './PartRow'
import { AIOverview } from './AIOverview'
import { MOCK_PARTS, MOCK_AI_OVERVIEW } from '../constants/parts'
import type { QuizAnswers } from '../constants/quizOptions'

interface SummaryLocationState {
  answers: QuizAnswers
}

export function SummaryPage() {
  const { state } = useLocation()
  const answers = (state as SummaryLocationState | null)?.answers

  if (!answers){
    return <Navigate to="/" replace />
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="lg">
        Your Rigify Summary
      </Title>
      <Stack gap="xl">
        <PreferenceChips answers={answers} />
        <Stack gap="sm">
          {MOCK_PARTS.map((part) => (
            <PartRow key={part.category} part={part} />
          ))}
        </Stack>
        <AIOverview text={MOCK_AI_OVERVIEW} />
      </Stack>
    </Container>
  )
}
