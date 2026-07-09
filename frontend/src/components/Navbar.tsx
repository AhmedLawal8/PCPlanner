import { Avatar, Anchor, Box, Button, Divider, Group, useMantineTheme } from '@mantine/core'
import { Link } from 'react-router-dom'

export function Navbar() {
  const theme = useMantineTheme()

  return (
    <Box component="header">
      <Box px="xl" py="md">
        <Group justify="space-between" align="center">
          <Anchor component={Link} to="/" underline="never">
            <Avatar radius="xl" color="brandOrange" variant="filled">
              R
            </Avatar>
          </Anchor>
          <Group gap="lg">
            <Anchor component={Link} to="/home" c="black" underline="never" fw={500}>
              Home
            </Anchor>
            <Anchor component={Link} to="/build" c="black" underline="never" fw={500}>
              Build Your PC
            </Anchor>
            <Button component={Link} to="/signin">
              Sign In
            </Button>
          </Group>
        </Group>
      </Box>
      <Divider color={theme.other.neutralLight} />
    </Box>
  )
}
