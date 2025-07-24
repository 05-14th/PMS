import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import ControlBody from '../components/ControlBody';
import { FaPills, FaTint } from 'react-icons/fa';
import { GiGrain } from 'react-icons/gi';

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

  const createWaveStyle = (level: number, color: string): CSSProperties => {
    const height = (level / 100) * containerHeight;
    const waveTop = containerHeight - height;
    return {
      position: 'absolute',
      top: waveTop,
      width: '100%',
      height: `${height}px`,
      background: color,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      transform: `translateY(${Math.sin(wavePhase) * 4}px)`,
      transition: 'height 0.4s',
    };
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

  return (
    <ControlBody>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 24, background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
        
        {/* Left Control Panel */}
        <div style={{ background: '#1c1c1c', padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 24, minWidth: 240 }}>
          
          <div>
            <h3 style={{ marginBottom: 16 }}>Medicine Control <FaPills /></h3>
            {MEDICINE_RELEASES.map((amt, idx) => (
              <button
                key={idx}
                onClick={() => handleMedicineRelease(amt)}
                style={{
                  ...commonButtonStyle,
                  background: '#4de2c3',
                  color: '#000',
                  marginBottom: 12,
                }}
              >
                <FaPills size={20} /> Level {idx + 1}
              </button>
            ))}
          </div>

          <div>
            <h3 style={{ marginBottom: 16 }}>Water Control <FaTint /></h3>
            {WATER_RELEASES.map((amt, idx) => (
              <button
                key={idx}
                onClick={() => handleWaterRelease(amt)}
                style={{
                  ...commonButtonStyle,
                  background: '#4d8de2',
                  color: '#fff',
                  marginBottom: 12,
                }}
              >
                <FaTint size={20} /> Level {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Center Display */}
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: 48 }}>
          
          {/* Water Container */}
          <div>
            <h3 style={{ textAlign: 'center', color: '#00fff7', marginBottom: 12 }}>Water Tank</h3>
            <div style={{ width: containerWidth, height: containerHeight, background: '#222', borderRadius: 20, boxShadow: '0 0 24px #00fff7', position: 'relative', overflow: 'hidden' }}>
              <div style={createWaveStyle(waterLevel, '#007aff')} />
              <div style={{ position: 'absolute', top: 16, width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
                {getLevelLabel(waterLevel)}
              </div>
            </div>
          </div>

          {/* Medicine Container */}
          <div>
            <h3 style={{ textAlign: 'center', color: '#00fff7', marginBottom: 12 }}>Medicine Tank</h3>
            <div style={{ width: containerWidth, height: containerHeight, background: '#222', borderRadius: 20, boxShadow: '0 0 24px #00fff7', position: 'relative', overflow: 'hidden' }}>
              <div style={createWaveStyle(medicineLevel, '#00c8ff')} />
              <div style={{ position: 'absolute', top: 16, width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
                {getLevelLabel(medicineLevel)}
              </div>
            </div>
          </div>

          {/* Food Containers */}
          <div>
            <h3 style={{ textAlign: 'center', color: '#ff3c00', marginBottom: 12 }}>Food Bins</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              {foodLevels.map((level, idx) => (
                <div key={idx} style={{ width: 90, height: containerHeight, background: '#222', borderRadius: 20, boxShadow: '0 0 24px #ff3c00', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: 0, height: `${level}%`, background: '#ff8c00', width: '100%', transition: 'height 0.4s' }} />
                  <div style={{ position: 'absolute', top: 16, width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
                    {['Starter', 'Grower', 'Finisher'][idx]}<br />{getLevelLabel(level)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Food Control */}
        <div style={{ background: '#1c1c1c', padding: 20, borderRadius: 16, minWidth: 240 }}>
          <h3 style={{ marginBottom: 16 }}>Food Control <GiGrain /></h3>
          {['Starter', 'Grower', 'Finisher'].map((label, idx) => (
            <button
              key={idx}
              onClick={() => handleFoodRelease(idx)}
              style={{
                ...commonButtonStyle,
                background: '#ff3c00',
                color: '#fff',
                marginBottom: 12,
              }}
            >
              <GiGrain size={20} /> {label}
            </button>
          ))}
        </div>
      </div>
    </ControlBody>
  );
};

export default FeedingWatering;
