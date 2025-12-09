import { useRef, useState, useEffect, useCallback } from 'react';
import { CanvasRenderer } from './components/CanvasRenderer';
import { QuadTree, type QuadTreeNode } from './engine/QuadTree';
import { Hashlife } from './engine/Hashlife';

// Gosper Glider Gun (Top-Left approx)
const INITIAL_PATTERN = [
  [24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
  [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3], [0, 4], [1, 4], [10, 4],
  [16, 4], [20, 4], [21, 4], [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5],
  [22, 5], [24, 5], [10, 6], [16, 6], [24, 6], [11, 7], [15, 7], [12, 8], [13, 8]
];

function App() {
  const engineRef = useRef(new Hashlife());
  const universeRef = useRef<QuadTreeNode>(QuadTree.empty(0)); // Init with empty, will be set in useEffect
  const [playing, setPlaying] = useState(false);
  const [generation, setGeneration] = useState<bigint>(0n);
  const [population, setPopulation] = useState(0);
  const [speed, setSpeed] = useState(1); // Not really used yet in "Mega Step" mode

  // Initialize Universe
  useEffect(() => {
    let root = QuadTree.empty(8); // Start with 256x256

    // Set pattern
    try {
      // Shift pattern to center (128, 128)
      const offsetX = 100;
      const offsetY = 100;

      for (const [x, y] of INITIAL_PATTERN) {
        root = QuadTree.setCell(root, x + offsetX, y + offsetY, true);
      }

      universeRef.current = root;
      setPopulation(root.population);

      // Force render update? The renderer uses the ref directly.
    } catch (e) {
      console.error("Error setting pattern", e);
    }
  }, []);

  // Simulation Loop
  useEffect(() => {
    let running = true;
    let animationId: number;

    const loop = () => {
      if (!running) return;

      if (playing) {
        step();
      }

      // Throttle simulation speed if needed? 
      // Current Hashlife implementation jumps 2^(level-2).
      // With Level 8 -> 2^6 = 64 generations per step.
      // This is reasonable for visual animation.

      // If we simply requestAnimationFrame, we get 60 steps/sec * 64 gens/step = 3840 gens/sec.

      animationId = setTimeout(() => requestAnimationFrame(loop), 50); // Cap at 20fps for logic to allow rendering to catch up?
    };

    loop();
    return () => { running = false; clearTimeout(animationId); };
  }, [playing]);

  const step = useCallback(() => {
    let root = universeRef.current;

    // 1. Expand (Maintain Size / Grow)
    // We expand ONLY if we need to? 
    // Hashlife `step` reduces level by 1.
    // So we expand ONCE to Level+1, then STEP to Level.
    // This maintains the level (and thus the physical size of the coverage).
    // And advances time by 2^(level-1) ? No.
    // `step(level K)` -> returns `level K-1`.
    // `expand(level K)` -> returns `level K+1`.
    // `step(expand(level K))` -> returns `level K`.
    // Time advanced: 2^( (K+1) - 2 ) = 2^(K-1).

    // Example: Current Level 8.
    // Expand -> Level 9.
    // Step -> Level 8.
    // Time Advance -> 2^(9-2) = 2^7 = 128 gens.

    // If we want massive speed, we just keep expanding and stepping?
    // Or we expand if the population is near the edge?
    // For this simple demo, let's just do `step(expand(root))` to keep it stable.

    root = QuadTree.expand(root);

    // Step
    root = engineRef.current.step(root);

    universeRef.current = root;

    // Update Stats
    const gensAdvanced = 1n << BigInt(Math.max(0, root.level - 2)); // Actually calculation above: K=Level of Result.
    // Wait: step(Input K+1) -> Output K.
    // Input Level = ResultLevel + 1.
    // Gens = 2^(InputLevel - 2) = 2^(ResultLevel - 1).

    setGeneration(g => g + (1n << BigInt(Math.max(0, root.level - 1))));
    setPopulation(root.population);
  }, []);

  const reset = () => {
    setPlaying(false);
    setGeneration(0n);
    engineRef.current.clearCache();
    // Re-init... (Simplified for now, just reload page or keeping it simple)
    window.location.reload();
  };

  return (
    <>
      <CanvasRenderer universeRef={universeRef} />

      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(0,0,0,0.8)',
        padding: '20px',
        borderRadius: '12px',
        color: 'white',
        border: '1px solid #333',
        backdropFilter: 'blur(10px)',
        minWidth: '200px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', background: 'linear-gradient(45deg, #0f0, #00f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Evolutionary Engine
        </h1>

        <div style={{ marginBottom: '15px', fontFamily: 'monospace' }}>
          <div>Gen: {generation.toString()}</div>
          <div>Pop: {population}</div>
          <div>Lvl: {universeRef.current?.level}</div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setPlaying(!playing)} style={{ flex: 1 }}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={step} disabled={playing}>
            Step
          </button>
        </div>

        <div style={{ marginTop: '10px' }}>
          <button onClick={reset} style={{ width: '100%', background: '#300' }}>
            Reset
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
