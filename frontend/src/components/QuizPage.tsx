import { useState } from 'react'
import { Button, Group, Stack } from '@mantine/core'
import { UsageQuestion } from './UsageQuestion'
import { BudgetQuestion } from './BudgetQuestion'
import { PriorityQuestion } from './PriorityQuestion'
import type { QuizAnswers } from '../constants/quizOptions'

export function QuizPage() {
  const [answers, setAnswers] = useState<QuizAnswers>({
    useCase: null,
    budget: 1500,
    priority: null,
  })

  const handleSubmit = () => console.log('Quiz answers:', answers)
  const canSubmit = answers.useCase !== null && answers.priority !== null

  return (
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
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          Submit
        </Button>
      </Group>
    </Stack>
  )
}
