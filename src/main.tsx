import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntApp } from 'antd';
import '@ant-design/v5-patch-for-react-19';
import App from './App';
import './index.css';

// The patch is automatically applied when imported

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AntApp>
            <App />
        </AntApp>
    </React.StrictMode>
);