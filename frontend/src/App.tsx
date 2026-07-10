import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './components/HomePage'
import { QuizPage } from './components/QuizPage'
import { SummaryPage } from './components/SummaryPage'
import { GuidesPage } from './components/GuidesPage'
import { BuildsPage } from './components/BuildsPage'
import { SignInPage } from './components/SignInPage'
import { SignUpPage } from './components/SignUpPage'
import { RequireAuth } from './context/AuthContext'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/build"
          element={
            <RequireAuth>
              <QuizPage />
            </RequireAuth>
          }
        />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <BuildsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/summary"
          element={
            <RequireAuth>
              <SummaryPage />
            </RequireAuth>
          }
        />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>
    </Routes>
  )
}

export default App
