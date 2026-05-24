/**
 * UNCUTstash AI | Model Persistence & OPFS Streaming
 * Standards: Native File System API, Streamable Downloads, Zero-RAM Buffer
 */

export class ModelStashController {
    constructor() {
        this.directory = null;
        this.models = [
            { id: 'Phi-3-mini', size: '2.3GB', url: '/models/phi3-mini.bin' },
            { id: 'Mistral-7B', size: '4.1GB', url: '/models/mistral7b.bin' }
        ];
    }

    async initializeStash() {
        if (!navigator.storage || !navigator.storage.getDirectory) {
            throw new Error("STASH ERROR: Device does not support OPFS persistence.");
        }
        // Access the root of the sandbox storage [Source 2]
        this.directory = await navigator.storage.getDirectory();
        return this.getDownloadedStatus();
    }

    async downloadToStash(modelId, onProgress) {
        const model = this.models.find(m => m.id === modelId);
        const response = await fetch(model.url);
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');
        
        // Create file handle in OPFS [Source 1335]
        const fileHandle = await this.directory.getFileHandle(`${modelId}.bin`, { create: true });
        const writable = await fileHandle.createWritable();

        let receivedLength = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Write chunk directly to disk to protect iPhone RAM [Source 1]
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