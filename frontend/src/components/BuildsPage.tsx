import { Container, Text, Title } from '@mantine/core'

export function BuildsPage() {
  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="sm">
        My Builds
      </Title>
      <Text c="dimmed">Your saved PC builds will show up here.</Text>
    </Container>
  )
}
