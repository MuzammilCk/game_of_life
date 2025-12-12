import React, { useRef, useEffect, useState } from 'react';
import { QuadTree, type QuadTreeNode } from '../engine/QuadTree';

interface CanvasRendererProps {
    universeRef: React.MutableRefObject<QuadTreeNode>;
    onFpsChange?: (fps: number) => void;
    onCellToggle?: (x: number, y: number, alive: boolean) => void; // Request to toggle a cell
    resetTrigger?: number; // NEW
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ universeRef, onFpsChange, onCellToggle, resetTrigger }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Camera state
    const cameraRef = useRef({
        x: 0,
        y: 0,
        zoom: 4,
        offsetX: 0,
        offsetY: 0
    });

    // NEW: Reset Camera Effect
    useEffect(() => {
        cameraRef.current.x = 0;
        cameraRef.current.y = 0;
        cameraRef.current.zoom = 4;
        // Keep existing offsetX/Y as they depend on screen size
    }, [resetTrigger]);

    // Interaction state
    const interactionRef = useRef({
        isDragging: false,
        isDrawing: false,
        drawState: true, // NEW: Track if we are adding (true) or removing (false)
        lastMouseX: 0,
        lastMouseY: 0,
        button: 0 // 0: Left, 2: Right
    });

    // Debug/Stats
    const [fps, setFps] = useState(0);

    // Propagate FPS
    useEffect(() => {
        if (onFpsChange) onFpsChange(fps);
    }, [fps, onFpsChange]);

    useEffect(() => {
        let animationFrameId: number;
        let lastTime = performance.now();
        let frameCount = 0;
        let lastFpsTime = lastTime;

        const render = (time: number) => {
            frameCount++;
            if (time - lastFpsTime >= 1000) {
                setFps(Math.round((frameCount * 1000) / (time - lastFpsTime)));
                frameCount = 0;
                lastFpsTime = time;
            }

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d', { alpha: false });

            if (canvas && ctx && containerRef.current) {
                // Handle Resize & DPI
                const dpr = window.devicePixelRatio || 1;
                const { clientWidth, clientHeight } = containerRef.current;

                // Check if dimensions or DPI changed
                if (canvas.width !== clientWidth * dpr || canvas.height !== clientHeight * dpr) {
                    canvas.width = clientWidth * dpr;
                    canvas.height = clientHeight * dpr;
                    // Scale context to match DPI
                    // Reset transform before setting new one
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.scale(dpr, dpr);

                    // Pixel Art Mode (Crisp edges)
                    ctx.imageSmoothingEnabled = false;
                }

                // ALWAYS update camera center offset (in case of container resize without canvas resize, or initial frame)
                cameraRef.current.offsetX = clientWidth / 2;
                cameraRef.current.offsetY = clientHeight / 2;

                // --- RENDER START ---
                // Background - Deep Void/Space Color
                ctx.fillStyle = '#050505';
                // Clear using logical coordinates (clientWidth/Height)
                ctx.fillRect(0, 0, clientWidth, clientHeight);

                const universe = universeRef.current;
                const cam = cameraRef.current;

                // Viewport in World Space
                // Uses logical pixels (clientWidth) for calculation
                const width = clientWidth;
                const height = clientHeight;

                const viewport = {
                    minX: -cam.offsetX / cam.zoom + cam.x,
                    maxX: (width - cam.offsetX) / cam.zoom + cam.x,
                    minY: -cam.offsetY / cam.zoom + cam.y,
                    maxY: (height - cam.offsetY) / cam.zoom + cam.y
                };

                // 1. Draw Grid (Context)
                // Adaptive Grid: Fade out when too dense
                if (cam.zoom > 3) {
                    ctx.strokeStyle = `rgba(50, 50, 50, ${Math.min(1, cam.zoom / 10)})`; // Subtle
                    ctx.lineWidth = 0.5; // Thinner lines
                    ctx.beginPath();

                    // Snap to integers
                    const startX = Math.floor(viewport.minX);
                    const endX = Math.ceil(viewport.maxX);
                    for (let x = startX; x <= endX; x++) {
                        const screenX = (x - cam.x) * cam.zoom + cam.offsetX;
                        ctx.moveTo(screenX, 0);
                        ctx.lineTo(screenX, clientHeight);
                    }

                    const startY = Math.floor(viewport.minY);
                    const endY = Math.ceil(viewport.maxY);
                    for (let y = startY; y <= endY; y++) {
                        const screenY = (y - cam.y) * cam.zoom + cam.offsetY;
                        ctx.moveTo(0, screenY);
                        ctx.lineTo(clientWidth, screenY);
                    }
                    ctx.stroke();
                }

                // 3. Draw Cells (The "Wow" Factor)
                // Use a glow effect
                ctx.fillStyle = '#4ade80'; // Neon Green
                ctx.shadowColor = '#4ade80';

                // Only enable shadow if zoom is high enough (expensive!)
                if (cam.zoom > 4) {
                    ctx.shadowBlur = 15;
                } else {
                    ctx.shadowBlur = 0;
                }

                const size = 1 << universe.level;
                const rootX = -(size / 2);
                const rootY = -(size / 2);

                drawNode(ctx, universe, rootX, rootY, size, viewport, cam);

                // Reset shadow for next frame
                ctx.shadowBlur = 0;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    const drawNode = (
        ctx: CanvasRenderingContext2D,
        node: QuadTreeNode,
        x: number,
        y: number,
        size: number,
        vp: { minX: number, maxX: number, minY: number, maxY: number },
        cam: { x: number, y: number, zoom: number, offsetX: number, offsetY: number }
    ) => {
        // Culling
        if (x + size < vp.minX || x > vp.maxX || y + size < vp.minY || y > vp.maxY) return;
        if (node.population === 0) return;

        const screenSize = size * cam.zoom;

        // Leaf Node or "Small enough to be a pixel"
        if (node.level === 0) {
            const screenX = (x - cam.x) * cam.zoom + cam.offsetX;
            const screenY = (y - cam.y) * cam.zoom + cam.offsetY;
            // Draw slightly smaller than grid for "cell" look? No, fill fully for pixel feel.
            // But if grid lines are ON top?
            // Let's stick with full fill.
            // Using slightly smaller size creates "gap" between cells naturally.
            const gap = cam.zoom > 4 ? 0.5 : 0;
            ctx.fillRect(screenX, screenY, Math.max(cam.zoom - gap, 0.5), Math.max(cam.zoom - gap, 0.5));
            return;
        }

        // Density Optimization for zoomed out view
        if (screenSize < 2) {
            const screenX = (x - cam.x) * cam.zoom + cam.offsetX;
            const screenY = (y - cam.y) * cam.zoom + cam.offsetY;
            ctx.globalAlpha = Math.min(1, node.population / (size * size) * 10); // Boost visibility of sparse nodes
            ctx.fillRect(screenX, screenY, screenSize, screenSize);
            ctx.globalAlpha = 1;
            return;
        }

        const half = size / 2;
        if (node.nw) drawNode(ctx, node.nw, x, y, half, vp, cam);
        if (node.ne) drawNode(ctx, node.ne, x + half, y, half, vp, cam);
        if (node.sw) drawNode(ctx, node.sw, x, y + half, half, vp, cam);
        if (node.se) drawNode(ctx, node.se, x + half, y + half, half, vp, cam);
    };

    // --- Interaction ---

    // Wheel: Zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault(); // Stop page scroll
        const cam = cameraRef.current;
        const zoomFactor = 1.001 ** -e.deltaY; // Smooth exponential zoom

        // Mouse World Pos Before Zoom
        const rect = canvasRef.current!.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const wx = (mx - cam.offsetX) / cam.zoom + cam.x;
        const wy = (my - cam.offsetY) / cam.zoom + cam.y;

        cam.zoom *= zoomFactor;
        cam.zoom = Math.max(0.01, Math.min(cam.zoom, 500)); // Clamp

        // Adjust pos to keep mouse focused
        cam.x = wx - (mx - cam.offsetX) / cam.zoom;
        cam.y = wy - (my - cam.offsetY) / cam.zoom;
    };

    const getMouseWorldPos = (e: React.MouseEvent) => {
        const cam = cameraRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();

        // Calculate center dynamically to match render logic
        // If rect is 0 (layout shift/startup), fallback to offsetWidth/Height or 0
        const width = rect.width || canvas.clientWidth || 0;
        const height = rect.height || canvas.clientHeight || 0;

        const offsetX = width / 2;
        const offsetY = height / 2;

        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        return {
            x: Math.floor((mx - offsetX) / cam.zoom + cam.x),
            y: Math.floor((my - offsetY) / cam.zoom + cam.y)
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const state = interactionRef.current;
        state.isDragging = true;
        state.lastMouseX = e.clientX;
        state.lastMouseY = e.clientY;
        state.button = e.button;

        // SWAP: Left (0) = DRAW. Right (2) = PAN.
        if (e.button === 0 && !e.shiftKey) {
            state.isDrawing = true;
            // Draw immediately
            const pos = getMouseWorldPos(e);

            // NEW: Determine intent (Draw vs Erase)
            const universe = universeRef.current;
            const size = 1 << universe.level;
            const half = size >> 1;
            // Check if cell is currently alive
            const isAlive = QuadTree.getCell(universe, pos.x + half, pos.y + half);

            // If alive, we want to erase (false). If dead, we want to draw (true).
            state.drawState = !isAlive;

            if (onCellToggle) onCellToggle(pos.x, pos.y, state.drawState);
        } else {
            // Right Click or Shift+Click = Pan
            state.isDrawing = false;
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const state = interactionRef.current;

        // Track movement to distinguish Click vs Drag (if needed), but here we just act.
        if (!state.isDragging) return;

        if (state.isDrawing) {
            // Draw Mode
            const pos = getMouseWorldPos(e);
            // NEW: Use the stored drawState (so we don't flicker while dragging)
            if (onCellToggle) onCellToggle(pos.x, pos.y, state.drawState);
        } else {
            // Pan Mode
            const dx = e.clientX - state.lastMouseX;
            const dy = e.clientY - state.lastMouseY;
            const cam = cameraRef.current;
            cam.x -= dx / cam.zoom;
            cam.y -= dy / cam.zoom;
            state.lastMouseX = e.clientX;
            state.lastMouseY = e.clientY;
        }
    };

    const handleMouseUp = () => {
        interactionRef.current.isDragging = false;
        interactionRef.current.isDrawing = false;
    };

    return (
        <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#050505', cursor: 'crosshair' }}>
            <canvas
                ref={canvasRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={e => e.preventDefault()}
                style={{ display: 'block', width: '100%', height: '100%' }}
            />
            {/* HUD Overlay */}
            <div style={{ position: 'absolute', bottom: 20, left: 20, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: "'Inter', sans-serif", fontSize: '0.8rem' }}>
                <div style={{ marginBottom: 5 }}>Controls:</div>
                <div style={{ display: 'flex', gap: 15 }}>
                    <span style={{ color: '#4ade80' }}>Left Drag: <b>Draw</b></span>
                    <span>Right Drag / Shift+Drag: <b>Pan</b></span>
                    <span>Scroll: <b>Zoom</b></span>
                </div>
            </div>

            <div style={{ position: 'absolute', top: 10, left: 10, color: '#4ade80', pointerEvents: 'none', fontFamily: 'monospace' }}>
                FPS: {fps}
            </div>
        </div>
    );
};
