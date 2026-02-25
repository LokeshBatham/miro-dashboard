import React, { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useBoardStore } from '../../store/useBoardStore';
import { useZoom } from '../../hooks/useZoom';
import { usePan } from '../../hooks/usePan';
import { Card } from '../Card/Card';
import { Connector } from '../Connector/Connector';

export const Board: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Extract specific state to prevent unnecessary re-renders
  const canvasScale = useBoardStore(state => state.canvasScale);
  const canvasOffset = useBoardStore(state => state.canvasOffset);
  const currentTool = useBoardStore(state => state.currentTool);
  const cards = useBoardStore(state => state.cards);
  const connectors = useBoardStore(state => state.connectors);
  const addCard = useBoardStore(state => state.addCard);
  const setTool = useBoardStore(state => state.setTool);
  const setSelectedIds = useBoardStore(state => state.setSelectedIds);
  const setConnectingFrom = useBoardStore(state => state.setConnectingFrom);

  useZoom(containerRef);
  const { isSpacePressed, isPanning } = usePan(containerRef);

  const handlePointerDown = (e: React.PointerEvent) => {
    // If middle click or space pressed, it's panning, handled by usePan.
    if (e.button === 1 || isSpacePressed || currentTool === 'hand') return;

    if (currentTool === 'arrow') {
        // Clicking on board cancels connector creation
        setConnectingFrom(null);
        setTool('select');
        return;
    }

    if (currentTool === 'sticky' && e.button === 0) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Calculate position relative to canvas transform
      const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      // offset by click point so card appears centered on cursor
      const cardWidth = 200;
      const cardHeight = 200;
      const centeredX = x - (cardWidth / 2);
      
      const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
      const centeredY = y - (cardHeight / 2);

      const colors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newCard = {
        id: uuidv4(),
        x: centeredX,
        y: centeredY,
        width: cardWidth,
        height: cardHeight,
        text: '',
        color: randomColor
      };

      addCard(newCard);
      setTool('select');
      return;
    }

    // Deselect if clicking directly on the board background
    if (currentTool === 'select' && e.target === containerRef.current) {
        setSelectedIds([]);
    }
  };

  // Background styling for the grid
  const bgSize = 20 * canvasScale;
  const bgPosX = canvasOffset.x;
  const bgPosY = canvasOffset.y;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className={`relative w-full h-screen overflow-hidden ${
        isSpacePressed || currentTool === 'hand'
          ? isPanning ? 'cursor-grabbing' : 'cursor-grab'
          : currentTool === 'sticky' ? 'cursor-crosshair' : 
            currentTool === 'arrow' ? 'cursor-crosshair' : 'cursor-default'
      }`}
      style={{
        backgroundColor: '#f8f9fa',
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: `${bgSize}px ${bgSize}px`,
        backgroundPosition: `${bgPosX}px ${bgPosY}px`,
        touchAction: 'none'
      }}
    >
      <div
        className="absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
        }}
      >
        <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
            </marker>
            <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
            </marker>
          </defs>
          <g className="pointer-events-auto">
            {connectors.map(connector => (
              <Connector key={connector.id} connector={connector} />
            ))}
          </g>
        </svg>

        <div className="relative w-full h-full pointer-events-auto">
          {cards.map(card => (
            <Card key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
};
