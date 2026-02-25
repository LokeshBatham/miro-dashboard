import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { useBoardStore } from '../store/useBoardStore';

export const usePan = (containerRef: RefObject<HTMLElement | null>) => {
    const currentTool = useBoardStore(state => state.currentTool);
    const [isPanning, setIsPanning] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            if (e.code === 'Space' && !e.repeat && !isInput) {
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let startX = 0;
        let startY = 0;
        let initialOffsetX = 0;
        let initialOffsetY = 0;

        const handlePointerDown = (e: PointerEvent) => {
            // Allow panning if space is pressed, hand tool is selected, or middle mouse button is pressed
            if ((isSpacePressed || currentTool === 'hand' || e.button === 1) && e.button !== 2) {
                setIsPanning(true);
                startX = e.clientX;
                startY = e.clientY;
                initialOffsetX = useBoardStore.getState().canvasOffset.x;
                initialOffsetY = useBoardStore.getState().canvasOffset.y;
                container.setPointerCapture(e.pointerId);
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (isPanning) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const { canvasScale, setCanvasTransform } = useBoardStore.getState();
                setCanvasTransform(canvasScale, {
                    x: initialOffsetX + dx,
                    y: initialOffsetY + dy
                });
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            if (isPanning) {
                setIsPanning(false);
                container.releasePointerCapture(e.pointerId);
            }
        };

        container.addEventListener('pointerdown', handlePointerDown);
        container.addEventListener('pointermove', handlePointerMove);
        container.addEventListener('pointerup', handlePointerUp);

        return () => {
            container.removeEventListener('pointerdown', handlePointerDown);
            container.removeEventListener('pointermove', handlePointerMove);
            container.removeEventListener('pointerup', handlePointerUp);
        };
    }, [containerRef, isSpacePressed, currentTool, isPanning]);

    return { isSpacePressed, isPanning };
};
