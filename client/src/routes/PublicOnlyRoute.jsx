import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/hooks';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, clearAuth } from '../store/slices/authSlice';
import { getCurrentUser } from '../services/auth.services';

const PublicOnlyRoute = () => {
  const { isAuthenticated, role } = useAuth();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await getCurrentUser();
        
        if (response && response.success && response.data && response.data.user) {
          dispatch(setAuth({ isAuthenticated: true, role: response.data.user.role }));
        } else {
          dispatch(clearAuth());
        }
      } catch (error) {
        console.error('Failed to verify auth:', error);
        dispatch(clearAuth());
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthenticated) {
      verifyAuth();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    if (role === 'buyer') {
      return <Navigate to="/buyer/dashboard" replace />;
    } else if (role === 'publisher') {
      return <Navigate to="/publisher/dashboard" replace />;
    } else if (role === 'manager') {
      return <Navigate to="/manager/dashboard" replace />;
    } else if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
