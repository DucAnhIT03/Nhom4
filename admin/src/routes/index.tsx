import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import AdminLayout from '../shared/layout/AdminLayout';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import UserManagementPage from '../features/users/pages/UserManagementPage';
import ArtistManagementPage from '../features/artists/pages/ArtistManagementPage';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: <UserManagementPage />,
      },
      {
        path: 'artists',
        element: <ArtistManagementPage />,
      },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;

