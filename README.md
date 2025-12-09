# The Infinite Evolutionary Engine

A high-performance, infinite-canvas Cellular Automaton platform powered by the **Hashlife** algorithm.

![Demo](https://via.placeholder.com/800x400?text=Infinite+Evolutionary+Engine)

## 🚀 Features

- **Hashlife Algorithm**: Simulates trillions of generations instantly using memoization.
- **Infinite Canvas**: Explore a limitless universe with smooth 60fps zooming and panning.
- **QuadTree Architecture**: Efficient spatial storage with canonical node caching (Flyweight pattern).
- **Pattern Library**: Includes classic patterns (Gosper Glider Gun, Pulsars, Space Ships).
- **Modern UI**: Glassmorphism sidebar with real-time stats and speed controls.

## 🛠️ Tech Stack

- **Core**: React 19, TypeScript
- **Build**: Vite
- **Testing**: Vitest
- **Performance**: WebGL-ready Canvas API, Custom Hashlife Engine

## 🏁 How to Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   > Open [http://localhost:5173](http://localhost:5173) in your browser.

3. **Run Tests**
   ```bash
   npm test
   ```

## 🎮 Controls

- **Pan**: Click and drag on the canvas.
- **Zoom**: Scroll up/down.
- **Play/Pause**: Toggle simulation.
- **Step**: Advance by one engine step (variable time jump based on zoom/level).
- **Speed**: Adjust the simulation loop delay.

## 🏗️ Architecture

The engine is built on a custom **QuadTree** implementation located in `src/engine/`. 
- `Hashlife.ts`: Core recursive algorithm.
- `QuadTree.ts`: Spatial data structure with garbage collection.
- `CanvasRenderer.tsx`: Optimized React canvas component.

---
*Built as part of the Advanced Agentic Coding Project.*
