import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { CoreEngine } from './phase2_logic.js';
import { StashEngine } from './stash_logic.js';
import './styles.css';

function ParticleField() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const THREE = window.THREE;
        if (!THREE) return;

        const canvas = canvasRef.current;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 28;

        const count = 280;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 90;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color: 0xff007f, size: 0.12, transparent: true, opacity: 0.5 });
        const points = new THREE.Points(geo, mat);
        scene.add(points);

        const gridMat = new THREE.LineBasicMaterial({ color: 0xff007f, transparent: true, opacity: 0.04 });
        const gridGeo = new THREE.BufferGeometry();
        const linePositions = [];
        for (let i = -40; i <= 40; i += 8) {
            linePositions.push(i, -12, -40, i, -12, 40);
            linePositions.push(-40, -12, i, 40, -12, i);
        }
        gridGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
        scene.add(new THREE.LineSegments(gridGeo, gridMat));

        let animId;
        const animate = () => {
            animId = requestAnimationFrame(animate);
            points.rotation.y += 0.00025;
            points.rotation.x += 0.00008;
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            geo.dispose();
            mat.dispose();
            renderer.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} className="particle-canvas" />;
}

function ApplicationController() {
    const [status, setStatus] = useState({ compute: 'Initializing', storage: 'Initializing' });
    const [stashStatus, setStashStatus] = useState({});
    const [downloading, setDownloading] = useState(null);
    const [progress, setProgress] = useState(0);
    const heroRef = useRef(null);
    const stashRef = useRef(null);
    const lenisRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            try {
                const caps = await CoreEngine.boot();
                setStatus(caps);
                const stash = await StashEngine.initializeStash();
                setStashStatus(stash || {});
            } catch (err) {
                console.error("DATAcartel Lifecycle Boot Crash:", err);
            }
        };
        init();
    }, []);

    useEffect(() => {
        const gsap = window.gsap;
        const ScrollTrigger = window.ScrollTrigger;
        const Lenis = window.Lenis;
        if (!gsap || !ScrollTrigger || !Lenis) return;

        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis({
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
        });
        lenisRef.current = lenis;

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);

        gsap.fromTo('.badge',
            { x: 24, opacity: 0 },
            { x: 0, opacity: 1, stagger: 0.12, duration: 0.7, delay: 1.4, ease: 'power2.out' }
        );

        if (heroRef.current) {
            gsap.fromTo('.tagline-top',
                { y: 16, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: 'power2.out' }
            );
            gsap.fromTo(heroRef.current.querySelectorAll('.hero-line'),
                { y: 80, opacity: 0, skewY: 2 },
                { y: 0, opacity: 1, skewY: 0, duration: 1.1, stagger: 0.12, delay: 0.5, ease: 'power4.out' }
            );
            gsap.fromTo('.hero-sub',
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, delay: 1.0, ease: 'power2.out' }
            );
        }

        if (stashRef.current) {
            gsap.fromTo('.module-eyebrow',
                { y: 20, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.7, ease: 'power2.out',
                    scrollTrigger: { trigger: stashRef.current, start: 'top 82%' }
                }
            );
            gsap.fromTo('.module-title, .module-desc',
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1, stagger: 0.1, duration: 0.9, ease: 'power3.out',
                    scrollTrigger: { trigger: stashRef.current, start: 'top 80%' }
                }
            );
            gsap.fromTo('.stash-manager',
                { y: 40, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
                    scrollTrigger: { trigger: stashRef.current, start: 'top 75%' }
                }
            );
            gsap.fromTo('.model-row',
                { x: -24, opacity: 0 },
                {
                    x: 0, opacity: 1, stagger: 0.14, duration: 0.7, ease: 'power2.out',
                    scrollTrigger: { trigger: stashRef.current, start: 'top 72%' }
                }
            );
        }

        return () => {
            lenis.destroy();
            ScrollTrigger.getAll().forEach(t => t.kill());
            gsap.ticker.remove((time) => lenis.raf(time * 1000));
        };
    }, []);

    const handleDownload = async (id) => {
        setDownloading(id);
        await StashEngine.downloadToStash(id, (p) => setProgress(p));
        const updated = await StashEngine.getDownloadedStatus();
        setStashStatus(updated || {});
        setDownloading(null);
    };

    return (
        <>
            <ParticleField />

            <div className="resiliency-dashboard">
                <div className={`badge ${status?.compute === 'CPU Mode' ? 'alert' : 'stable'}`}>
                    {status?.compute === 'CPU Mode' ? 'CPU Resiliency' : 'WebGPU Active'}
                </div>
                <div className={`badge ${status?.storage === 'IndexedDB' ? 'alert' : 'stable'}`}>
                    {status?.storage === 'IndexedDB' ? 'IndexedDB Fallback' : 'OPFS Persistent'}
                </div>
            </div>

            <header className="app-header glass-panel">
                <div className="brand-anchor">UNCUT<span className="brand-accent">stash</span></div>
                <div className="telemetry-node">DATAcartel Collective Node</div>
            </header>

            <main>
                <section className="hero-section" ref={heroRef}>
                    <div className="hero-inner">
                        <p className="tagline tagline-top">Sovereign Intelligence Platform</p>
                        <h1 className="hero-text">
                            <span className="hero-line">Local</span>
                            <span className="hero-line accent">Intelligence.</span>
                            <span className="hero-line dim">Yours.</span>
                        </h1>
                        <p className="hero-sub">No cloud. No logs. No compromise.</p>
                    </div>
                    <div className="hero-scroll-hint">
                        <span className="scroll-label">scroll</span>
                        <div className="scroll-line" />
                    </div>
                </section>

                <section className="scroll-track">
                    <div className="feature-module" ref={stashRef}>
                        <p className="module-eyebrow">Model Stash</p>
                        <h2 className="module-title">Sovereign Model Cache</h2>
                        <p className="module-desc">
                            Download and run AI models entirely on your device. No server ever touches your prompts, your files, or your data.
                        </p>
                        <div className="stash-manager">
                            {StashEngine?.models?.map(model => (
                                <div key={model.id} className="model-row">
                                    <div className="model-info">
                                        <span className="model-id">{model.id}</span>
                                        <span className="model-size">{model.size || 'Unknown'}</span>
                                    </div>
                                    {stashStatus?.[model.id] ? (
                                        <button className="btn-status" disabled>Stashed</button>
                                    ) : (
                                        <button className="btn-download" onClick={() => handleDownload(model.id)}>
                                            {downloading === model.id
                                                ? <span className="dl-progress">{progress}%</span>
                                                : 'Download'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<ApplicationController />);
}