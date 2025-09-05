import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntApp } from 'antd';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AntApp>
            <App />
        </AntApp>
    </React.StrictMode>
);
