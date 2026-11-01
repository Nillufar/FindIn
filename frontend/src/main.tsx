import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

function App() {
    return (
        <main className="app-shell">
            <p className="eyebrow">FindIn starter</p>
            <h1>Build better projects together.</h1>
            <p className="intro">
                The foundation is ready. Team members can now build authentication, project cards, matching,
                invitations, and collaboration features on separate branches.
            </p>
            <div className="status-card">
                <span className="status-dot"/>
                <div>
                    <strong>Frontend is running</strong>
                    <p>Connect this screen to the API as feature work begins.</p>
                </div>
            </div>
        </main>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App/>
    </StrictMode>,
);
