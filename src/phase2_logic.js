/**
 * UNCUTstash AI | Core Logic & Contingency Engine
 * _WebGPU/CPU & OPFS/IndexedDB Fallback, RRF k=60_
 */

export class ResiliencyController {
    constructor() {
        this.computeMode = 'WebGPU'; // Default
        this.storageMode = 'OPFS';   // Default
    }

    async detectCapabilities() {
        // Detect WebGPU Availability
        if (!navigator.gpu) {
            this.computeMode = 'CPU Mode';
            console.warn("UNCUTstash AI| WebGPU not detected. Falling back to CPU (WASM).");
        }

        // Detect OPFS Availability
        if (!navigator.storage || !navigator.storage.getDirectory) {
            this.storageMode = 'IndexedDB';
            console.warn("UNCUTstash AI | OPFS unavailable. Falling back to IndexedDB.");
        }

        return { compute: this.computeMode, storage: this.storageMode };
    }
}

export class CryptographicSecurityProvider {
    constructor() {
        this.algorithm = { name: 'AES-GCM', length: 256 };
    }

    async generateMasterKey(mnemonic) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw', encoder.encode(mnemonic), { name: 'PBKDF2' }, false, ['deriveKey']
        );

        return await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('DATAcartel_Matrix_Salt_2026'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial, this.algorithm, false, ['encrypt', 'decrypt']
        );
    }
}

export class SecureStorageEngine {
    constructor() {
        this.db = null;
        this.mode = 'OPFS';
    }

    async initialize(mode) {
        this.mode = mode;
        const lancedb = await import('@lancedb/lancedb');

        if (this.mode === 'OPFS') {
            // Standard 2026 Protocol [Source 2]
            this.db = await lancedb.connect("opfs://datacartel_vault_v1");
        } else {
            // Legacy/Fallback Protocol [Source 175]
            // LanceDB WASM primarily targets OPFS, but we wrap the connection 
            // string for indexedDB compatibility in restricted runtimes.
            this.db = await lancedb.connect("indexeddb://datacartel_fallback_v1");
        }
        console.log(`UNCUTstash AI | Storage anchored via ${this.mode}.`);
    }

    async vectorSearch(tableName, queryVector, limit = 60) {
        const table = await this.db.openTable(tableName);
        return await table.vectorSearch(queryVector).limit(limit).toArray();
    }
}

export class WebGPUComputeNode {
    constructor() {
        this.deviceType = 'webgpu';
        this.precision = 'fp16';
    }

    async initialize(mode) {
        if (mode === 'CPU Mode') {
            this.deviceType = 'wasm';
            this.precision = 'fp32'; // CPU stability requirement
        }
        console.log(`UNCUTstash AI | Compute Node active in ${mode}.`);
    }

    async generateEmbeddings(textInput) {
        const { pipeline } = await import('@xenova/transformers');
        const extractor = await pipeline('feature-extraction', 'nomic-ai/nomic-embed-text-v1.5', {
            device: this.deviceType,
            dtype: this.precision
        });

        const result = await extractor(textInput, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
    }
}

export class HybridRetrievalEngine {
    constructor() {
        this.k = 60; // Mandated Rank Constant [Source 5]
    }

    executeRRF(vectorResults, keywordResults) {
        const scores = new Map();
        // Weighting: 0.7 Vector / 0.3 Keyword [Source 5]
        vectorResults.forEach((doc, rank) => {
            const score = (1 / (this.k + rank)) * 0.7;
            scores.set(doc.uuid, (scores.get(doc.uuid) || 0) + score);
        });
        keywordResults.forEach((doc, rank) => {
            const score = (1 / (this.k + rank)) * 0.3;
            scores.set(doc.uuid, (scores.get(doc.uuid) || 0) + score);
        });
        return [...scores.entries()].sort((a, b) => b[1] - a[1]);
    }
}

export class ApplicationController {
    constructor() {
        this.resiliency = new ResiliencyController();
        this.storage = new SecureStorageEngine();
        this.compute = new WebGPUComputeNode();
        this.security = new CryptographicSecurityProvider();
        this.rag = new HybridRetrievalEngine();
        this.systemState = { compute: 'Initializing', storage: 'Initializing' };
    }

    async boot() {
        const caps = await this.resiliency.detectCapabilities();
        this.systemState = caps;

        await Promise.all([
            this.storage.initialize(caps.storage),
            this.compute.initialize(caps.compute)
        ]);

        console.log("UNCUTstash AI by DATAcartel Collective");
        return caps;
    }
}

export const CoreEngine = new ApplicationController();