import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import { useEffect, useState } from "react";
import { initializeMapbox } from "./lib/mapbox";
import { AppProvider } from "./contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";

// Auth provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  
  // Show loading spinner while checking auth status
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return children;
}

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  useEffect(() => {
    // Redirect to login if not authenticated and done loading
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while checking auth status
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Checking authentication...</div>;
  }

  return isAuthenticated ? <Component /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // We'll initialize mapbox inside the AppProvider
  return (
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </AppProvider>
  );
}

export default App;
