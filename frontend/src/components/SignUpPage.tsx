import { Button, Center, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core'

export function SignUpPage() {
  return (
    <Center h="100%">
      <Paper withBorder radius="md" p="xl" w={400}>
        <Stack gap="md">
          <Title order={2} ta="center">
            Sign Up
          </Title>
          <TextInput label="Name" placeholder="Your name" />
          <TextInput label="Email" placeholder="you@example.com" />
          <PasswordInput label="Password" placeholder="Create a password" />
          <Button fullWidth mt="sm">
            Sign Up
          </Button>
        </Stack>
      </Paper>
    </Center>
  )
}
