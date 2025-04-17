
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    // Only redirect after auth state is determined
    if (!loading) {
      // If authenticated, redirect to dashboard, otherwise to login
      navigate(user ? '/' : '/login');
    }
  }, [navigate, user, loading]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
};

export default Index;
