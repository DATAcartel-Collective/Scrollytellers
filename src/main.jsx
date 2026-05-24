import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { CoreEngine } from './phase2_logic.js';
import { StashEngine } from './stash_logic.js';
import './styles.css';

function ApplicationController() {
    const [status, setStatus] = useState({ compute: 'Initializing', storage: 'Initializing' });
    const [stashStatus, setStashStatus] = useState({});
    const [downloading, setDownloading] = useState(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const init = async () => {
            try {
                const caps = await CoreEngine.boot();
                setStatus(caps);
                const stash = await StashEngine.initializeStash();
                setStashStatus(stash || {});
            } catch (err) {
                console.error("DATAcartel Lifecycle Boot Crash: ", err);
            }
        };
        init();
    }, []);

    const handleDownload = async (id) => {
        setDownloading(id);
        await StashEngine.downloadToStash(id, (p) => setProgress(p));
        const updatedStatus = await StashEngine.getDownloadedStatus();
        setStashStatus(updatedStatus || {});
        setDownloading(null);
    };

    return (
        <main>
            <div className="resiliency-dashboard">
                <div className={`badge ${(status && status.compute === 'CPU Mode') ? 'alert' : 'stable'}`}>
                    {(status && status.compute === 'CPU Mode') ? 'SYSTEM: CPU RESILIENCY' : 'HARDWARE: WEBGPU ACTIVE'}
                </div>
                <div className={`badge ${(status && status.storage === 'IndexedDB') ? 'alert' : 'stable'}`}>
                    {(status && status.storage === 'IndexedDB') ? 'STORAGE: INDEXEDDB FALLBACK' : 'STORAGE: OPFS PERSISTENT'}
                </div>
            </div>

            <header className="app-header glass-panel">
                <div className="brand-anchor">UNCUTstash AI</div>
                <div className="telemetry-node">DATAcartel Collective Node</div>
            </header>

            <section className="scroll-track">
                <div className="feature-module">
                    <h1 className="hero-text">Local <br /><span style={{ color: 'var(--accent-pink)' }}>Intelligence</span>.</h1>
                    <div className="stash-manager">
                        <h3>Sovereign Model Stash</h3>
                        {StashEngine?.models && StashEngine.models.map(model => (
                            <div key={model.id} className="model-row">
                                <span>{model.id} ({model.size || 'Unknown Size'})</span>
                                {stashStatus && stashStatus[model.id] ? (
                                    <button className="btn-status" disabled>STASHED</button>
                                ) : (
                                    <button className="btn-download" onClick={() => handleDownload(model.id)}>
                                        {downloading === model.id ? `${progress}%` : "DOWNLOAD"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<ApplicationController />);
}