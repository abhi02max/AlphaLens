import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import StockDetailPage from '../pages/StockDetailPage';
import LoginPage from '../pages/LoginPage';
import WatchlistPage from '../pages/WatchlistPage';
import { useAuthStore } from '../store';

// A wrapper component that checks if user is logged in before rendering
const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* All routes inside MainLayout will have the Navbar/Sidebar */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="stock/:symbol" element={<StockDetailPage />} />
          
          <Route path="watchlist" element={
            <ProtectedRoute>
              <WatchlistPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
