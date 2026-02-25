import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useBoardStore } from '../store/useBoardStore';

export const useZoom = (containerRef: RefObject<HTMLElement | null>) => {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            // Don't intercept scroll if we're not zooming over the canvas directly
            // Or if the wheel event doesn't have Ctrl key pressed (like Miro) OR we just accept all wheel to zoom
            // Often in Miro, regular wheel pans, Ctrl+Wheel zooms. We'll stick to Wheel for zoom/pan depending on delta.
            // But standard feature requested "implement zoom in/out using mouse wheel". We'll zoom on wheel.
            e.preventDefault();

            const { canvasScale, canvasOffset, setCanvasTransform } = useBoardStore.getState();

            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.1, canvasScale * Math.exp(delta)), 5); // 10% to 500%

            const scaleRatio = newScale / canvasScale;

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const newOffsetX = mouseX - (mouseX - canvasOffset.x) * scaleRatio;
            const newOffsetY = mouseY - (mouseY - canvasOffset.y) * scaleRatio;

            setCanvasTransform(newScale, { x: newOffsetX, y: newOffsetY });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [containerRef]);
};
