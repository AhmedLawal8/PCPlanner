import { Button, Center, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <Center mih="80vh">
      <Stack align="center" gap="sm">
        <Title order={1} fz={70} fw={800} c="black">
          Rigify
        </Title>
        <Text size="xl" c="dimmed">
          Build Your PC the right way.
        </Text>
        <Button component={Link} to="/signup" size="lg" mt="lg">
          Get Started
        </Button>
      </Stack>
    </Center>
  )
}
