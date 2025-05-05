import { RouterProvider } from 'react-router-dom'

// project imports
import router from 'routes'
import ThemeCustomization from 'themes'
import { AuthProvider } from './contexts/AuthContext'

import ScrollTop from 'components/ScrollTop'

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

export default function App () {
  return (
    <AuthProvider>
      <ThemeCustomization>
        <ScrollTop>
          <RouterProvider router={router} />
        </ScrollTop>
      </ThemeCustomization>
    </AuthProvider>
  )
}
