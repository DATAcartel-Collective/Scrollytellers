import { pipeline } from '@huggingface/transformers';
import * as lancedb from "@lancedb/lancedb";

class LocalRAGManager {
  constructor() {
    this.db = null;
    this.table = null;
    this.embedder = null;
    this.tableName = "knowledge_stash";
  }

  // 1. Initialize OPFS LanceDB and Transformers.js client-side
  async init() {
    // Initialize the client-side embedding model (runs via Wasm/WebGL)
    this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      progress_callback: (info) => console.log(`Loading Embedder: ${info.status}`),
    });

    // Connect to LanceDB using the browser's Origin Private File System (OPFS)
    // The "opfs://" prefix ensures data persists perfectly on the user's hard drive
    this.db = await lancedb.connect("opfs://uncutstash-vector-db");
    
    // Open existing table or create a new one if it doesn't exist
    const tableNames = await this.db.tableNames();
    if (tableNames.includes(this.tableName)) {
      this.table = await this.db.openTable(this.tableName);
    } else {
      // Create a dummy schema entry to initialize the table structure safely
      this.table = await this.db.createTable(this.tableName, [
        { id: "init", vector: Array(384).fill(0), text: "init_marker", metadata: "{}" }
      ]);
    }
    console.log("OPFS LanceDB and Embedder fully armed client-side.");
  }

  // 2. Generate a vector embedding purely in the browser
  async _getEmbedding(text) {
    const output = await this.embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  // 3. Ingest documents/chat logs directly into the client-side database
  async ingestDocument(text, metadata = {}) {
    if (!this.table) throw new Error("Database not initialized");
    
    const vector = await this._getEmbedding(text);
    const uniqueId = crypto.randomUUID();

    await this.table.add([{
      id: uniqueId,
      vector: vector,
      text: text,
      metadata: JSON.stringify(metadata)
    }]);
    
    console.log(`Successfully persisted item to browser OPFS: ${uniqueId}`);
  }

  // 4. Query LanceDB using Vector Search to pull relevant context for the LLM
  async searchContext(queryText, limit = 3) {
    if (!this.table) return "";

    const queryVector = await this._getEmbedding(queryText);
    
    // Execute near-instantaneous vector calculations right inside the browser engine
    const results = await this.table
      .vectorSearch(queryVector)
      .limit(limit)
      .toArray();

    // Filter out our initialization marker and map the clean context
    return results
      .filter(row => row.id !== "init")
      .map(row => `[Context Item]: ${row.text}`)
      .join("\n\n");
  }
}

export const ragManager = new LocalRAGManager();