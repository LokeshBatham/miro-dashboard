import api from './api';
import type { Card, Connector } from '../types/board.types';

export const boardService = {
  // ─── Cards ───────────────────────────────────────────────────────────────
  getCards: async (): Promise<Card[]> => {
    const { data } = await api.get('/cards');
    return data.cards;
  },

  createCard: async (card: Card): Promise<Card> => {
    const { data } = await api.post('/cards', card);
    return data.card;
  },

  updateCard: async (id: string, updates: Partial<Card>): Promise<Card> => {
    const { data } = await api.patch(`/cards/${id}`, updates);
    return data.card;
  },

  deleteCard: async (id: string): Promise<void> => {
    await api.delete(`/cards/${id}`);
  },

  // ─── Connectors ──────────────────────────────────────────────────────────
  getConnectors: async (): Promise<Connector[]> => {
    const { data } = await api.get('/connectors');
    return data.connectors;
  },

  createConnector: async (connector: Connector): Promise<Connector> => {
    const { data } = await api.post('/connectors', connector);
    return data.connector;
  },

  deleteConnector: async (id: string): Promise<void> => {
    await api.delete(`/connectors/${id}`);
  },
};
