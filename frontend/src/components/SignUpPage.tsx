import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { Alert, Anchor, Button, Center, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../services/api'

export function SignUpPage() {
  const { register, user, isLoading } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isLoading && user) return <Navigate to="/quiz" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(username, password)
      navigate('/quiz')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Center h="100%">
      <Paper withBorder radius="md" p="xl" w={400}>
        <Stack gap="md">
          <Title order={2} ta="center">
            Sign Up
          </Title>
          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Username"
                placeholder="Create a username"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                required
              />
              <PasswordInput
                label="Password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />
              <Button fullWidth mt="sm" type="submit" loading={loading}>
                Sign Up
              </Button>
            </Stack>
          </form>
          <Anchor component={Link} to="/signin" ta="center" size="sm">
            Already have an account? Sign in
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  )
}
