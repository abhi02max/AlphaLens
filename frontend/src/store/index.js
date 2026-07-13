import { create } from 'zustand';

// Zustand is chosen over Redux because it is incredibly lightweight, 
// requires zero boilerplate (no reducers/actions), and avoids React Context re-render hell.
export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  
  // Note on Security: Storing tokens in localStorage is okay for MVPs.
  // For production financial apps, use HttpOnly secure cookies sent from the backend 
  // to prevent XSS (Cross-Site Scripting) attacks from stealing the token.
  login: (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    set({ user: userData, token });
  },
  
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

