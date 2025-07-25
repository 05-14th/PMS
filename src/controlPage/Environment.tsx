import React, { useState, CSSProperties } from 'react';
import ControlBody from '../components/ControlBody';

const tabs = ['Temperature', 'Humidity', 'Light', 'Air Quality'];

const card: CSSProperties = {
  border: '1px solid #e0e6ed',
  borderRadius: 16,
  background: '#fff',
  boxShadow: '0 2px 12px 0 #e0e6ed',
  padding: 24,
  margin: 12,
  minWidth: 240,
  minHeight: 140,
  color: '#222',
  fontFamily: 'Segoe UI, Arial, sans-serif',
  position: 'relative',
  transition: 'box-shadow 0.3s',
};

const tabStyle = (active: boolean): CSSProperties => ({
  background: active ? '#e6f0fa' : 'transparent',
  color: active ? '#1976d2' : '#222',
  border: 'none',
  borderBottom: active ? '3px solid #1976d2' : '3px solid transparent',
  borderRadius: 0,
  padding: '10px 24px',
  fontSize: 17,
  fontWeight: 600,
  marginRight: 8,
  cursor: 'pointer',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'all 0.2s',
});

const progressBar = (color: string, percent: number): CSSProperties => ({
  width: percent + '%',
  height: 8,
  borderRadius: 4,
  background: color,
  transition: 'width 0.5s',
});

function Environment() {
  const [activeTab, setActiveTab] = useState('Temperature');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Temperature':
        return (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={card}>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#1976d2', marginBottom: 8 }}>26.1°C</div>
              <div style={{ fontSize: 16, color: '#555', marginBottom: 12 }}>Target Temperature</div>
              <div style={{ width: '100%', marginTop: 10 }}>
                <div style={{ fontSize: 13, color: '#1976d2', marginBottom: 4 }}>Set Point</div>
                <div style={{ background: '#f0f4fa', borderRadius: 4, height: 8, width: '100%' }}>
                  <div style={progressBar('#1976d2', 50)} />
                </div>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1976d2', marginBottom: 8 }}>Automation</div>
              <div style={{ background: '#f0f4fa', borderRadius: 4, height: 8, width: '100%', marginBottom: 10 }}>
                <div style={progressBar('#1976d2', 67)} />
              </div>
              <div style={{ fontSize: 14, color: '#888', margin: '8px 0' }}>5AM – 8PM</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ color: '#222' }}>Status</span>
                <span style={{ color: '#1976d2', fontWeight: 700 }}>ON</span>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1976d2', marginBottom: 6 }}>18</div>
              <div style={{ color: '#1976d2', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>GOOD</div>
              <div style={{ width: '100%', marginTop: 10 }}>
                <div style={{ fontSize: 13, color: '#1976d2', marginBottom: 4 }}>Automation</div>
                <div style={{ background: '#f0f4fa', borderRadius: 4, height: 8, width: '100%' }}>
                  <div style={progressBar('#1976d2', 80)} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'Humidity':
        return (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={card}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1976d2', marginBottom: 8 }}>55%</div>
              <div style={{ color: '#555', fontSize: 16, marginTop: 6 }}>Current Humidity</div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 16, color: '#1976d2', fontWeight: 600, marginBottom: 8 }}>Automation</div>
              <div style={{ background: '#f0f4fa', borderRadius: 4, height: 8, width: '100%', marginBottom: 10 }}>
                <div style={progressBar('#1976d2', 60)} />
              </div>
            </div>
          </div>
        );
      case 'Light':
        return (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={card}>
              <div style={{ fontSize: 16, color: '#1976d2', fontWeight: 600, marginBottom: 8 }}>Lighting Graph</div>
              <div style={{ background: '#f0f4fa', borderRadius: 4, height: 8, width: '100%' }}>
                <div style={progressBar('#1976d2', 80)} />
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 16, color: '#1976d2', fontWeight: 600, marginBottom: 8 }}>Automation</div>
              <div style={{ background: '#f0f4fa', borderRadius: 4, height: 8, width: '100%' }}>
                <div style={progressBar('#1976d2', 40)} />
              </div>
            </div>
          </div>
        );
      case 'Air Quality':
        return (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={card}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1976d2', marginBottom: 8 }}>18</div>
              <div style={{ color: '#1976d2', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Good</div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 16, color: '#1976d2', fontWeight: 600, marginBottom: 8 }}>Automation</div>
              <div style={{ background: '#f0f4fa', borderRadius: 4, height: 8, width: '100%' }}>
                <div style={progressBar('#1976d2', 60)} />
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
        <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto', paddingBottom: 80 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1976d2', marginBottom: 28, letterSpacing: 1, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
            Environmental Control
          </h1>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: '1px solid #e0e6ed' }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={tabStyle(activeTab === tab)}
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