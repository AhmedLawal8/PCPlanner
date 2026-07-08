import { useState } from 'react'
import { Button, Container, Group, Stack, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { UsageQuestion } from './UsageQuestion'
import { BudgetQuestion } from './BudgetQuestion'
import { PriorityQuestion } from './PriorityQuestion'
import type { QuizAnswers } from '../constants/quizOptions'

export function QuizPage() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<QuizAnswers>({
    useCase: null,
    budget: 1500,
    priority: null,
  })

  const handleContinue = () => navigate('/summary', { state: { answers } })
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
        <Group justify="center">
          <Button onClick={handleContinue} disabled={!canSubmit}>
            Continue
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
