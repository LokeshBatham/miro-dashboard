import React from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import type { Connector as ConnectorType } from '../../types/board.types';

interface ConnectorProps {
  connector: ConnectorType;
}

export const Connector: React.FC<ConnectorProps> = ({ connector }) => {
  const cards = useBoardStore(state => state.cards);
  const selectedIds = useBoardStore(state => state.selectedIds);
  const setSelectedIds = useBoardStore(state => state.setSelectedIds);
  const currentTool = useBoardStore(state => state.currentTool);
  const isSelected = selectedIds.includes(connector.id);

  const fromCard = cards.find(c => c.id === connector.fromCardId);
  const toCard = cards.find(c => c.id === connector.toCardId);

  if (!fromCard || !toCard) return null;

  const startX = fromCard.x + fromCard.width / 2;
  const startY = fromCard.y + fromCard.height / 2;
  const centerEndX = toCard.x + toCard.width / 2;
  const centerEndY = toCard.y + toCard.height / 2;

  // Calculate intersection with the target card's bounding box so the arrow doesn't hide under it
  const dx = centerEndX - startX;
  const dy = centerEndY - startY;
  
  // Distance from center to edge theoretically based on angle
  const hw = toCard.width / 2;
  const hh = toCard.height / 2;
  
  // To find intersection of line from center to outside point through a rectangle:
  // t is the scale factor of the vector (dx, dy)
  let t = 1;
  if (Math.abs(dx) > 0.001) t = Math.min(t, hw / Math.abs(dx));
  if (Math.abs(dy) > 0.001) t = Math.min(t, hh / Math.abs(dy));
  
  // The end point should be slightly outside the card, so we pad it by ~8px for the marker
  const arrowPadding = 12;
  // Reduce the distance by (t * total_distance + padding) -- wait, t gives us the vector from center to edge.
  // We want the vector from startX to [centerEnd - (t * vector) - padding].
  
  // Vector from toCard center towards fromCard center
  const revDx = startX - centerEndX;
  const revDy = startY - centerEndY;
  
  let revT = 1;
  if (Math.abs(revDx) > 0.001) revT = Math.min(revT, hw / Math.abs(revDx));
  if (Math.abs(revDy) > 0.001) revT = Math.min(revT, hh / Math.abs(revDy));
  
  // Length of the vector from center to edge
  const edgeDist = Math.sqrt((revDx * revT) ** 2 + (revDy * revT) ** 2);
  
  // Total distance between centers
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // We want to stop at `edgeDist + padding` away from the end center
  const stopDist = dist - edgeDist - arrowPadding;
  const ratio = Math.max(0, stopDist / dist);
  
  const endX = startX + dx * ratio;
  const endY = startY + dy * ratio;

  // Start point intersection (optional, but helps with curved paths if needed, here just doing end)
  
  // Create a smooth S-curve cubic bezier
  // Control points extend from start and end horizontally or vertically based on relative position
  const controlPointDist = Math.max(Math.abs(dx), Math.abs(dy)) * 0.5;
  
  // Decide if we should route mostly horizontal or vertical
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  
  const cp1x = isHorizontal ? startX + controlPointDist * Math.sign(dx) : startX;
  const cp1y = isHorizontal ? startY : startY + controlPointDist * Math.sign(dy);
  
  const cp2x = isHorizontal ? endX - controlPointDist * Math.sign(dx) : endX;
  const cp2y = isHorizontal ? endY : endY - controlPointDist * Math.sign(dy);
  
  const d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (currentTool !== 'select') return;
    if (e.shiftKey) {
      setSelectedIds(isSelected ? selectedIds.filter(id => id !== connector.id) : [...selectedIds, connector.id]);
    } else {
      setSelectedIds([connector.id]);
    }
  };

  return (
    <g onPointerDown={handlePointerDown} className={currentTool === 'select' ? 'cursor-pointer' : ''}>
      <path
        d={d}
        fill="transparent"
        stroke={isSelected ? '#6366f1' : '#9ca3af'}
        strokeWidth="4"
        strokeDasharray={connector.style === 'dashed' ? '8 8' : 'none'}
        markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
        className={`transition-colors ${isSelected ? '' : 'hover:stroke-gray-600'}`}
      />
      {/* Invisible wider path for easier clicking */}
      <path
        d={d}
        fill="transparent"
        stroke="transparent"
        strokeWidth="20"
      />
    </g>
  );
};
