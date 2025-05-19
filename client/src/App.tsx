import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import { useEffect, useState } from "react";
import { initializeMapbox } from "./lib/mapbox";
import { AppProvider } from "./contexts/AppContext";

// Auth provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [_, navigate] = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    fetch('/api/auth/user')
      .then(res => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      })
      .catch(() => {
        setAuthenticated(false);
      });
  }, []);

  // Show nothing while checking auth status
  if (authenticated === null) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return children;
}

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [_, navigate] = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    fetch('/api/auth/user')
      .then(res => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          navigate('/login');
        }
      })
      .catch(() => {
        setAuthenticated(false);
        navigate('/login');
      });
  }, [navigate]);

  // Show nothing while checking auth status
  if (authenticated === null) {
    return <div className="flex items-center justify-center h-screen">Checking authentication...</div>;
  }

  return authenticated ? <Component /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
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
