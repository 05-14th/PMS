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
      {/* Responsive styles for mobile */}
      <style>{`
        @media (max-width: 700px) {
          body, #root, .fw-main-bg {
            width: 100vw !important;
            min-height: 100vh !important;
            overflow-x: hidden !important;
            background: #0a0a12 !important;
          }
          .fw-main-row {
            flex-direction: column !important;
            gap: 32px !important;
            padding-top: 8px !important;
          }
          .fw-section {
            width: 100% !important;
            align-items: stretch !important;
            margin-bottom: 24px !important;
            padding: 12px 0 18px 0 !important;
            background: rgba(20,30,40,0.7) !important;
            border-radius: 18px !important;
            box-shadow: 0 2px 16px #00fff733, 0 1px 8px #000a !important;
          }
          .fw-tank-row, .fw-bin-row {
            flex-direction: column !important;
            gap: 18px !important;
            align-items: center !important;
            width: 100% !important;
          }
          .fw-tank, .fw-bin {
            width: 95vw !important;
            max-width: 340px !important;
            height: 140px !important;
            min-width: 120px !important;
            margin-bottom: 8px !important;
            padding: 10px 0 0 0 !important;
            border-radius: 18px !important;
            box-shadow: 0 0 16px 2px #00fff733, 0 1px 8px #000a !important;
            position: relative !important;
          }
          .fw-tank svg {
            width: 100% !important;
            height: 100% !important;
            min-height: unset !important;
            max-height: unset !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }
          .fw-label {
            font-size: 18px !important;
            margin-top: 6px !important;
            font-weight: 800 !important;
            letter-spacing: 1px !important;
          }
          .fw-title {
            font-size: 22px !important;
            margin-bottom: 8px !important;
            letter-spacing: 2px !important;
            text-align: center !important;
            width: 100% !important;
            display: block !important;
          }
          .fw-btn {
            font-size: 16px !important;
            padding: 10px 0 !important;
            width: 90vw !important;
            max-width: 320px !important;
            margin: 0 auto 8px auto !important;
            border-radius: 12px !important;
            display: block !important;
          }
          .fw-bin > div[style*='height: 32px'] {
            height: 24px !important;
          }
          .fw-btn.fw-side-btn {
            width: auto !important;
            min-width: 80px !important;
            max-width: 120px !important;
            font-size: 16px !important;
            padding: 8px 0 !important;
            right: 6px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            margin: 0 !important;
            border-radius: 12px !important;
            display: block !important;
          }
          .fw-btn.fw-side-btn.fw-mobile-only {
            display: block !important;
          }
          .fw-btn.fw-below-btn.fw-desktop-only {
            display: none !important;
          }
        }
        @media (min-width: 701px) {
          .fw-btn.fw-side-btn.fw-mobile-only {
            display: none !important;
          }
          .fw-btn.fw-below-btn.fw-desktop-only {
            display: block !important;
          }
        }
      `}</style>
      <div
        className="fw-main-bg"
        style={{
          minHeight: '100vh',
          background: '#000',
          padding: 0,
          fontFamily: 'Orbitron, Roboto, Arial, sans-serif',
          width: '100vw',
          overflowX: 'hidden',
        }}
      >
        <div
          className="fw-main-row"
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
          <div className="fw-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <span className="fw-title" style={{ fontSize: 28, letterSpacing: 3, color: '#00fff7', fontWeight: 800, textShadow: '0 0 12px #00fff7' }}>WATER LEVEL</span>
            </div>
            <div className="fw-tank-row" style={{ display: 'flex', gap: 32 }}>
              {WATER_TANKS.map((tank, idx) => (
                <div key={tank.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="fw-tank" style={{ ...glassBox, width: 180, height: 320, border: `2px solid ${tank.border}`, boxShadow: `0 0 32px 4px ${tank.color}99, 0 2px 24px 0 #000a`, marginBottom: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Animated SVG Water */}
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 160 300"
                      preserveAspectRatio="none"
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
                    {/* Action Button on the right (mobile only) */}
                    <button
                      className="fw-btn fw-side-btn fw-mobile-only"
                      onClick={() => handleWater(idx, tank.label as keyof typeof WATER_LEVELS)}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(20,20,30,0.7)',
                        color: tank.color,
                        border: `2px solid ${tank.color}`,
                        borderRadius: 18,
                        padding: '8px 18px',
                        fontSize: 18,
                        fontWeight: 700,
                        cursor: 'pointer',
                        zIndex: 4,
                        textShadow: `0 0 8px ${tank.color}99`,
                        letterSpacing: 2,
                        boxShadow: `0 0 8px 1px ${tank.color}55`,
                      }}
                    >
                      {tank.label}
                    </button>
                    {/* Level Label */}
                    <div className="fw-label" style={{
                      position: 'relative',
                      marginTop: 8,
                      fontWeight: 700,
                      fontSize: 18,
                      color: '#fff',
                      textShadow: '0 0 8px #fff',
                      zIndex: 4,
                    }}>
                      {getLevelLabel(waterLevels[idx])}
                    </div>
                  </div>
                  {/* Neon-glow Refill Button for Water (now below the tank) */}
                  <button
                    className="fw-btn"
                    onClick={() => handleRefillWater(idx)}
                    disabled={isRefillingWater[idx]}
                    style={{
                      marginTop: 10,
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
                      width: 140,
                      alignSelf: 'center',
                    }}
                  >
                    Refill
                  </button>
                  {/* Action Button below refill (desktop only) */}
                  <button
                    className="fw-btn fw-below-btn fw-desktop-only"
                    onClick={() => handleWater(idx, tank.label as keyof typeof WATER_LEVELS)}
                    style={{
                      marginTop: 10,
                      background: 'rgba(20,20,30,0.7)',
                      color: tank.color,
                      border: `2px solid ${tank.color}`,
                      borderRadius: 18,
                      padding: '8px 18px',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                      zIndex: 4,
                      textShadow: `0 0 8px ${tank.color}99`,
                      letterSpacing: 2,
                      boxShadow: `0 0 8px 1px ${tank.color}55`,
                      width: 140,
                      alignSelf: 'center',
                    }}
                  >
                    {tank.label}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Food Section */}
          <div className="fw-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <span className="fw-title" style={{ fontSize: 28, letterSpacing: 3, color: '#ff3c00', fontWeight: 800, textShadow: '0 0 12px #ff3c00' }}>FOOD LEVEL</span>
            </div>
            <div className="fw-bin-row" style={{ display: 'flex', gap: 16 }}>
              {FOOD_BINS.map((bin, idx) => (
                <div key={bin.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="fw-bin" style={{ ...glassBox, width: 120, height: 320, border: '2px solid #ff3c00', boxShadow: '0 0 32px 4px #ff3c0999, 0 2px 24px 0 #000a', marginBottom: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
                    {/* Action Button on the right (mobile only) */}
                    <button
                      className="fw-btn fw-side-btn fw-mobile-only"
                      onClick={() => handleFood(idx, bin.label as keyof typeof FOOD_LEVELS)}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(20,20,30,0.7)',
                        color: bin.color,
                        border: `2px solid ${bin.color}`,
                        borderRadius: 18,
                        padding: '8px 18px',
                        fontSize: 18,
                        fontWeight: 700,
                        cursor: 'pointer',
                        zIndex: 4,
                        textShadow: `0 0 8px ${bin.color}99`,
                        letterSpacing: 2,
                        boxShadow: `0 0 8px 1px ${bin.color}55`,
                      }}
                    >
                      {bin.label}
                    </button>
                    {/* Level Label */}
                    <div className="fw-label" style={{
                      position: 'relative',
                      marginTop: 8,
                      fontWeight: 700,
                      fontSize: 18,
                      color: '#fff',
                      textShadow: '0 0 8px #fff',
                      zIndex: 4,
                    }}>
                      {getLevelLabel(foodLevels[idx])}
                    </div>
                  </div>
                  {/* Neon-glow Refill Button for Food (now below the bin) */}
                  <button
                    className="fw-btn"
                    onClick={() => handleRefillFood(idx)}
                    disabled={isRefillingFood[idx]}
                    style={{
                      marginTop: 10,
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
                      width: 100,
                      alignSelf: 'center',
                    }}
                  >
                    Refill
                  </button>
                  {/* Action Button below refill (desktop only) */}
                  <button
                    className="fw-btn fw-below-btn fw-desktop-only"
                    onClick={() => handleFood(idx, bin.label as keyof typeof FOOD_LEVELS)}
                    style={{
                      marginTop: 10,
                      background: 'rgba(20,20,30,0.7)',
                      color: bin.color,
                      border: `2px solid ${bin.color}`,
                      borderRadius: 18,
                      padding: '8px 18px',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                      zIndex: 4,
                      textShadow: `0 0 8px ${bin.color}99`,
                      letterSpacing: 2,
                      boxShadow: `0 0 8px 1px ${bin.color}55`,
                      width: 100,
                      alignSelf: 'center',
                    }}
                  >
                    {bin.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ControlBody>
  );
}

export default FeedingWatering;