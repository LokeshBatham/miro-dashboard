import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Board } from './components/Board/Board';
import { Toolbar } from './components/Toolbar/Toolbar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuthStore } from './store/useAuthStore';
import { useBoardStore } from './store/useBoardStore';

// Board view — loads server data on mount, shows toolbar
const BoardView: React.FC = () => {
  useKeyboardShortcuts();
  const loadBoardFromServer = useBoardStore((s) => s.loadBoardFromServer);
  const clearBoard = useBoardStore((s) => s.clearBoard);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isSyncing = useBoardStore((s) => s.isSyncing);

  useEffect(() => {
    // Load user's board data from backend on mount
    loadBoardFromServer();
    return () => {
      // Clear board data when unmounting (logging out)
    };
  }, [loadBoardFromServer]);

  const handleLogout = () => {
    clearBoard();
    logout();
  };

  return (
    <div className="w-full h-screen relative font-sans text-gray-900 overflow-hidden">
      {/* User header */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        {isSyncing && (
          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-xs text-gray-500 px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Syncing...
          </div>
        )}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user?.name}</span>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <Board />
      <Toolbar />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <BoardView />
            </ProtectedRoute>
          }
        />
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
