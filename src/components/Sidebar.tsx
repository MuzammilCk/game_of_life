import React from 'react';
import { PATTERNS } from '../data/patterns';

interface SidebarProps {
    playing: boolean;
    onTogglePlay: () => void;
    onStep: () => void;
    onReset: () => void;
    onLoadPattern: (rle: string) => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
    autoExpand: boolean;
    onToggleAutoExpand: () => void;
    stats: {
        generation: bigint;
        population: number;
        level: number;
        fps: number;
    };
}

export const Sidebar: React.FC<SidebarProps> = ({
    playing,
    onTogglePlay,
    onStep,
    onReset,
    onLoadPattern,
    speed,
    onSpeedChange,
    autoExpand,
    onToggleAutoExpand,
    stats
}) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '100vh',
            background: 'rgba(20, 20, 20, 0.9)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: '#eee',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header */}
            <div>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: '0 0 5px 0',
                    background: 'linear-gradient(90deg, #4ade80, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Infinite Life
                </h1>
                <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>
                    Evolutionary Engine v1.0
                </p>
            </div>

            {/* Stats */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '15px',
                borderRadius: '10px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                fontSize: '0.9rem'
            }}>
                <div>
                    <div style={{ color: '#888', fontSize: '0.7rem' }}>GENERATION</div>
                    <div style={{ fontFamily: 'monospace' }}>{stats.generation.toString()}</div>
                </div>
                <div>
                    <div style={{ color: '#888', fontSize: '0.7rem' }}>POPULATION</div>
                    <div style={{ fontFamily: 'monospace' }}>{stats.population.toLocaleString()}</div>
                </div>
                <div>
                    <div style={{ color: '#888', fontSize: '0.7rem' }}>TREE LEVEL</div>
                    <div style={{ fontFamily: 'monospace' }}>{stats.level}</div>
                </div>
                <div>
                    <div style={{ color: '#888', fontSize: '0.7rem' }}>FPS</div>
                    <div style={{ fontFamily: 'monospace', color: stats.fps < 50 ? 'orange' : '#4ade80' }}>
                        {stats.fps}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={onTogglePlay}
                    style={{
                        flex: 1,
                        background: playing ? '#ef4444' : '#22c55e',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    {playing ? 'PAUSE' : 'PLAY'}
                </button>
                <button
                    onClick={onStep}
                    disabled={playing}
                    style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: playing ? '#555' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: playing ? 'not-allowed' : 'pointer'
                    }}
                >
                    STEP
                </button>
            </div>

            <button
                onClick={onReset}
                style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid rgba(255, 68, 68, 0.5)',
                    color: '#ef4444',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
                RESET UNIVERSE
            </button>

            {/* Pattern Library */}
            <div>
                <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '10px' }}>LIBRARY</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {Object.entries(PATTERNS).map(([name, rle]) => (
                        <button
                            key={name}
                            onClick={() => onLoadPattern(rle)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: 'none',
                                padding: '10px',
                                textAlign: 'left',
                                borderRadius: '6px',
                                color: '#ccc',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Speed Control */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>SIMULATION SPEED</span>
                    <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>{(1000 / speed).toFixed(0)}ms</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={speed}
                    onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#4ade80' }}
                />
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
                    Lower is faster.
                </div>
            </div>

            {/* Expansion Settings */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '8px'
            }}>
                <input
                    type="checkbox"
                    checked={autoExpand}
                    onChange={onToggleAutoExpand}
                    style={{ accentColor: '#4ade80', width: '20px', height: '20px' }}
                />
                <div>
                    <div style={{ fontSize: '0.9rem', color: '#eee' }}>Auto Expand</div>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>Grow to fit content</div>
                </div>
            </div>
        </div>
    );
};
