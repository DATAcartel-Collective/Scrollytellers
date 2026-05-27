/**
 * UNCUTstash AI | Unrestricted AI 
 * It's time to take back control of your personal data, once and for all.
 * 
 * OPFS-based model stash controller for persistent, on-device model caching.
 */

const MODEL_REGISTRY = [
    {
        id: "SNOWflake",
        url: "https://pub-f9f773c792994f58bd674d3f8cb17d9d.r2.dev/SNOWflake_v1.0/",
        lib: "https://pub-f9f773c792994f58bd674d3f8cb17d9d.r2.dev/core/SNOWflake_v1.0.wasm"
    },
    {
        id: "FISHscale",
        url: "https://pub-f9f773c792994f58bd674d3f8cb17d9d.r2.dev/FISHscale_v1.0/",
        lib: "https://pub-f9f773c792994f58bd674d3f8cb17d9d.r2.dev/core/FISHscale_v1.0.wasm"
    }
];

class ModelStashController {
    constructor() {
        this.models = MODEL_REGISTRY;
        this.directory = null;
    }

    async initializeStash() {
        if (!navigator.storage || !navigator.storage.getDirectory) {
            throw new Error("STASH ERROR: Device does not support OPFS persistence.");
        }
        // Access the root of the sandbox storage
        this.directory = await navigator.storage.getDirectory();
        return this.getDownloadedStatus();
    }

    async downloadToStash(modelId, onProgress) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) throw new Error(`Model "${modelId}" not found in registry.`);

        const response = await fetch(model.url);
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');

        // Create file handle in OPFS
        const fileHandle = await this.directory.getFileHandle(`${modelId}.bin`, { create: true });
        const writable = await fileHandle.createWritable();

        let receivedLength = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Write chunk directly to disk to protect device RAM
            await writable.write(value);
            receivedLength += value.length;
            if (onProgress) onProgress(Math.round((receivedLength / contentLength) * 100));
        }

        await writable.close();
        console.log(`UNCUTstash AI | ${modelId} anchored to local storage.`);
    }

    async getDownloadedStatus() {
        const status = {};
        for (const m of this.models) {
            try {
                await this.directory.getFileHandle(`${m.id}.bin`);
                status[m.id] = true;
            } catch {
                status[m.id] = false;
            }
        }
        return status;
    }
}

export const StashEngine = new ModelStashController();