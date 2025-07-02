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

// Replace single water/food state with arrays for multiple tanks/bins
const WATER_TANKS = [
  { label: 'Medicine', color: '#00fff7', border: '#00fff7' },
  { label: 'Ordinary', color: '#00bfff', border: '#00bfff' },
];
const FOOD_BINS = [
  { label: 'C1', color: '#ff3c00' },
  { label: 'C2', color: '#ff3c00' },
  { label: 'C3', color: '#ff3c00' },
];

function FeedingWatering() {
  const [waterLevels, setWaterLevels] = useState([100, 100]);
  const [foodLevels, setFoodLevels] = useState([100, 100, 100]);
  const [isRefillingWater, setIsRefillingWater] = useState([false, false]);
  const [isRefillingFood, setIsRefillingFood] = useState([false, false, false]);
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

  // Water refill animation for each tank
  const handleRefillWater = (idx: number) => {
    if (isRefillingWater[idx]) return;
    setIsRefillingWater((prev) => prev.map((v, i) => (i === idx ? true : v)));
    let current = waterLevels[idx];
    const step = () => {
      if (current < 100) {
        current = Math.min(current + 2, 100);
        setWaterLevels((prev) => prev.map((v, i) => (i === idx ? current : v)));
        requestAnimationFrame(step);
      } else {
        setIsRefillingWater((prev) => prev.map((v, i) => (i === idx ? false : v)));
      }
    };
    requestAnimationFrame(step);
  };

  // Food refill animation for each bin
  const handleRefillFood = (idx: number) => {
    if (isRefillingFood[idx]) return;
    setIsRefillingFood((prev) => prev.map((v, i) => (i === idx ? true : v)));
    let current = foodLevels[idx];
    const step = () => {
      if (current < 100) {
        current = Math.min(current + 4, 100);
        setFoodLevels((prev) => prev.map((v, i) => (i === idx ? current : v)));
        requestAnimationFrame(step);
      } else {
        setIsRefillingFood((prev) => prev.map((v, i) => (i === idx ? false : v)));
      }
    };
    requestAnimationFrame(step);
  };

  // Water consumption for each tank
  const handleWater = (idx: number, type: keyof typeof WATER_LEVELS) => {
    setWaterLevels((prev) => prev.map((v, i) => (i === idx ? Math.max(v - WATER_LEVELS[type], 0) : v)));
  };

  // Food consumption for each bin
  const handleFood = (idx: number, type: keyof typeof FOOD_LEVELS) => {
    setFoodLevels((prev) => prev.map((v, i) => (i === idx ? Math.max(v - FOOD_LEVELS[type], 0) : v)));
  };

  // Helper to get level label
  const getLevelLabel = (value: number) => {
    if (value > 70) return 'High';
    if (value > 35) return 'Medium';
    if (value > 0) return 'Low';
    return 'Empty';
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
            <div style={{ display: 'flex', gap: 32 }}>
              {WATER_TANKS.map((tank, idx) => (
                <div key={tank.label} style={{ ...glassBox, width: 180, height: 320, border: `2px solid ${tank.border}`, boxShadow: `0 0 32px 4px ${tank.color}99, 0 2px 24px 0 #000a`, marginBottom: 32, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Animated SVG Water */}
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 160 300"
                    style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}
                  >
                    <g
                      style={{
                        transition: 'transform 0.9s cubic-bezier(.4,2,.6,1)',
                        transform: `translateY(${300 - (waterLevels[idx] / 100) * 300}px)`,
                        filter: `drop-shadow(0 0 24px ${tank.color}cc)`,
                      }}
                    >
                      <path
                        d={(() => {
                          // scale getWavePath to 160x300
                          const amplitude = 12;
                          const frequency = 2;
                          let path = 'M0,60 ';
                          for (let x = 0; x <= 160; x += 16) {
                            const y = 60 + Math.sin((x / 160) * frequency * Math.PI + wavePhase) * amplitude;
                            path += `L${x},${y} `;
                          }
                          path += 'V300 H0 Z';
                          return path;
                        })()}
                        fill={tank.color}
                        fillOpacity={0.5}
                      />
                      <path
                        d={(() => {
                          const amplitude = 12;
                          const frequency = 2;
                          let path = 'M0,60 ';
                          for (let x = 0; x <= 160; x += 16) {
                            const y = 60 + Math.sin((x / 160) * frequency * Math.PI + wavePhase + Math.PI / 2) * amplitude;
                            path += `L${x},${y} `;
                          }
                          path += 'V300 H0 Z';
                          return path;
                        })()}
                        fill={tank.color}
                        fillOpacity={0.7}
                      />
                    </g>
                  </svg>
                  {/* Neon-glow Refill Button for Water */}
                  <button
                    onClick={() => handleRefillWater(idx)}
                    disabled={isRefillingWater[idx]}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: 18,
                      transform: 'translateX(-50%)',
                      background: '#555',
                      color: '#fff',
                      border: '2px solid #fff',
                      borderRadius: 8,
                      padding: '6px 18px',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: isRefillingWater[idx] ? 'not-allowed' : 'pointer',
                      zIndex: 3,
                      textShadow: `0 0 8px ${tank.color}`,
                      letterSpacing: 2,
                      opacity: isRefillingWater[idx] ? 0.5 : 1,
                      boxShadow: 'none',
                    }}
                  >
                    Refill
                  </button>
                  {/* Level Label */}
                  <div style={{
                    position: 'relative',
                    marginTop: 8,
                    fontWeight: 700,
                    fontSize: 18,
                    color: tank.color,
                    textShadow: `0 0 8px ${tank.color}99`,
                    zIndex: 4,
                  }}>
                    {getLevelLabel(waterLevels[idx])}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
              {WATER_TANKS.map((tank, idx) => (
                <button
                  key={tank.label}
                  onClick={() => handleWater(idx, tank.label as keyof typeof WATER_LEVELS)}
                  style={neonButton(tank.color)}
                >
                  {tank.label}
                </button>
              ))}
            </div>
          </div>

          {/* Food Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <span style={{ fontSize: 28, letterSpacing: 3, color: '#ff3c00', fontWeight: 800, textShadow: '0 0 12px #ff3c00' }}>FOOD LEVEL</span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {FOOD_BINS.map((bin, idx) => (
                <div key={bin.label} style={{ ...glassBox, width: 120, height: 320, border: '2px solid #ff3c00', boxShadow: '0 0 32px 4px #ff3c0999, 0 2px 24px 0 #000a', marginBottom: 32, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Animated Food Rectangle (glowing bar) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      width: '100%',
                      height: `${foodLevels[idx]}%`,
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
                      height: 32,
                      background: 'rgba(255,255,255,0.08)',
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      zIndex: 2,
                      boxShadow: '0 0 16px #ff3c00',
                    }}
                  />
                  {/* Neon-glow Refill Button for Food */}
                  <button
                    onClick={() => handleRefillFood(idx)}
                    disabled={isRefillingFood[idx]}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: 18,
                      transform: 'translateX(-50%)',
                      background: '#555',
                      color: '#fff',
                      border: '2px solid #fff',
                      borderRadius: 8,
                      padding: '6px 18px',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: isRefillingFood[idx] ? 'not-allowed' : 'pointer',
                      zIndex: 3,
                      textShadow: '0 0 8px #ff3c00',
                      letterSpacing: 2,
                      opacity: isRefillingFood[idx] ? 0.5 : 1,
                      boxShadow: 'none',
                    }}
                  >
                    Refill
                  </button>
                  {/* Level Label */}
                  <div style={{
                    position: 'relative',
                    marginTop: 8,
                    fontWeight: 700,
                    fontSize: 18,
                    color: bin.color,
                    textShadow: `0 0 8px ${bin.color}99`,
                    zIndex: 4,
                  }}>
                    {getLevelLabel(foodLevels[idx])}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
              {FOOD_BINS.map((bin, idx) => (
                <button
                  key={bin.label}
                  onClick={() => handleFood(idx, bin.label as keyof typeof FOOD_LEVELS)}
                  style={neonButton(bin.color)}
                >
                  {bin.label}
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