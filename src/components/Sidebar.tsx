import React from 'react';
import { PATTERNS } from '../data/patterns';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
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
    isOpen,
    onToggle,
    onLoadPattern,
    speed,
    onSpeedChange,
    autoExpand,
    onToggleAutoExpand,
    stats
}) => {
    return (
        <>
            {/* Toggle Button (Visible when closed) */}
            <button
                onClick={onToggle}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 101,
                    background: 'rgba(20, 20, 20, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
            >
                {isOpen ? '✕' : '☰'}
            </button>

            {/* Sidebar Panel */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '320px',
                height: '100%', // Use 100% of parent
                background: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '20px',
                paddingTop: '80px', // Space for toggle button
                paddingBottom: '100px', // Extra space at bottom for scrolling
                boxSizing: 'border-box',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                color: '#eee',
                fontFamily: "'Inter', sans-serif",
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 100
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
                        Game of Life
                    </h1>
                </div>

                {/* Stats */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '15px',
                    borderRadius: '10px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px',
                    fontSize: '0.9rem'
                }}>
                    <div>
                        <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '2px' }}>GENERATION</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{stats.generation.toString()}</div>
                    </div>
                    <div>
                        <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '2px' }}>POPULATION</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{stats.population.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '2px' }}>TREE LEVEL</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{stats.level}</div>
                    </div>
                    <div>
                        <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '2px' }}>FPS</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: stats.fps < 50 ? 'orange' : '#4ade80' }}>
                            {stats.fps}
                        </div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0' }} />

                {/* Settings */}
                <div>
                    <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Settings</h3>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.9rem' }}>Speed</span>
                            <span style={{ fontSize: '0.9rem', color: '#4ade80' }}>{(1000 / speed).toFixed(0)} tps</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="500"
                            step="10"
                            value={speed}
                            onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#4ade80', cursor: 'pointer' }}
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '12px',
                        borderRadius: '8px'
                    }}>
                        <input
                            type="checkbox"
                            checked={autoExpand}
                            onChange={onToggleAutoExpand}
                            style={{ accentColor: '#4ade80', width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>Auto Expand</div>
                            <div style={{ fontSize: '0.7rem', color: '#888' }}>Grow universe automatically</div>
                        </div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0' }} />

                {/* Library */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Pattern Library</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(PATTERNS).map(([name, rle]) => (
                            <button
                                key={name}
                                onClick={() => onLoadPattern(rle)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid transparent',
                                    padding: '12px 15px',
                                    textAlign: 'left',
                                    borderRadius: '8px',
                                    color: '#ccc',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                            >
                                {name}
                                <span style={{ opacity: 0.3 }}>›</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};
