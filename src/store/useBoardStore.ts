import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Card, Connector, Point, ToolType } from '../types/board.types';
import { boardService } from '../services/board.service';

type HistoryState = {
  cards: Card[];
  connectors: Connector[];
};

// Debounce map for card position updates during drag
const updateTimers: Record<string, ReturnType<typeof setTimeout>> = {};

type BoardStore = AppState & {
  // History
  past: HistoryState[];
  future: HistoryState[];

  // Loading state from server
  isSyncing: boolean;

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

  // Server sync
  loadBoardFromServer: () => Promise<void>;
  clearBoard: () => void;
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
      isSyncing: false,

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

      // ─── Card Actions ───────────────────────────────────────────────────────
      addCard: (card) => {
        get().saveHistory();
        set((state) => ({ cards: [...state.cards, card], selectedIds: [card.id] }));

        // Sync to backend (fire-and-forget; non-blocking)
        boardService.createCard(card).catch((err) => {
          console.error('Failed to sync card creation:', err);
        });
      },

      updateCard: (id, updates) => {
        let changed = false;
        const newCards = get().cards.map((c) => {
          if (c.id === id) {
            changed = true;
            return { ...c, ...updates };
          }
          return c;
        });

        if (changed) {
          get().saveHistory();
          set({ cards: newCards });

          // Debounce API updates (e.g. during drag — fires 400ms after last move)
          if (updateTimers[id]) clearTimeout(updateTimers[id]);
          updateTimers[id] = setTimeout(() => {
            boardService.updateCard(id, updates).catch((err) => {
              console.error('Failed to sync card update:', err);
            });
            delete updateTimers[id];
          }, 400);
        }
      },

      deleteCards: (ids) => {
        if (ids.length === 0) return;
        get().saveHistory();

        set((state) => ({
          cards: state.cards.filter((c) => !ids.includes(c.id)),
          connectors: state.connectors.filter(
            (c) => !ids.includes(c.fromCardId) && !ids.includes(c.toCardId)
          ),
          selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
        }));

        // Sync deletes to backend
        ids.forEach((id) => {
          boardService.deleteCard(id).catch((err) => {
            console.error('Failed to sync card deletion:', err);
          });
        });
      },

      // ─── Connector Actions ──────────────────────────────────────────────────
      addConnector: (connector) => {
        get().saveHistory();
        set((state) => ({ connectors: [...state.connectors, connector] }));

        boardService.createConnector(connector).catch((err) => {
          console.error('Failed to sync connector creation:', err);
        });
      },

      updateConnector: (id, updates) => {
        let changed = false;
        const newConnectors = get().connectors.map((c) => {
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
          connectors: state.connectors.filter((c) => !ids.includes(c.id)),
          selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
        }));

        ids.forEach((id) => {
          boardService.deleteConnector(id).catch((err) => {
            console.error('Failed to sync connector deletion:', err);
          });
        });
      },

      // ─── History Actions ────────────────────────────────────────────────────
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
          selectedIds: [],
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
          selectedIds: [],
        });
      },

      // ─── Server Sync ────────────────────────────────────────────────────────
      loadBoardFromServer: async () => {
        set({ isSyncing: true });
        try {
          const [cards, connectors] = await Promise.all([
            boardService.getCards(),
            boardService.getConnectors(),
          ]);
          set({ cards, connectors, past: [], future: [], isSyncing: false });
        } catch (err) {
          console.error('Failed to load board from server:', err);
          set({ isSyncing: false });
        }
      },

      clearBoard: () => {
        set({ cards: [], connectors: [], selectedIds: [], past: [], future: [] });
      },
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
