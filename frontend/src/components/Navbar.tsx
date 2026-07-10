import { Avatar, Anchor, Box, Button, Divider, Group, Text, useMantineTheme } from '@mantine/core'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Navbar() {
  const theme = useMantineTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

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
            <Anchor component={Link} to="/builds" c="black" underline="never" fw={500}>
              Home
            </Anchor>
            <Anchor component={Link} to="/quiz" c="black" underline="never" fw={500}>
              Build Your PC
            </Anchor>
            {user ? (
              <Group gap="sm">
                <Text fw={500} size="sm">
                  Hi, {user.username}
                </Text>
                <Button variant="light" onClick={handleLogout}>
                  Sign Out
                </Button>
              </Group>
            ) : (
              <Button component={Link} to="/signin">
                Sign In
              </Button>
            )}
          </Group>
        </Group>
      </Box>
      <Divider color={theme.other.neutralLight} />
    </Box>
  )
}
