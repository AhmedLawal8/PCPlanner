import { Button, Center, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core'

export function SignInPage() {
  return (
    <Center mih="100vh">
      <Paper withBorder radius="md" p="xl" w={400}>
        <Stack gap="md">
          <Title order={2} ta="center">
            Sign In
          </Title>
          <TextInput label="Email" placeholder="you@example.com" />
          <PasswordInput label="Password" placeholder="Your password" />
          <Button fullWidth mt="sm">
            Sign In
          </Button>
        </Stack>
      </Paper>
    </Center>
  )
}
