import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authService } from '../services/auth.service';
import { Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';
import { DashboardCard } from '../components/ui/DashboardCard';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, login } = useAuthStore();
  const navigate = useNavigate();

  // If already logged in, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const data = await authService.login({ email: formData.email, password: formData.password });
        login({ id: data._id, name: data.name, email: data.email }, data.token);
      } else {
        const data = await authService.register(formData);
        login({ id: data._id, name: data.name, email: data.email }, data.token);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <DashboardCard className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isLogin ? 'Welcome back to AlphaLens' : 'Create your AlphaLens account'}
          </h2>
          <p className="text-slate-500 mt-2">
            {isLogin ? 'Enter your details to access your dashboard' : 'Start tracking stocks like a pro'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fintech-blue outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fintech-blue outline-none transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fintech-blue outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors flex justify-center items-center gap-2 mt-6"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-fintech-blue hover:underline font-medium"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </DashboardCard>
    </div>
  );
};

export default LoginPage;