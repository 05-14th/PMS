import React, { useState, useRef, useEffect, CSSProperties } from 'react';
// Responsive hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}
import { FaPills, FaTint } from 'react-icons/fa';
import { GiGrain } from 'react-icons/gi';
import ControlBody from '../components/ControlBody';

// Optional: Digital font for futuristic look
const digitalFont = `'Orbitron', 'Segoe UI', 'Arial', sans-serif`;

const MAX_LEVEL = 100;
const MEDICINE_RELEASES = [10, 20, 30];
const WATER_RELEASES = [10, 20, 30];
const FOOD_RELEASE = 20;

const containerHeight = 480;
const containerWidth = 140;

const FeedingWatering = () => {
  const [medicineLevel, setMedicineLevel] = useState(MAX_LEVEL);
  const [waterLevel, setWaterLevel] = useState(MAX_LEVEL);
  const [foodLevels, setFoodLevels] = useState([MAX_LEVEL, MAX_LEVEL, MAX_LEVEL]);
  const [wavePhase, setWavePhase] = useState(0);
  const waveRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      setWavePhase(prev => (prev + 0.05) % (2 * Math.PI));
      waveRef.current = requestAnimationFrame(animate);
    };
    waveRef.current = requestAnimationFrame(animate);
    return () => {
      if (waveRef.current) cancelAnimationFrame(waveRef.current);
    };
  }, []);

  const getLevelLabel = (value: number) => {
    if (value > 70) return 'High';
    if (value > 35) return 'Medium';
    if (value > 0) return 'Low';
    return 'Empty';
  };

  const handleMedicineRelease = (amount: number) => {
    setMedicineLevel(prev => Math.max(prev - amount, 0));
  };

  const handleWaterRelease = (amount: number) => {
    setWaterLevel(prev => Math.max(prev - amount, 0));
  };

  const handleFoodRelease = (index: number) => {
    setFoodLevels(prev =>
      prev.map((val, i) => (i === index ? Math.max(val - FOOD_RELEASE, 0) : val))
    );
  };

  // Multi-layered wave for realism
  // Realistic SVG wave generator
  const WaveSVG = ({
    level,
    color,
    phase,
    highlightColor = '#fff',
    width = containerWidth,
    height = containerHeight,
    borderRadius = 24
  }: {
    level: number;
    color: string;
    phase: number;
    highlightColor?: string;
    width?: number;
    height?: number;
    borderRadius?: number;
  }) => {
    // If level is 0, render nothing (no wave)
    if (level === 0) return null;
    // Wave parameters
    const waveHeight = 18;
    const waveLength = width * 1.2;
    const yOffset = height - (level / 100) * height;
    // Generate main wave path
    let path = '';
    for (let x = 0; x <= width; x += 2) {
      const y =
        Math.sin((x / waveLength) * 2 * Math.PI + phase) * waveHeight +
        Math.sin((x / waveLength) * 4 * Math.PI + phase * 1.5) * (waveHeight * 0.3) +
        yOffset;
      path += x === 0 ? `M${x},${y}` : ` L${x},${y}`;
    }
    path += ` L${width},${height} L0,${height} Z`;
    // Second wave for realism
    let path2 = '';
    for (let x = 0; x <= width; x += 2) {
      const y =
        Math.sin((x / waveLength) * 2 * Math.PI + phase + 1.5) * (waveHeight * 0.6) +
        Math.cos((x / waveLength) * 3 * Math.PI + phase * 1.3) * (waveHeight * 0.2) +
        yOffset + 7;
      path2 += x === 0 ? `M${x},${y}` : ` L${x},${y}`;
    }
    path2 += ` L${width},${height} L0,${height} Z`;
    return (
      <svg
        width={width}
        height={height}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          borderRadius: borderRadius,
          overflow: 'hidden',
          zIndex: 2
        }}
      >
        {/* Main wave */}
        <defs>
          <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="90%" stopColor={color} stopOpacity="0.75" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="waveHighlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={highlightColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={highlightColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={path} fill="url(#waveGradient)" />
        <path d={path2} fill="url(#waveHighlight)" opacity={0.5} />
      </svg>
    );
  };



  const commonButtonStyle: CSSProperties = {
    height: 60,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    border: 'none',
    borderRadius: 12,
    fontWeight: 'bold',
    cursor: 'pointer',
  };

  // Manual/Auto mode toggle
  const [manualMode, setManualMode] = useState(true);

  // Responsive
  const isMobile = useMediaQuery('(max-width: 700px)');

  if (isMobile) {
    // Mobile: render a completely separate JSX tree for mobile layout
    return (
      <ControlBody>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '32px 4vw 64px 4vw', // Increased bottom padding for scroll space
          minHeight: '100vh',
          background: '#fff',
          color: '#000',
          fontFamily: digitalFont,
          gap: 32,
        }}>
          {/* ...existing tank and bin controls... */}
          {/* Toggle Switch - Bottom Center */}
          <div style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9faee',
            borderRadius: 24,
            padding: '6px 18px',
            border: '1.5px solid #c2c2c2',
            width: '90vw',
            maxWidth: 400,
          }}>
            <span style={{ color: '#000', fontWeight: 'bold', marginRight: 14, fontFamily: digitalFont }}>Manual</span>
            <button
              onClick={() => setManualMode(m => !m)}
              style={{
                width: 64,
                height: 32,
                borderRadius: 20,
                border: manualMode ? '2px solid #888' : '2px solid #ff8c00',
                background: manualMode ? '#e6e6e6' : '#fff',
                boxShadow: 'none',
                cursor: 'pointer',
                position: 'relative',
                outline: 'none',
                transition: 'all 0.18s',
                margin: '0 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: manualMode ? 'flex-start' : 'flex-end',
                padding: 0
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: 'none',
                  border: manualMode ? '1px solid #bbb' : '1.5px solid #ff8c00',
                  transition: 'all 0.18s',
                  marginLeft: manualMode ? 2 : 32,
                  marginRight: manualMode ? 32 : 2,
                }}
              />
            </button>
            <span style={{ color: '#000', fontWeight: 'bold', marginLeft: 14, fontFamily: digitalFont }}>Auto</span>
          </div>
          {/* Water Tank (mobile) with buttons below */}
          <div style={{
            background: 'rgba(30,40,60,0.7)',
            boxShadow: '0 8px 32px #00fff733',
            border: '1.5px solid #00fff744',
            padding: 16,
            borderRadius: 20,
            width: '100%',
            maxWidth: 340,
            margin: '0 auto',
            marginBottom: 18,
            backdropFilter: 'blur(8px) saturate(140%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <h3 style={{ textAlign: 'center', color: '#fff', marginBottom: 14, textShadow: '0 0 12px #222', fontFamily: digitalFont, letterSpacing: 1.2, fontSize: 20 }}>Water Tank</h3>
            <div style={{
              width: 180,
              height: 120,
              background: 'rgba(20,30,40,0.75)',
              borderRadius: 24,
              boxShadow: '0 0 40px #00fff799, 0 8px 32px #00fff755',
              border: '1.5px solid #00fff799',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(8px) saturate(140%)',
              margin: '0 auto',
            }}>
              <WaveSVG
                level={waterLevel}
                color="#007aff" // permanent blue color
                phase={wavePhase}
                highlightColor="#fff"
                width={180}
                height={120}
                borderRadius={24}
              />
              <div style={{
                position: 'absolute',
                top: 16,
                width: '100%',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 16,
                color: '#fff',
                textShadow: '0 0 8px #00fff7cc',
                fontFamily: digitalFont,
                letterSpacing: 1.2,
                zIndex: 10,
              }}>
                {getLevelLabel(waterLevel)}
              </div>
            </div>
            {/* Water Control Buttons (mobile) */}
            <div style={{ width: '100%', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
              {WATER_RELEASES.map((amt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleWaterRelease(amt)}
                  style={{
                    ...commonButtonStyle,
                    background: 'linear-gradient(120deg, #4d8de2 0%, #007aff 60%, #e0f0ff 100%)',
                    color: '#fff',
                    border: '2px solid #4d8de2',
                    borderRadius: 18,
                    boxShadow: '0 4px 24px #4d8de255, 0 1.5px 8px #007aff55',
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    fontFamily: digitalFont,
                    fontSize: 16,
                    backdropFilter: 'blur(4px) saturate(120%)',
                    transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                    cursor: 'pointer',
                    width: '100%',
                    height: 44,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.boxShadow = '0 0 32px #4d8de2cc, 0 4px 24px #4d8de255'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px #4d8de255, 0 1.5px 8px #007aff55'; e.currentTarget.style.transform = 'scale(1)'; }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <FaTint size={18} /> Level {idx + 1}
                </button>
              ))}
            </div>
          </div>
          {/* Medicine Tank (mobile) with buttons below */}
          <div style={{
            background: 'rgba(30,40,60,0.7)',
            boxShadow: '0 8px 32px #00fff733',
            border: '1.5px solid #00fff744',
            padding: 16,
            borderRadius: 20,
            width: '100%',
            maxWidth: 340,
            margin: '0 auto',
            marginBottom: 18,
            backdropFilter: 'blur(8px) saturate(140%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <h3 style={{ textAlign: 'center', color: '#fff', marginBottom: 14, textShadow: '0 0 12px #222', fontFamily: digitalFont, letterSpacing: 1.2, fontSize: 20 }}>Medicine Tank</h3>
            <div style={{
              width: 180,
              height: 120,
              background: 'rgba(20,30,40,0.75)',
              borderRadius: 24,
              boxShadow: '0 0 40px #00fff799, 0 8px 32px #00fff755',
              border: '1.5px solid #00fff799',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(8px) saturate(140%)',
              margin: '0 auto',
            }}>
              <WaveSVG
                level={medicineLevel}
                color="#007aff" // permanent blue color
                phase={wavePhase + 1}
                highlightColor="#fff"
                width={180}
                height={120}
                borderRadius={24}
              />
              <div style={{
                position: 'absolute',
                top: 16,
                width: '100%',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 16,
                color: '#fff',
                textShadow: '0 0 8px #00fff7cc',
                fontFamily: digitalFont,
                letterSpacing: 1.2,
                zIndex: 10,
              }}>
                {getLevelLabel(medicineLevel)}
              </div>
            </div>
            {/* Medicine Control Buttons (mobile) */}
            <div style={{ width: '100%', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
              {MEDICINE_RELEASES.map((amt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMedicineRelease(amt)}
                  style={{
                    ...commonButtonStyle,
                    background: 'linear-gradient(120deg, #43e9c6 0%, #38cfd9 60%, #e0fcff 100%)',
                    color: '#222',
                    border: '2px solid #4de2c3',
                    borderRadius: 18,
                    boxShadow: '0 4px 24px #4de2c355, 0 1.5px 8px #00fff755',
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    fontFamily: digitalFont,
                    fontSize: 16,
                    backdropFilter: 'blur(4px) saturate(120%)',
                    transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                    cursor: 'pointer',
                    width: '100%',
                    height: 44,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.boxShadow = '0 0 32px #4de2c3cc, 0 4px 24px #4de2c355'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px #4de2c355, 0 1.5px 8px #00fff755'; e.currentTarget.style.transform = 'scale(1)'; }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <FaPills size={18} /> Level {idx + 1}
                </button>
              ))}
            </div>
          </div>
          {/* Tanks/Bins (mobile) */}
        {/* Removed duplicated tanks/bins block in mobile view */}
          {/* Food Bins and Controls (mobile) - each bin above its button */}
          <div style={{
            background: 'rgba(30,40,60,0.7)',
            boxShadow: '0 8px 32px #ff3c0033',
            border: '1.5px solid #ff3c00bb',
            padding: 16,
            borderRadius: 20,
            width: '100%',
            maxWidth: 340,
            margin: '0 auto',
            marginBottom: 18,
            backdropFilter: 'blur(8px) saturate(140%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
          }}>
            <h3 style={{ marginBottom: 12, letterSpacing: 1.2, color: '#fff', textShadow: '0 0 8px #ff3c00bb', fontSize: 20 }}>Food Control <GiGrain size={24} /></h3>
            {foodLevels.map((level, idx) => (
              <div key={idx} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
                {/* Food bin container - stretched for mobile */}
                <div style={{
                  width: 160,
                  height: 120,
                  background: 'rgba(30,10,0,0.8)',
                  borderRadius: 24,
                  boxShadow: '0 0 32px #ff3c00aa',
                  border: '1.5px solid #ff3c00bb',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  backdropFilter: 'blur(6px) saturate(120%)',
                  margin: '0 auto',
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    height: `${level}%`,
                    background: 'linear-gradient(135deg, #ff8c00 60%, #fff0 100%)',
                    width: '100%',
                    transition: 'height 0.6s cubic-bezier(.42,2,.58,1)',
                    boxShadow: '0 0 12px #ff8c00cc',
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    width: '100%',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: 12,
                    color: '#fff',
                    textShadow: '0 0 8px #ff3c00cc',
                    fontFamily: digitalFont,
                    letterSpacing: 1.1,
                    zIndex: 10,
                  }}>
                    {getLevelLabel(level)}
                  </div>
                </div>
                <span style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: 14,
                  marginTop: 6,
                  fontFamily: digitalFont,
                  letterSpacing: 1.1,
                  textShadow: '0 0 8px #222',
                  textAlign: 'center',
                }}>{['Starter', 'Grower', 'Finisher'][idx]}</span>
                {/* Feeder button below each bin */}
                <button
                  onClick={() => handleFoodRelease(idx)}
                  style={{
                    ...commonButtonStyle,
                    height: 44,
                    fontSize: 16,
                    background: 'linear-gradient(120deg, #ff8c00 0%, #ff3c00 60%, #fff5e0 100%)',
                    color: '#fff',
                    marginTop: 8,
                    marginBottom: 4,
                    border: '2px solid #ff8c00',
                    borderRadius: 18,
                    boxShadow: '0 4px 24px #ff8c0055, 0 1.5px 8px #ff3c0055',
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    fontFamily: digitalFont,
                    backdropFilter: 'blur(4px) saturate(120%)',
                    transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.boxShadow = '0 0 32px #ff8c00cc, 0 4px 24px #ff8c0055'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px #ff8c0055, 0 1.5px 8px #ff3c0055'; e.currentTarget.style.transform = 'scale(1)'; }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <GiGrain size={18} /> {['Starter', 'Grower', 'Finisher'][idx]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </ControlBody>
    );
  }
  // Desktop: restore original layout (left controls, center tanks/bins, right controls)
  return (
    <ControlBody>
      {/* Toggle Switch - Top Right */}
      <div style={{
        position: 'absolute',
        top: 96,
        right: 38,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        background: '#f8f9fa',
        borderRadius: 24,
        padding: '6px 18px',
        border: '1.5px solid #c2c2c2',
      }}>
        <span style={{ color: '#000', fontWeight: 'bold', marginRight: 14, fontFamily: digitalFont }}>Manual</span>
        <button
          onClick={() => setManualMode(m => !m)}
          style={{
            width: 64,
            height: 32,
            borderRadius: 20,
            border: manualMode ? '2px solid #888' : '2px solid #ff8c00',
            background: manualMode ? '#e6e6e6' : '#fff',
            boxShadow: 'none',
            cursor: 'pointer',
            position: 'relative',
            outline: 'none',
            transition: 'all 0.18s',
            margin: '0 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: manualMode ? 'flex-start' : 'flex-end',
            padding: 0
          }}
        >
          <span
            style={{
              display: 'block',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: 'none',
              border: manualMode ? '1px solid #bbb' : '1.5px solid #ff8c00',
              transition: 'all 0.18s',
              marginLeft: manualMode ? 2 : 32,
              marginRight: manualMode ? 32 : 2,
            }}
          />
        </button>
        <span style={{ color: '#000', fontWeight: 'bold', marginLeft: 14, fontFamily: digitalFont }}>Auto</span>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: 32,
        minHeight: '100vh',
        background: '#fff',
        color: '#000',
        fontFamily: digitalFont,
      }}>
        {/* Left Control Panel (Medicine/Water) */}
        <div style={{
          background: 'rgba(30,40,60,0.7)',
          boxShadow: '0 8px 32px #00fff733',
          border: '1.5px solid #00fff744',
          padding: 28,
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          minWidth: 260,
          backdropFilter: 'blur(8px) saturate(140%)',
        }}>
          <div>
            <h3 style={{ marginBottom: 18, letterSpacing: 1.5, color: '#fff', textShadow: '0 0 8px #4de2c388' }}>Medicine Control <FaPills size={32} /></h3>
            {MEDICINE_RELEASES.map((amt, idx) => (
              <button
                key={idx}
                onClick={() => handleMedicineRelease(amt)}
                style={{
                  ...commonButtonStyle,
                  background: 'linear-gradient(120deg, #43e9c6 0%, #38cfd9 60%, #e0fcff 100%)',
                  color: '#222',
                  marginBottom: 18,
                  border: '2px solid #4de2c3',
                  borderRadius: 18,
                  boxShadow: '0 4px 24px #4de2c355, 0 1.5px 8px #00fff755',
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  fontFamily: digitalFont,
                  fontSize: 20,
                  backdropFilter: 'blur(4px) saturate(120%)',
                  transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.boxShadow = '0 0 32px #4de2c3cc, 0 4px 24px #4de2c355'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px #4de2c355, 0 1.5px 8px #00fff755'; e.currentTarget.style.transform = 'scale(1)'; }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <FaPills size={28} /> Level {idx + 1}
              </button>
            ))}
          </div>
          <div>
            <h3 style={{ marginBottom: 18, letterSpacing: 1.5, color: '#fff', textShadow: '0 0 8px #222', fontFamily: digitalFont, letterSpacing: 1.2 }}>Water Control <FaTint size={32} /></h3>
            {WATER_RELEASES.map((amt, idx) => (
              <button
                key={idx}
                onClick={() => handleWaterRelease(amt)}
                style={{
                  ...commonButtonStyle,
                  background: 'linear-gradient(120deg, #4d8de2 0%, #007aff 60%, #e0f0ff 100%)',
                  color: '#fff',
                  marginBottom: 18,
                  border: '2px solid #4d8de2',
                  borderRadius: 18,
                  boxShadow: '0 4px 24px #4d8de255, 0 1.5px 8px #007aff55',
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  fontFamily: digitalFont,
                  fontSize: 20,
                  backdropFilter: 'blur(4px) saturate(120%)',
                  transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.boxShadow = '0 0 32px #4d8de2cc, 0 4px 24px #4d8de255'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px #4d8de255, 0 1.5px 8px #007aff55'; e.currentTarget.style.transform = 'scale(1)'; }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <FaTint size={28} /> Level {idx + 1}
              </button>
            ))}
          </div>
        </div>
        {/* Center Display (Tanks/Bins) */}
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: 56, alignItems: 'center' }}>
          {/* Water Container */}
          <div style={{
            background: 'rgba(30,40,60,0.7)',
            boxShadow: '0 8px 32px #00fff733',
            border: '1.5px solid #00fff744',
            padding: 28,
            borderRadius: 20,
            backdropFilter: 'blur(8px) saturate(140%)',
            marginRight: 24,
          }}>
            <h3 style={{ textAlign: 'center', color: '#fff', marginBottom: 14, textShadow: '0 0 12px #222', fontFamily: digitalFont, letterSpacing: 1.2 }}>Water Tank</h3>
            <div style={{
              width: containerWidth,
              height: containerHeight,
              background: 'rgba(20,30,40,0.75)',
              borderRadius: 24,
              boxShadow: '0 0 40px #00fff799, 0 8px 32px #00fff755',
              border: '1.5px solid #00fff799',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(8px) saturate(140%)',
            }}>
              <WaveSVG
                level={waterLevel}
                color="#007aff" // permanent blue color
                phase={wavePhase}
                highlightColor="#fff"
                width={containerWidth}
                height={containerHeight}
                borderRadius={24}
              />
              <div style={{
                position: 'absolute',
                top: 16,
                width: '100%',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 24,
                color: '#fff',
                textShadow: '0 0 8px #00fff7cc',
                fontFamily: digitalFont,
                letterSpacing: 1.2,
                zIndex: 10,
              }}>
                {getLevelLabel(waterLevel)}
              </div>
            </div>
          </div>
          {/* Medicine Container */}
          <div style={{
            background: 'rgba(30,40,60,0.7)',
            boxShadow: '0 8px 32px #00fff733',
            border: '1.5px solid #00fff744',
            padding: 28,
            borderRadius: 20,
            backdropFilter: 'blur(8px) saturate(140%)',
            marginRight: 24,
          }}>
            <h3 style={{ textAlign: 'center', color: '#fff', marginBottom: 14, textShadow: '0 0 12px #222', fontFamily: digitalFont, letterSpacing: 1.2 }}>Medicine Tank</h3>
            <div style={{
              width: containerWidth,
              height: containerHeight,
              background: 'rgba(20,30,40,0.75)',
              borderRadius: 24,
              boxShadow: '0 0 40px #00fff799, 0 8px 32px #00fff755',
              border: '1.5px solid #00fff799',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(8px) saturate(140%)',
            }}>
              <WaveSVG
                level={medicineLevel}
                color="#007aff" // permanent blue color
                phase={wavePhase + 1}
                highlightColor="#fff"
                width={containerWidth}
                height={containerHeight}
                borderRadius={24}
              />
              <div style={{
                position: 'absolute',
                top: 16,
                width: '100%',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 24,
                color: '#fff',
                textShadow: '0 0 8px #00fff7cc',
                fontFamily: digitalFont,
                letterSpacing: 1.2,
                zIndex: 10,
              }}>
                {getLevelLabel(medicineLevel)}
              </div>
            </div>
          </div>
          {/* Food Containers */}
          <div style={{
            background: 'rgba(30,40,60,0.7)',
            boxShadow: '0 8px 32px #00fff733',
            border: '1.5px solid #00fff744',
            padding: 28,
            borderRadius: 20,
            backdropFilter: 'blur(8px) saturate(140%)',
          }}>
            <h3 style={{ textAlign: 'center', color: '#fff', marginBottom: 14, textShadow: '0 0 12px #222', fontFamily: digitalFont, letterSpacing: 1.2 }}>Food Bins</h3>
            <div style={{ display: 'flex', gap: 20 }}>
              {foodLevels.map((level, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Food bin container */}
                  <div style={{
                    width: 90,
                    height: containerHeight,
                    background: 'rgba(30,10,0,0.8)',
                    borderRadius: 24,
                    boxShadow: '0 0 32px #ff3c00aa',
                    border: '1.5px solid #ff3c00bb',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    backdropFilter: 'blur(6px) saturate(120%)',
                  }}>
                    {/* Animated fill with spring effect */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      height: `${level}%`,
                      background: 'linear-gradient(135deg, #ff8c00 60%, #fff0 100%)',
                      width: '100%',
                      transition: 'height 0.6s cubic-bezier(.42,2,.58,1)',
                      boxShadow: '0 0 12px #ff8c00cc',
                      borderBottomLeftRadius: 24,
                      borderBottomRightRadius: 24,
                    }} />
                    {/* Level label above fill, inside bin */}
                    <div style={{
                      position: 'absolute',
                      top: 16,
                      width: '100%',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: 18,
                      color: '#fff',
                      textShadow: '0 0 8px #ff3c00cc',
                      fontFamily: digitalFont,
                      letterSpacing: 1.1,
                      zIndex: 10,
                    }}>
                      {getLevelLabel(level)}
                    </div>
                  </div>
                  {/* Label below the bin */}
                  <span style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 20,
                    marginTop: 10,
                    fontFamily: digitalFont,
                    letterSpacing: 1.1,
                    textShadow: '0 0 8px #222',
                    textAlign: 'center',
                  }}>{['Starter', 'Grower', 'Finisher'][idx]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right Food Control */}
        <div style={{
          background: 'rgba(30,40,60,0.7)',
          boxShadow: '0 8px 32px #ff3c0033',
          border: '1.5px solid #ff3c00bb',
          padding: 28,
          borderRadius: 20,
          minWidth: 260,
          backdropFilter: 'blur(8px) saturate(140%)',
          marginTop: 104,
        }}>
          <h3 style={{ marginBottom: 18, letterSpacing: 1.5, color: '#fff', textShadow: '0 0 8px #ff3c00bb' }}>Food Control <GiGrain size={32} /></h3>
          {['Starter', 'Grower', 'Finisher'].map((label, idx) => (
            <button
              key={idx}
              onClick={() => handleFoodRelease(idx)}
              style={{
                ...commonButtonStyle,
                height: 90,
                fontSize: 22,
                background: 'linear-gradient(120deg, #ff8c00 0%, #ff3c00 60%, #fff5e0 100%)',
                color: '#fff',
                marginBottom: 34,
                border: '2px solid #ff8c00',
                borderRadius: 18,
                boxShadow: '0 4px 24px #ff8c0055, 0 1.5px 8px #ff3c0055',
                fontWeight: 700,
                letterSpacing: 1.2,
                fontFamily: digitalFont,
                backdropFilter: 'blur(4px) saturate(120%)',
                transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.boxShadow = '0 0 32px #ff8c00cc, 0 4px 24px #ff8c0055'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px #ff8c0055, 0 1.5px 8px #ff3c0055'; e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <GiGrain size={28} /> {label}
            </button>
          ))}
        </div>
      </div>
    </ControlBody>
  );
};

export default FeedingWatering;
