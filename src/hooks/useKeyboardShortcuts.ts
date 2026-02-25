import { useEffect } from 'react';
import { useBoardStore } from '../store/useBoardStore';

export const useKeyboardShortcuts = () => {
    const deleteCards = useBoardStore(state => state.deleteCards);
    const deleteConnectors = useBoardStore(state => state.deleteConnectors);
    const selectedIds = useBoardStore(state => state.selectedIds);
    const undo = useBoardStore(state => state.undo);
    const redo = useBoardStore(state => state.redo);
    const setTool = useBoardStore(state => state.setTool);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input or contenteditable
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedIds.length > 0) {
                    deleteCards(selectedIds);
                    deleteConnectors(selectedIds);
                }
            }

            // Tool shortcuts
            if (e.key.toLowerCase() === 'v') setTool('select');
            if (e.key.toLowerCase() === 'h') setTool('hand');
            if (e.key.toLowerCase() === 'n') setTool('sticky');
            if (e.key.toLowerCase() === 'l') setTool('arrow');

            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                }
                if (e.key.toLowerCase() === 'y') {
                    e.preventDefault();
                    redo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteCards, deleteConnectors, selectedIds, undo, redo, setTool]);
};
