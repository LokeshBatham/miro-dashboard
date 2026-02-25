import React, { useRef, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Card as CardType } from '../../types/board.types';
import { useBoardStore } from '../../store/useBoardStore';

interface CardProps {
  card: CardType;
}

export const Card: React.FC<CardProps> = ({ card }) => {
  const { 
    updateCard, 
    selectedIds, 
    setSelectedIds, 
    currentTool, 
    connectingFromCardId, 
    setConnectingFrom, 
    addConnector,
    setTool
  } = useBoardStore();
  
  const isSelected = selectedIds.includes(card.id);
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);

  // Focus effect when starting to edit
  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
    }
  }, [isEditing]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();

    // Arrow Tool connect logic
    if (currentTool === 'arrow') {
      if (!connectingFromCardId) {
        setConnectingFrom(card.id);
      } else {
        if (connectingFromCardId !== card.id) {
          addConnector({
            id: uuidv4(),
            fromCardId: connectingFromCardId,
            toCardId: card.id,
            type: 'straight',
            style: 'solid'
          });
        }
        setConnectingFrom(null);
        setTool('select');
      }
      return;
    }
    
    // Select card unless editing
    if (!isEditing) {
      if (e.shiftKey) {
        setSelectedIds(isSelected ? selectedIds.filter(id => id !== card.id) : [...selectedIds, card.id]);
      } else {
        setSelectedIds([card.id]);
      }
    }

    // Only allow drag if we're not editing and tool is select
    if (currentTool !== 'select' || isEditing) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = card.x;
    const initialY = card.y;
    const scale = useBoardStore.getState().canvasScale;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      
      updateCard(card.id, {
        x: initialX + dx,
        y: initialY + dy
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (currentTool !== 'select') return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = card.width;
    const initialHeight = card.height;
    const scale = useBoardStore.getState().canvasScale;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      
      updateCard(card.id, {
        width: Math.max(100, initialWidth + dx),
        height: Math.max(50, initialHeight + dy)
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const stopPropagation = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (currentTool === 'select') setIsEditing(true);
      }}
      className={`absolute shadow-md transition-shadow group rounded-xl
        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
        ${currentTool === 'select' && !isEditing ? 'cursor-move hover:shadow-lg' : ''}
      `}
      style={{
        transform: `translate(${card.x}px, ${card.y}px)`,
        width: `${card.width}px`,
        height: `${card.height}px`,
        backgroundColor: card.color,
      }}
    >
      <div
        ref={textRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onPointerDown={stopPropagation}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        onBlur={() => {
          setIsEditing(false);
          if (textRef.current && textRef.current.innerText !== card.text) {
            updateCard(card.id, { text: textRef.current.innerText });
          }
        }}
        onKeyDown={(e) => {
          stopPropagation(e);
          // Don't trigger board level shortcuts while typing
        }}
        className={`w-full h-full p-4 outline-none overflow-hidden styling-content text-gray-800 break-words ${
          isEditing ? 'cursor-text' : 'pointer-events-none'
        }`}
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
        }}
        dangerouslySetInnerHTML={{ __html: card.text }}
      />

      {/* Resize Handle */}
      {isSelected && (
        <div
          onPointerDown={handleResizeDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-indigo-500 rounded-sm" />
        </div>
      )}

      {/* Delete Button */}
      {currentTool === 'select' && !isEditing && (
        <button
          className="absolute -top-3 -right-3 w-6 h-6 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
          onPointerDown={(e) => {
            e.stopPropagation();
            useBoardStore.getState().deleteCards([card.id]);
          }}
          title="Delete Card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
};
