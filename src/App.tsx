import { Board } from './components/Board/Board';
import { Toolbar } from './components/Toolbar/Toolbar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  useKeyboardShortcuts();

  return (
    <div className="w-full h-screen relative font-sans text-gray-900 overflow-hidden">
      <Board />
      <Toolbar />
    </div>
  );
}

export default App;
