import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Center, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'

export function SignUpPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSignUp() {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      await signUp(username, password)
      navigate('/home')
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Sign up failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Center h="100%">
      <Paper withBorder radius="md" p="xl" w={400}>
        <Stack gap="md">
          <Title order={2} ta="center">
            Sign Up
          </Title>
          {errorMessage && <Alert color="red">{errorMessage}</Alert>}
          <TextInput
            label="Username"
            placeholder="Your username"
            value={username}
            onChange={(event) => setUsername(event.currentTarget.value)}
          />
          <PasswordInput
            label="Password"
            placeholder="Create a password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <Button fullWidth mt="sm" onClick={handleSignUp} loading={isSubmitting}>
            Sign Up
          </Button>
        </Stack>
      </Paper>
    </Center>
  )
}
