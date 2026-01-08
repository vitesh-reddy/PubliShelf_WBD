import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../store/hooks';
import { useDispatch } from 'react-redux';
import { setAuth, clearAuth } from '../store/slices/authSlice';
import { getCurrentUser } from '../services/auth.services';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await getCurrentUser();
        console.log("protectd route verifed", response.data);
        
        if (response.success && response.data.user) {
          dispatch(setAuth({ role: response.data.user.role }));
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

    if (!isAuthenticated)
      verifyAuth();
    else
      setIsLoading(false);
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

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
