import React, { useRef, useEffect, useState } from 'react';
import { QuadTree, type QuadTreeNode } from '../engine/QuadTree';

interface CanvasRendererProps {
    universeRef: React.MutableRefObject<QuadTreeNode>;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ universeRef }) => {
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

                // Draw
                const universe = universeRef.current;
                const cam = cameraRef.current;

                ctx.fillStyle = '#0f0'; // Retro green

                // Calculate Viewport Bounds in World Space
                // Screen: (0,0) to (width, height)
                // World: (screen - offset) / zoom + center
                // minX = (0 - offsetX) / zoom + x
                // maxX = (width - offsetX) / zoom + x

                const viewport = {
                    minX: -cam.offsetX / cam.zoom + cam.x,
                    maxX: (canvas.width - cam.offsetX) / cam.zoom + cam.x,
                    minY: -cam.offsetY / cam.zoom + cam.y,
                    maxY: (canvas.height - cam.offsetY) / cam.zoom + cam.y
                };

                // Recursive Draw
                // We start drawing the root node, which we assume covers a very large area rooted at (0,0)??
                // Wait, QuadTree structure defines strict coverage.
                // A node at level K covers 0..2^K, 0..2^K (relative to its own top-left).
                // Where is the Root located in World Space?
                // Hashlife usually centers the root at (0,0)?
                // Or strictly, the quadtree indices are unsigned integers 0..2^64.
                // But for infinite canvas, we usually map "0,0" to the center of the initial generation.
                // Let's assume the Root Node's top-left is at (-Size/2, -Size/2) in world space?
                // Let's assume standard logic: (0,0) is top-left of the node. 
                // We can just draw it at an arbitrary offset.
                // Let's say we define World (0,0) as the center of the root node.

                const size = 1 << universe.level;
                // World position of top-left corner of root
                const rootX = -(size / 2);
                const rootY = -(size / 2); // Center the universe at (0,0)

                drawNode(ctx, universe, rootX, rootY, size, viewport, cam);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameId);
    }, []); // universeRef is mutable, so deep dep not needed given we read .current in loop

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
