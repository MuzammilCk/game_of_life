import React, { useRef, useEffect, useState } from 'react';
import type { QuadTreeNode } from '../engine/QuadTree';

interface CanvasRendererProps {
    universeRef: React.MutableRefObject<QuadTreeNode>;
    onFpsChange?: (fps: number) => void;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ universeRef, onFpsChange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Camera state
    // Using refs for animation loop performance (no react re-renders)
    const cameraRef = useRef({
        x: 0, // World coordinates of center
        y: 0,
        zoom: 4, // Pixels per cell
        offsetX: 0, // Screen center offset
        offsetY: 0
    });

    // Mouse interaction state
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    // Debug/Stats
    const [fps, setFps] = useState(0);

    // Propagate FPS to parent
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
                const newFps = Math.round((frameCount * 1000) / (time - lastFpsTime));
                setFps(newFps);
                frameCount = 0;
                lastFpsTime = time;
            }

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d', { alpha: false }); // Optimization

            if (canvas && ctx && containerRef.current) {
                // Handle Resize
                const { clientWidth, clientHeight } = containerRef.current;
                if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
                    canvas.width = clientWidth;
                    canvas.height = clientHeight;
                    cameraRef.current.offsetX = clientWidth / 2;
                    cameraRef.current.offsetY = clientHeight / 2;
                }

                // Clear
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw Grid
                // Only draw if zoom is reasonable (> 2px per cell?)
                if (cam.zoom > 2) {
                    ctx.strokeStyle = '#222';
                    ctx.lineWidth = 1;
                    ctx.beginPath();

                    // Vertical lines
                    // World X range: viewport.minX to viewport.maxX
                    const startX = Math.floor(viewport.minX);
                    const endX = Math.ceil(viewport.maxX);

                    for (let x = startX; x <= endX; x++) {
                        const screenX = (x - cam.x) * cam.zoom + cam.offsetX;
                        ctx.moveTo(screenX, 0);
                        ctx.lineTo(screenX, canvas.height);
                    }

                    // Horizontal lines
                    const startY = Math.floor(viewport.minY);
                    const endY = Math.ceil(viewport.maxY);

                    for (let y = startY; y <= endY; y++) {
                        const screenY = (y - cam.y) * cam.zoom + cam.offsetY;
                        ctx.moveTo(0, screenY);
                        ctx.lineTo(canvas.width, screenY);
                    }

                    ctx.stroke();
                }

                // Draw Axes (Optional, but helpful)
                // X Axis
                const screenY0 = (-cam.y) * cam.zoom + cam.offsetY;
                if (screenY0 >= 0 && screenY0 <= canvas.height) {
                    ctx.strokeStyle = '#444';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, screenY0);
                    ctx.lineTo(canvas.width, screenY0);
                    ctx.stroke();
                }

                // Y Axis
                const screenX0 = (-cam.x) * cam.zoom + cam.offsetX;
                if (screenX0 >= 0 && screenX0 <= canvas.width) {
                    ctx.strokeStyle = '#444';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(screenX0, 0);
                    ctx.lineTo(screenX0, canvas.height);
                    ctx.stroke();
                }

                // Draw
                const universe = universeRef.current;
                const cam = cameraRef.current;

                ctx.fillStyle = '#0f0'; // Retro green

                // Calculate Viewport Bounds in World Space
                const viewport = {
                    minX: -cam.offsetX / cam.zoom + cam.x,
                    maxX: (canvas.width - cam.offsetX) / cam.zoom + cam.x,
                    minY: -cam.offsetY / cam.zoom + cam.y,
                    maxY: (canvas.height - cam.offsetY) / cam.zoom + cam.y
                };

                const size = 1 << universe.level;
                const rootX = -(size / 2);
                const rootY = -(size / 2);

                drawNode(ctx, universe, rootX, rootY, size, viewport, cam);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameId);
    }, []); // universeRef is mutable

    const drawNode = (
        ctx: CanvasRenderingContext2D,
        node: QuadTreeNode,
        x: number,
        y: number,
        size: number,
        vp: { minX: number, maxX: number, minY: number, maxY: number },
        cam: { x: number, y: number, zoom: number, offsetX: number, offsetY: number }
    ) => {
        // 1. Culling
        // Checks if rectangle (x,y,size,size) intersects viewport
        if (x + size < vp.minX || x > vp.maxX || y + size < vp.minY || y > vp.maxY) {
            return;
        }

        // 2. Empty check
        if (node.population === 0) return;

        // 3. Leaf / Low Detail check
        // If size shows up as small on screen, draw a rect
        const screenSize = size * cam.zoom;

        // Performance: If cells are smaller than 1px, draw the node as a density block
        // Or if node is Level 0 (Leaf)
        if (node.level === 0) {
            // Draw cell
            const screenX = (x - cam.x) * cam.zoom + cam.offsetX;
            const screenY = (y - cam.y) * cam.zoom + cam.offsetY;

            // Use fillRect. To avoid gaps due to rounding, maybe add slightly to width?
            // Or strictly size.
            ctx.fillRect(screenX, screenY, Math.max(cam.zoom, 1), Math.max(cam.zoom, 1));
            return;
        }

        if (screenSize < 2) { // Less than 2 pixels for entire node?
            // Draw aggregate point
            const screenX = (x - cam.x) * cam.zoom + cam.offsetX;
            const screenY = (y - cam.y) * cam.zoom + cam.offsetY;
            ctx.globalAlpha = Math.min(1, node.population / (size * size)); // approximate density
            ctx.fillRect(screenX, screenY, screenSize, screenSize);
            ctx.globalAlpha = 1;
            return;
        }

        // 4. Recursive
        const half = size / 2;
        // nw: x, y
        // ne: x + half, y
        // sw: x, y + half
        // se: x + half, y + half
        if (node.nw) drawNode(ctx, node.nw, x, y, half, vp, cam);
        if (node.ne) drawNode(ctx, node.ne, x + half, y, half, vp, cam);
        if (node.sw) drawNode(ctx, node.sw, x, y + half, half, vp, cam);
        if (node.se) drawNode(ctx, node.se, x + half, y + half, half, vp, cam);
    };

    // Interaction Handlers
    const handleWheel = (e: React.WheelEvent) => {
        const cam = cameraRef.current;
        const zoomFactor = 1.1;
        const direction = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;

        // Zoom towards mouse
        // Mouse screen pos:
        const rect = canvasRef.current!.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Convert mouse to world (before zoom)
        const wx = (mx - cam.offsetX) / cam.zoom + cam.x;
        const wy = (my - cam.offsetY) / cam.zoom + cam.y;

        cam.zoom *= direction;
        // Clamp zoom
        cam.zoom = Math.max(0.0000001, Math.min(cam.zoom, 1000)); // Infinite zoom range support

        // Adjust camera position so (wx, wy) remains at (mx, my)
        // mx = (wx - newCamX) * newZoom + offsetX
        // mx - offsetX = (wx - newCamX) * newZoom
        // (mx - offsetX)/newZoom = wx - newCamX
        // newCamX = wx - (mx - offsetX)/newZoom
        cam.x = wx - (mx - cam.offsetX) / cam.zoom;
        cam.y = wy - (my - cam.offsetY) / cam.zoom;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        lastMouse.current = { x: e.clientX, y: e.clientY };

        const cam = cameraRef.current;
        cam.x -= dx / cam.zoom;
        cam.y -= dy / cam.zoom;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    return (
        <div
            ref={containerRef}
            style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}
        >
            <canvas
                ref={canvasRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ display: 'block' }}
            />
            <div style={{ position: 'absolute', top: 10, left: 10, color: '#0f0', pointerEvents: 'none', fontFamily: 'monospace' }}>
                FPS: {fps} <br />
                Zoom: {Math.round(cameraRef.current?.zoom * 100) / 100} <br />
                Pos: ({Math.round(cameraRef.current?.x)}, {Math.round(cameraRef.current?.y)})
            </div>
        </div>
    );
};
