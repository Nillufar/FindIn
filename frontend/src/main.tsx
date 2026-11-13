import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {HomeDiscovery} from './components/HomeDiscovery';
import './styles.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <HomeDiscovery />
    </StrictMode>,
);
