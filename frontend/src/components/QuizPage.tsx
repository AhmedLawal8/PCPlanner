import { useState } from 'react'
import { Alert, Button, Container, Group, Stack, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { UsageQuestion } from './UsageQuestion'
import { BudgetQuestion } from './BudgetQuestion'
import { api, ApiError } from '../services/api'
import type { GenerateResponse } from '../constants/parts'

export function QuizPage() {
  const navigate = useNavigate()
  const [useCase, setUseCase] = useState<string | null>(null)
  const [budget, setBudget] = useState(1500)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!useCase) return
    setError(null)
    setLoading(true)
    try {
      const response = await api.post<GenerateResponse>('/api/builds/generate', {
        budget,
        use_case: useCase,
      })
      navigate('/summary', { state: { response, budget, useCase } })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to generate build. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">
        Build Your PC
      </Title>
      <Stack gap="xl">
        <UsageQuestion value={useCase} onChange={setUseCase} />
        <BudgetQuestion value={budget} onChange={setBudget} />
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}
        <Group justify="center">
          <Button
            onClick={handleGenerate}
            disabled={!useCase}
            loading={loading}
            size="lg"
          >
            Generate Build
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
