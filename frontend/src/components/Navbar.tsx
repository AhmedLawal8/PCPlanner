import { Anchor, Box, Button, Divider, Group, Text, useMantineTheme } from '@mantine/core'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { modals } from '@mantine/modals'

export function Navbar() {
  const theme = useMantineTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    modals.openConfirmModal({
      title: 'Sign out',
      children: <Text size="sm">Are you sure you want to sign out?</Text>,
      labels: { confirm: 'Sign out', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await logout()
        navigate('/')
      },
    })
  }

  return (
    <Box component="header">
      <Box px="xl" py="md">
        <Group justify="space-between" align="center">
          <Anchor
            component={Link}
            to="/"
            underline="never"
            fw={700}
            size="sm"
            style={{
              color: '#C85A1A',
              border: '1.5px solid #C85A1A',
              borderRadius: 8,
              padding: '5px 14px',
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#C85A1A'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#C85A1A'
            }}
          >
            Home
          </Anchor>
          <Group gap="lg">
            <Anchor component={Link} to="/builds" c="black" underline="never" fw={500}>
              Saved
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
