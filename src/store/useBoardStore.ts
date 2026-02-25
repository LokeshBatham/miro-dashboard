import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Card, Connector, Point, ToolType } from '../types/board.types';

type HistoryState = {
    cards: Card[];
    connectors: Connector[];
};

type BoardStore = AppState & {
    // History
    past: HistoryState[];
    future: HistoryState[];

    // Actions
    setTool: (tool: ToolType) => void;
    setCanvasTransform: (scale: number, offset: Point) => void;

    // Card Actions
    addCard: (card: Card) => void;
    updateCard: (id: string, updates: Partial<Card>) => void;
    deleteCards: (ids: string[]) => void;

    // Connector Actions
    addConnector: (connector: Connector) => void;
    updateConnector: (id: string, updates: Partial<Connector>) => void;
    deleteConnectors: (ids: string[]) => void;

    // Selection
    setSelectedIds: (ids: string[]) => void;

    // Connection state
    setConnectingFrom: (cardId: string | null) => void;

    // History Actions
    undo: () => void;
    redo: () => void;
    saveHistory: () => void;
};

const MAX_HISTORY = 50;

export const useBoardStore = create<BoardStore>()(
    persist(
        (set, get) => ({
            // Initial State
            cards: [],
            connectors: [],
            selectedIds: [],
            canvasScale: 1,
            canvasOffset: { x: 0, y: 0 },
            currentTool: 'select',
            connectingFromCardId: null,
            past: [],
            future: [],

            // Core Actions
            setTool: (tool) => set({ currentTool: tool }),

            setCanvasTransform: (scale, offset) => set({ canvasScale: scale, canvasOffset: offset }),

            setSelectedIds: (ids) => set({ selectedIds: ids }),

            setConnectingFrom: (cardId) => set({ connectingFromCardId: cardId }),

            // Internal history helper
            saveHistory: () => {
                const { cards, connectors, past } = get();
                const newPast = [...past, { cards, connectors }].slice(-MAX_HISTORY);
                set({ past: newPast, future: [] });
            },

            // Mutation Actions
            addCard: (card) => {
                get().saveHistory();
                set((state) => ({ cards: [...state.cards, card], selectedIds: [card.id] }));
            },

            updateCard: (id, updates) => {
                let changed = false;
                const newCards = get().cards.map(c => {
                    if (c.id === id) {
                        changed = true;
                        return { ...c, ...updates };
                    }
                    return c;
                });

                if (changed) {
                    get().saveHistory();
                    set({ cards: newCards });
                }
            },

            deleteCards: (ids) => {
                if (ids.length === 0) return;
                get().saveHistory();

                // When deleting cards, we also need to delete any connectors connected to them
                set((state) => ({
                    cards: state.cards.filter(c => !ids.includes(c.id)),
                    connectors: state.connectors.filter(c => !ids.includes(c.fromCardId) && !ids.includes(c.toCardId)),
                    selectedIds: state.selectedIds.filter(id => !ids.includes(id))
                }));
            },

            addConnector: (connector) => {
                get().saveHistory();
                set((state) => ({ connectors: [...state.connectors, connector] }));
            },

            updateConnector: (id, updates) => {
                let changed = false;
                const newConnectors = get().connectors.map(c => {
                    if (c.id === id) {
                        changed = true;
                        return { ...c, ...updates };
                    }
                    return c;
                });

                if (changed) {
                    get().saveHistory();
                    set({ connectors: newConnectors });
                }
            },

            deleteConnectors: (ids) => {
                if (ids.length === 0) return;
                get().saveHistory();
                set((state) => ({
                    connectors: state.connectors.filter(c => !ids.includes(c.id)),
                    selectedIds: state.selectedIds.filter(id => !ids.includes(id))
                }));
            },

            // History Actions
            undo: () => {
                const { past, future, cards, connectors } = get();
                if (past.length === 0) return;

                const previous = past[past.length - 1];
                const newPast = past.slice(0, past.length - 1);

                set({
                    cards: previous.cards,
                    connectors: previous.connectors,
                    past: newPast,
                    future: [{ cards, connectors }, ...future],
                    selectedIds: [], // Clear selection on undo
                });
            },

            redo: () => {
                const { past, future, cards, connectors } = get();
                if (future.length === 0) return;

                const next = future[0];
                const newFuture = future.slice(1);

                set({
                    cards: next.cards,
                    connectors: next.connectors,
                    past: [...past, { cards, connectors }],
                    future: newFuture,
                    selectedIds: [], // Clear selection on redo
                });
            }
        }),
        {
            name: 'miro-board-storage',
            partialize: (state) => ({
                cards: state.cards,
                connectors: state.connectors,
                // We do not persist past/future/canvasState to avoid bloated storage
            }),
        }
    )
);
