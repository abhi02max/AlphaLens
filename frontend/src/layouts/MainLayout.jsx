import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { BookOpen, LineChart } from 'lucide-react';

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const { learningMode, toggleLearningMode } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-fintech-primary text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold tracking-wider flex items-center gap-2">
            AlphaLens
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/watchlist" className="hover:text-fintech-blue transition-colors">Watchlist</Link>
            
            <button 
              onClick={toggleLearningMode}
              className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-sm hover:bg-slate-700 transition"
            >
              {learningMode === 'beginner' ? <BookOpen size={16} className="text-fintech-green" /> : <LineChart size={16} className="text-fintech-blue" />}
              {learningMode.toUpperCase()} MODE
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300">Hi, {user.name}</span>
                <button onClick={logout} className="text-sm bg-fintech-red px-3 py-1 rounded hover:bg-red-600">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="bg-fintech-blue px-4 py-2 rounded font-medium hover:bg-blue-600 transition">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-8">
        <Outlet /> {/* This is where nested route pages will render */}
      </main>
    </div>
  );
};

export default MainLayout;
