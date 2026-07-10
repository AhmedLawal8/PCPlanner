import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { BrowserRouter } from 'react-router-dom'
import '@mantine/core/styles.css'
import '@mantine/carousel/styles.css'
import './index.css'
import { theme } from './theme.ts'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
)
