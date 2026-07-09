import { Box } from '@mantine/core'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />
      <Box style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
