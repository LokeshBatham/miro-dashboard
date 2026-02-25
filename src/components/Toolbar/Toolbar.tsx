import { MousePointer2, Hand, StickyNote, ArrowRight, Undo2, Redo2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useBoardStore } from '../../store/useBoardStore';
import type { ToolType } from '../../types/board.types';

export const Toolbar = () => {
  const { currentTool, setTool, undo, redo, past, future, canvasScale, setCanvasTransform, canvasOffset } = useBoardStore();

  const handleToolClick = (tool: ToolType) => {
    setTool(tool);
  };

  const handleZoomIn = () => {
    setCanvasTransform(Math.min(canvasScale * 1.2, 5), canvasOffset);
  };

  const handleZoomOut = () => {
    setCanvasTransform(Math.max(canvasScale / 1.2, 0.1), canvasOffset);
  };

  const handleResetZoom = () => {
    setCanvasTransform(1, { x: 0, y: 0 });
  };

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-2 z-50">
      <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
        <ToolButton 
          active={currentTool === 'select'} 
          onClick={() => handleToolClick('select')} 
          icon={<MousePointer2 size={20} />} 
          title="Select (V)" 
        />
        <ToolButton 
          active={currentTool === 'hand'} 
          onClick={() => handleToolClick('hand')} 
          icon={<Hand size={20} />} 
          title="Hand (H)" 
        />
        <ToolButton 
          active={currentTool === 'sticky'} 
          onClick={() => handleToolClick('sticky')} 
          icon={<StickyNote size={20} />} 
          title="Sticky Note (N)" 
        />
        <ToolButton 
          active={currentTool === 'arrow'} 
          onClick={() => handleToolClick('arrow')} 
          icon={<ArrowRight size={20} />} 
          title="Connector (L)" 
        />
      </div>

      <div className="flex flex-col gap-1 border-b border-gray-100 pb-2 py-2">
        <ToolButton 
          onClick={undo} 
          disabled={past.length === 0} 
          icon={<Undo2 size={20} />} 
          title="Undo (Ctrl+Z)" 
        />
        <ToolButton 
          onClick={redo} 
          disabled={future.length === 0} 
          icon={<Redo2 size={20} />} 
          title="Redo (Ctrl+Y)" 
        />
      </div>

      <div className="flex flex-col gap-1 pt-2">
        <ToolButton 
          onClick={handleZoomIn} 
          icon={<ZoomIn size={20} />} 
          title="Zoom In" 
        />
        <div className="text-[10px] font-medium text-gray-500 text-center py-1">
          {Math.round(canvasScale * 100)}%
        </div>
        <ToolButton 
          onClick={handleZoomOut} 
          icon={<ZoomOut size={20} />} 
          title="Zoom Out" 
        />
        <ToolButton 
          onClick={handleResetZoom} 
          icon={<Maximize size={20} />} 
          title="Reset View" 
        />
      </div>
    </div>
  );
};

interface ToolButtonProps {
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}

const ToolButton = ({ icon, active, disabled, onClick, title }: ToolButtonProps) => {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={title}
      className={`p-2.5 rounded-lg flex items-center justify-center transition-colors
        ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}
        ${active ? 'bg-indigo-100 text-indigo-700' : ''}
      `}
    >
      {icon}
    </button>
  );
};
