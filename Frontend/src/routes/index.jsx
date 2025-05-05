import { createBrowserRouter } from 'react-router-dom';

// project imports
import MainRoutes from './MainRoutes';
import LoginRoutes from './LoginRoutes';

// ==============================|| ROUTING RENDER ||============================== //

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      MainRoutes,
      {
        path: '',
        children: LoginRoutes.children
      }
    ]
  }
], { basename: import.meta.env.VITE_APP_BASE_NAME });

export default router;
