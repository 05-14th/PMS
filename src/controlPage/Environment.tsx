import React, { useState, CSSProperties } from 'react';
import ControlBody from '../components/ControlBody';

const tabs = ['Temperature', 'Humidity', 'Light', 'Air Quality'];

const glassCard: CSSProperties = {
  border: '2px solid #00fff7',
  borderRadius: 24,
  background: 'rgba(30,40,60,0.7)',
  boxShadow: '0 0 32px 4px #00fff799, 0 2px 24px 0 #000a',
  padding: 32,
  margin: 8,
  minWidth: 260,
  minHeight: 180,
  color: '#fff',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  position: 'relative',
  transition: 'box-shadow 0.3s',
};

const neonTab = (active: boolean) => ({
  background: active ? 'rgba(0,255,255,0.12)' : 'rgba(30,40,60,0.7)',
  color: active ? '#00fff7' : '#fff',
  border: `2px solid ${active ? '#00fff7' : '#444'}`,
  borderRadius: 16,
  padding: '10px 32px',
  fontSize: 18,
  fontWeight: 700,
  marginRight: 16,
  cursor: 'pointer',
  boxShadow: active ? '0 0 16px 2px #00fff799' : 'none',
  letterSpacing: 2,
  outline: 'none',
  transition: 'all 0.2s',
});

const neonBar = (color: string, percent: number) => ({
  width: percent + '%',
  height: 12,
  borderRadius: 8,
  background: `linear-gradient(90deg, ${color} 0%, #222 100%)`,
  boxShadow: `0 0 16px 2px ${color}99`,
  transition: 'width 0.7s cubic-bezier(.4,2,.6,1)',
});

function Environment() {
  const [activeTab, setActiveTab] = useState('Temperature');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Temperature':
        return (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ ...glassCard, border: '2px solid #00fff7' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#00fff7', textShadow: '0 0 16px #00fff7' }}>26.1°C</div>
              <div style={{ margin: '18px 0 8px', fontSize: 18, color: '#fff' }}>Target Temperature</div>
              <div style={{ width: '100%', marginTop: 18 }}>
                <div style={{ fontSize: 14, color: '#00fff7', marginBottom: 4 }}>Set Point</div>
                <div style={{ background: '#222', borderRadius: 8, height: 12, width: '100%' }}>
                  <div style={neonBar('#00fff7', 50)} />
                </div>
              </div>
            </div>
            <div style={{ ...glassCard, border: '2px solid #ff3c00' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#ff3c00', textShadow: '0 0 12px #ff3c00', marginBottom: 12 }}>Automation</div>
              <div style={{ background: '#222', borderRadius: 8, height: 12, width: '100%', marginBottom: 12 }}>
                <div style={neonBar('#ff3c00', 67)} />
              </div>
              <div style={{ fontSize: 16, color: '#ffb380', margin: '10px 0' }}>5AM – 8PM</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ color: '#fff' }}>Status</span>
                <span style={{ color: '#ff3c00', fontWeight: 700 }}>ON</span>
              </div>
            </div>
            <div style={{ ...glassCard, border: '2px solid #00fff7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#00fff7', textShadow: '0 0 16px #00fff7' }}>18</div>
              <div style={{ color: '#00fff7', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>GOOD</div>
              <div style={{ width: '100%', marginTop: 18 }}>
                <div style={{ fontSize: 14, color: '#00fff7', marginBottom: 4 }}>Automation</div>
                <div style={{ background: '#222', borderRadius: 8, height: 12, width: '100%' }}>
                  <div style={neonBar('#00fff7', 80)} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'Humidity':
        return (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ ...glassCard, border: '2px solid #00fff7' }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#00fff7', textShadow: '0 0 16px #00fff7' }}>55%</div>
              <div style={{ color: '#fff', fontSize: 18, marginTop: 10 }}>Current Humidity</div>
            </div>
            <div style={{ ...glassCard, border: '2px solid #ff3c00' }}>
              <div style={{ fontSize: 24, color: '#ff3c00', fontWeight: 700, marginBottom: 10 }}>Automation</div>
              <div style={{ background: '#222', borderRadius: 8, height: 12, width: '100%', marginBottom: 12 }}>
                <div style={neonBar('#ff3c00', 60)} />
              </div>
            </div>
          </div>
        );
      case 'Light':
        return (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ ...glassCard, border: '2px solid #00fff7' }}>
              <div style={{ fontSize: 24, color: '#00fff7', fontWeight: 700, marginBottom: 10 }}>Lighting Graph</div>
              <div style={{ background: '#222', borderRadius: 8, height: 12, width: '100%' }}>
                <div style={neonBar('#00fff7', 80)} />
              </div>
            </div>
            <div style={{ ...glassCard, border: '2px solid #ff3c00' }}>
              <div style={{ fontSize: 24, color: '#ff3c00', fontWeight: 700, marginBottom: 10 }}>Automation</div>
              <div style={{ background: '#222', borderRadius: 8, height: 12, width: '100%' }}>
                <div style={neonBar('#ff3c00', 40)} />
              </div>
            </div>
          </div>
        );
      case 'Air Quality':
        return (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ ...glassCard, border: '2px solid #00fff7' }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#00fff7', textShadow: '0 0 16px #00fff7' }}>18</div>
              <div style={{ color: '#00fff7', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Good</div>
            </div>
            <div style={{ ...glassCard, border: '2px solid #ff3c00' }}>
              <div style={{ fontSize: 24, color: '#ff3c00', fontWeight: 700, marginBottom: 10 }}>Automation</div>
              <div style={{ background: '#222', borderRadius: 8, height: 12, width: '100%' }}>
                <div style={neonBar('#ff3c00', 60)} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <ControlBody>
        <div style={{ padding: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#00fff7', marginBottom: 32, letterSpacing: 2, textShadow: '0 0 16px #00fff7' }}>
            Environmental Control
          </h1>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={neonTab(activeTab === tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          <div>
            {renderTabContent()}
          </div>
        </div>
      </ControlBody>
    </div>
  );
}

export default Environment;