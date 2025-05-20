import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface AuthUser {
  id: number;
  username: string;
  email: string;
  language: string;
  trialStartDate: string;
  subscribed: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Fetch the current authenticated user
  const { 
    data: user, 
    isLoading,
    isError,
    refetch
  } = useQuery<AuthUser>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Login mutation
  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate user query to refresh authentication state
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      // Redirect to home page
      setLocation('/');
    },
  });
  
  // Register mutation
  const register = useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string; language: string }) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate user query to refresh authentication state
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      // Redirect to home page
      setLocation('/');
    },
  });
  
  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout');
      // Invalidate and reset query
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.setQueryData(['/api/auth/user'], null);
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    isError,
    login,
    register,
    logout,
    refetch,
  };
}