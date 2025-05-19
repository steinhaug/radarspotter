import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '@/hooks/use-i18n';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // After successful login, redirect to home
        setLocation('/');
      } else {
        const data = await response.json();
        setError(data.error || t('invalidCredentials'));
      }
    } catch (err) {
      setError(t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('radar')} <span className="text-primary">Alarm</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('loginInstruction')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-2">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                {t('username')}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? t('loggingIn') : t('login')}
            </button>
            
            <div className="text-sm text-center">
              {t('dontHaveAccount')} {' '}
              <a 
                href="/register" 
                className="font-medium text-primary hover:text-primary-600"
                onClick={(e) => {
                  e.preventDefault();
                  setLocation('/register');
                }}
              >
                {t('register')}
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}