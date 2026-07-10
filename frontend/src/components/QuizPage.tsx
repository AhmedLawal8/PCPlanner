import { useState } from 'react'
import { Alert, Button, Container, Group, Stack, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { UsageQuestion } from './UsageQuestion'
import { BudgetQuestion } from './BudgetQuestion'
import { PriorityQuestion } from './PriorityQuestion'
import { USE_CASE_TO_BACKEND, type QuizAnswers } from '../constants/quizOptions'
import { generateBuild, ApiError } from '../api/client'

export function QuizPage() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<QuizAnswers>({
    useCase: null,
    budget: 1500,
    priority: null,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleContinue() {
    if (!answers.useCase) return

    setErrorMessage(null)
    setIsGenerating(true)
    try {
      const generatedBuild = await generateBuild(answers.budget, USE_CASE_TO_BACKEND[answers.useCase], answers.priority)
      navigate('/summary', { state: { answers, generatedBuild } })
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to generate a build.')
    } finally {
      setIsGenerating(false)
    }
  }

  const canSubmit = answers.useCase !== null && answers.priority !== null

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">
        PC Build Quiz
      </Title>
      <Stack gap="xl">
        <UsageQuestion
          value={answers.useCase}
          onChange={(useCase) => setAnswers((answer) => ({ ...answer, useCase }))}
        />
        <BudgetQuestion
          value={answers.budget}
          onChange={(budget) => setAnswers((answer) => ({ ...answer, budget }))}
        />
        <PriorityQuestion
          value={answers.priority}
          onChange={(priority) => setAnswers((answer) => ({ ...answer, priority }))}
        />
        {errorMessage && <Alert color="red">{errorMessage}</Alert>}
        <Group justify="center">
          <Button onClick={handleContinue} disabled={!canSubmit} loading={isGenerating}>
            Continue
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
