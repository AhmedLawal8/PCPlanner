import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Alert, Anchor, Button, Center, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../services/api'

export function SignInPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/builds'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      navigate(from, { replace: true })
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
            Sign In
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
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                required
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />
              <Button fullWidth mt="sm" type="submit" loading={loading}>
                Sign In
              </Button>
            </Stack>
          </form>
          <Anchor component={Link} to="/signup" ta="center" size="sm">
            Don't have an account? Sign up
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  )
}
