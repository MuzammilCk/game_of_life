import { useRef, useState, useEffect, useCallback } from 'react';
import { CanvasRenderer } from './components/CanvasRenderer';
import { Sidebar } from './components/Sidebar';
import { QuadTree, type QuadTreeNode } from './engine/QuadTree';
import { Hashlife } from './engine/Hashlife';
import { parseRLE, centerPattern } from './utils/rle';
import { PATTERNS } from './data/patterns';

function App() {
  const engineRef = useRef(new Hashlife());
  const universeRef = useRef<QuadTreeNode>(QuadTree.empty(0));

  // State
  const [playing, setPlaying] = useState(false);
  const [generation, setGeneration] = useState<bigint>(0n);
  const [population, setPopulation] = useState(0);
  const [speed, setSpeed] = useState(50); // ms per frame
  const [fps, setFps] = useState(0); // From renderer
  const [autoExpand, setAutoExpand] = useState(true);

  // Load Pattern Helper
  const loadPattern = useCallback((rle: string) => {
    // Stop simulation
    setPlaying(false);

    engineRef.current.clearCache();

    try {
      const coords = centerPattern(parseRLE(rle));
      let root = QuadTree.empty(8);

      const maxDim = Math.max(...coords.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
      while ((1 << (root.level - 1)) <= maxDim + 10) {
        root = QuadTree.empty(root.level + 1);
      }

      // Center offset
      const size = 1 << root.level;
      const offset = size / 2;

      for (const [x, y] of coords) {
        // Adjust (0,0) center to (offset, offset) for QuadTree structure
        root = QuadTree.setCell(root, x + offset, y + offset, true);
      }

      universeRef.current = root;
      setGeneration(0n);
      setPopulation(root.population);
      QuadTree.collectGarbage([root]);

    } catch (e) {
      console.error("Failed to load pattern", e);
      alert("Failed to load pattern");
    }
  }, []);

  // Initialize with Gosper Gun
  useEffect(() => {
    loadPattern(PATTERNS["Gosper Glider Gun"]);
  }, [loadPattern]);

  // Simulation Step
  const stepCount = useRef(0);

  const step = useCallback(() => {
    let root = universeRef.current;

    // 1. Expand
    root = QuadTree.expand(root); // K -> K+1

    // AUTO-EXPAND: Grow the universe if enabled
    if (autoExpand && root.level < 30) {
      root = QuadTree.expand(root); // K+1 -> K+2
    }

    // 2. Evolve
    // Use advance(1) for smooth animation!
    root = engineRef.current.advance(root, 1);

    universeRef.current = root;

    // Stats
    const stepSize = 1n; // We are stepping 1 gen now
    setGeneration(g => g + stepSize);
    setPopulation(root.population);

    // 3. Periodic GC
    stepCount.current++;
    if (stepCount.current % 20 === 0) {
      if (stepCount.current % 100 === 0) {
        engineRef.current.clearCache();
      }
      QuadTree.collectGarbage([root]);
    }
  }, [autoExpand]);

  // Loop
  useEffect(() => {
    let timeoutId: number;
    let running = true;

    const loop = () => {
      if (!running) return;
      if (playing) {
        step();
      }
      timeoutId = setTimeout(loop, speed);
    };

    if (playing) loop();

    return () => {
      running = false;
      clearTimeout(timeoutId);
    };
  }, [playing, speed, step]);

  const handleReset = () => {
    engineRef.current.clearCache();
    loadPattern(PATTERNS["Gosper Glider Gun"]);
  };

  // Drawing Handler
  const handleCellToggle = useCallback((x: number, y: number) => {
    // PAUSE simulation while drawing
    setPlaying(false);

    try {
      let root = universeRef.current;

      // Expand if out of bounds
      for (let i = 0; i < 10; i++) {
        const size = 1 << root.level;
        const half = size >> 1;
        if (x >= -half && x < half && y >= -half && y < half) {
          break;
        }
        root = QuadTree.expand(root);
      }

      // Convert World (Centered) to Local (Top-Left)
      const size = 1 << root.level;
      const half = size >> 1;
      const localX = x + half;
      const localY = y + half;

      // Set Cell (Draw)
      root = QuadTree.setCell(root, localX, localY, true);

      universeRef.current = root;
      setPopulation(root.population);
      // Canvas will re-render next frame

    } catch (e) {
      console.warn("Failed to set cell", e);
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <CanvasRenderer
        universeRef={universeRef}
        onFpsChange={setFps}
        onCellToggle={handleCellToggle}
      />

      <Sidebar
        playing={playing}
        onTogglePlay={() => setPlaying(!playing)}
        onStep={step}
        onReset={handleReset}
        onLoadPattern={loadPattern}
        speed={speed}
        onSpeedChange={setSpeed}
        autoExpand={autoExpand}
        onToggleAutoExpand={() => setAutoExpand(prev => !prev)}
        stats={{
          generation,
          population,
          level: universeRef.current?.level || 0,
          fps
        }}
      />
    </div>
  );
}

export default App;
