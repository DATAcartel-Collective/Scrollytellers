/**
 * UNCUTstash AI | Unrestricted AI 
 * It's time to take back control of your personal data, once and for all.
 */

const customAppConfig = {
    model_list: [
        {
            model: "https://pub-f9f773c792994f58bd674d3f8cb17d9d.r2.dev/SNOWflake_v1.0/",
            model_id: "SNOWflake",
            model_lib: "https://pub-f9f773c792994f58bd674d3f8cb17d9d.r2.dev/core/SNOWflake_v1.0.wasm/"
        },
        {
            model: "https://pub-f9f773c792994f58bd674d3f8cb17d9d.r2.dev/FISHscale_v1.0/",
            model_id: "FISHscale",
            model_lib: "https://pub-f9f773c792994f58bd674d3f8cb17d9d.r2.dev/core/FISHscale_v1.0.wasm"
        }
    ],

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