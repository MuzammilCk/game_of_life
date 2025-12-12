import React from 'react';

interface FloatingControlsProps {
    playing: boolean;
    onTogglePlay: () => void;
    onStep: () => void;
    onReset: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
    playing,
    onTogglePlay,
    onStep,
    onReset
}) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '12px',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(12px)',
            padding: '12px 20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            zIndex: 100
        }}>
            <button
                onClick={onTogglePlay}
                style={{
                    background: playing ? '#ef4444' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minWidth: '80px'
                }}
            >
                {playing ? 'PAUSE' : 'PLAY'}
            </button>

            <button
                onClick={onStep}
                disabled={playing}
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: playing ? '#555' : 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: playing ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                }}
            >
                STEP
            </button>

            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }} />

            <button
                onClick={onReset}
                style={{
                    background: 'transparent',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                }}
            >
                RESET
            </button>
        </div>
    );
};
