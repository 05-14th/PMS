import React, { useState, useRef, CSSProperties } from 'react';
import ControlBody from '../components/ControlBody';

const WATER_LEVELS = {
  Medicine: 30,
  Ordinary: 20,
};
const FOOD_LEVELS = {
  C1: 30,
  C2: 20,
  C3: 10,
};

function FeedingWatering() {
  const [waterLevel, setWaterLevel] = useState(100);
  const [foodLevel, setFoodLevel] = useState(100);
  const [isRefillingWater, setIsRefillingWater] = useState(false);
  const [isRefillingFood, setIsRefillingFood] = useState(false);
  const [wavePhase, setWavePhase] = useState(0);
  const waveRef = useRef<number | null>(null);

  // Animate wave phase for a moving effect
  React.useEffect(() => {
    const animate = () => {
      setWavePhase((prev) => (prev + 0.04) % (2 * Math.PI));
      waveRef.current = requestAnimationFrame(animate);
    };
    waveRef.current = requestAnimationFrame(animate);
    return () => { if (waveRef.current) cancelAnimationFrame(waveRef.current); };
  }, []);

  // Neon-glow button style
  const neonButton = (color: string) => ({
    background: 'rgba(20,20,30,0.7)',
    color,
    border: `2px solid ${color}`,
    borderRadius: 30,
    padding: '12px 36px',
    fontSize: 22,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `0 0 16px 2px ${color}99, 0 0 4px 1px #000`,
    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
    textShadow: `0 0 8px ${color}99`,
    letterSpacing: 2,
  });

  // Futuristic glassy box style
  const glassBox: CSSProperties = {
    border: '2px solid #00fff7',
    borderRadius: 24,
    background: 'rgba(30,40,60,0.7)',
    boxShadow: '0 0 32px 4px #00fff799, 0 2px 24px 0 #000a',
    position: 'relative',
    overflow: 'hidden',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  };

  // Water refill animation
  const handleRefillWater = () => {
    if (isRefillingWater) return;
    setIsRefillingWater(true);
    let current = waterLevel;
    const step = () => {
      if (current < 100) {
        current = Math.min(current + 2, 100);
        setWaterLevel(current);
        requestAnimationFrame(step);
      } else {
        setIsRefillingWater(false);
      }
    };
    requestAnimationFrame(step);
  };

  // Food refill animation
  const handleRefillFood = () => {
    if (isRefillingFood) return;
    setIsRefillingFood(true);
    let current = foodLevel;
    const step = () => {
      if (current < 100) {
        current = Math.min(current + 4, 100);
        setFoodLevel(current);
        requestAnimationFrame(step);
      } else {
        setIsRefillingFood(false);
      }
    };
    requestAnimationFrame(step);
  };

  // Dynamic SVG wave path
  const getWavePath = (phase: number) => {
    const amplitude = 18;
    const frequency = 2;
    let path = 'M0,80 ';
    for (let x = 0; x <= 320; x += 32) {
      const y = 80 + Math.sin((x / 320) * frequency * Math.PI + phase) * amplitude;
      path += `L${x},${y} `;
    }
    path += 'V400 H0 Z';
    return path;
  };

  const handleWater = (type: keyof typeof WATER_LEVELS) => {
    setWaterLevel((prev) => Math.max(prev - WATER_LEVELS[type], 0));
  };

  const handleFood = (type: keyof typeof FOOD_LEVELS) => {
    setFoodLevel((prev) => Math.max(prev - FOOD_LEVELS[type], 0));
  };

  return (
    <ControlBody>
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          padding: 0,
          fontFamily: 'Orbitron, Roboto, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8vw',
            marginTop: 0,
            background: 'none',
            paddingTop: 60,
          }}
        >
          {/* Water Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <span style={{ fontSize: 28, letterSpacing: 3, color: '#00fff7', fontWeight: 800, textShadow: '0 0 12px #00fff7' }}>WATER LEVEL</span>
            </div>
            <div style={{ ...glassBox, width: 340, height: 420, marginBottom: 32 }}>
              {/* Animated SVG Water */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 320 400"
                style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}
              >
                <g
                  style={{
                    transition: 'transform 0.9s cubic-bezier(.4,2,.6,1)',
                    transform: `translateY(${400 - (waterLevel / 100) * 400}px)`,
                    filter: 'drop-shadow(0 0 24px #00fff7cc)',
                  }}
                >
                  <path
                    d={getWavePath(wavePhase)}
                    fill="#00fff7"
                    fillOpacity={0.5}
                  />
                  <path
                    d={getWavePath(wavePhase + Math.PI / 2)}
                    fill="#00fff7"
                    fillOpacity={0.7}
                  />
                </g>
              </svg>
              {/* Neon-glow Refill Button for Water */}
              <button
                onClick={handleRefillWater}
                disabled={isRefillingWater}
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: 24,
                  transform: 'translateX(-50%)',
                  background: '#555',
                  color: '#fff',
                  border: '2px solid #fff',
                  borderRadius: 8,
                  padding: '6px 28px',
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: isRefillingWater ? 'not-allowed' : 'pointer',
                  zIndex: 3,
                  textShadow: '0 0 8px #00fff7',
                  letterSpacing: 2,
                  opacity: isRefillingWater ? 0.5 : 1,
               
                  boxShadow: 'none',
                }}
              >
                Refill
              </button>
            </div>
            <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
              <button
                onClick={() => handleWater('Medicine')}
                style={neonButton('#00fff7')}
              >
                Medicine
              </button>
              <button
                onClick={() => handleWater('Ordinary')}
                style={neonButton('#00bfff')}
              >
                Ordinary
              </button>
            </div>
          </div>

          {/* Food Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <span style={{ fontSize: 28, letterSpacing: 3, color: '#ff3c00', fontWeight: 800, textShadow: '0 0 12px #ff3c00' }}>FOOD LEVEL</span>
            </div>
            <div style={{ ...glassBox, width: 480, height: 420, marginBottom: 32, border: '2px solid #ff3c00', boxShadow: '0 0 32px 4px #ff3c0999, 0 2px 24px 0 #000a' }}>
              {/* Animated Food Rectangle (glowing bar) */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '100%',
                  height: `${foodLevel}%`,
                  background: 'linear-gradient(180deg, #ffb380 0%, #ff3c00 100%)',
                  borderRadius: '0 0 18px 18px',
                  transition: 'height 0.7s cubic-bezier(.4,2,.6,1)',
                  zIndex: 1,
                  boxShadow: '0 0 32px 8px #ff3c00cc',
                  filter: 'blur(0.5px)',
                }}
              />
              {/* Top bar */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: 50,
                  background: 'rgba(255,255,255,0.08)',
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  zIndex: 2,
                  boxShadow: '0 0 16px #ff3c00',
                }}
              />
              {/* Neon-glow Refill Button for Food */}
              <button
                onClick={handleRefillFood}
                disabled={isRefillingFood}
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: 24,
                  transform: 'translateX(-50%)',
                  background: '#555',
                  color: '#fff',
                  border: '2px solid #fff',
                  borderRadius: 8,
                  padding: '6px 28px',
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: isRefillingFood ? 'not-allowed' : 'pointer',
                  zIndex: 3,
                  textShadow: '0 0 8px #00fff7',
                  letterSpacing: 2,
                  opacity: isRefillingFood ? 0.5 : 1,
               
                  boxShadow: 'none',
                }}
              >
                Refill
              </button>
            </div>
            <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
              {Object.keys(FOOD_LEVELS).map((key) => (
                <button
                  key={key}
                  onClick={() => handleFood(key as keyof typeof FOOD_LEVELS)}
                  style={neonButton('#ff3c00')}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ControlBody>
  );
}

export default FeedingWatering;