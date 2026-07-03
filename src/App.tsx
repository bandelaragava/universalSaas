import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { ThemeProvider } from '@/context/ThemeProvider'
import { ToastProvider } from '@/context/ToastContext'
import { DashboardActionProvider } from '@/context/DashboardActionContext'
import { AppRoutes } from '@/routes'
import { AuthProvider } from '@/auth/AuthContext'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <DashboardActionProvider>
                <AppRoutes />
              </DashboardActionProvider>
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App


