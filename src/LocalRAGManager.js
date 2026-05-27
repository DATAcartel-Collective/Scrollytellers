import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector"; // Enables pgvector locally!
import { pipeline } from '@huggingface/transformers';

class LocalRAGManager {
  constructor() {
    this.pg = null;
    this.embedder = null;
  }

  // Initialize browser WebAssembly database
  async init() {
    // 1. Fire up the local WebGPU/Wasm embedding pipeline
    this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      progress_callback: (info) => console.log(`Loading Embedder: ${info.status}`),
    });

    // 2. Connect to PGlite using true local persistent browser storage
    // This creates a secure, offline SQL database directly on the user's device memory
    this.pg = await PGlite.create({
      dataDir: "idb://uncutstash-secure-vault",
      extensions: { vector }
    });

    // 3. Create a vector-optimized table schema inside the browser
    await this.pg.exec(`
      CREATE EXTENSION IF NOT EXISTS vector;
      CREATE TABLE IF NOT EXISTS knowledge_stash (
        id UUID PRIMARY KEY,
        text TEXT,
        embedding vector(384),
        metadata TEXT
      );
    `);
    console.log("Sovereign PGlite Vector Engine Fully Armed Client-Side.");
  }

  async _getEmbedding(text) {
    const output = await this.embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  // Ingest documents or conversations locally
  async ingestDocument(text, metadata = {}) {
    if (!this.pg) throw new Error("Database offline");
    
    const rawVector = await this._getEmbedding(text);
    const uniqueId = crypto.randomUUID();
    
    // Format vector numbers into a clear Postgres string array format: '[0.12,0.43,...]'
    const pgVectorString = `[${rawVector.join(",")}]`;

    await this.pg.query(
      "INSERT INTO knowledge_stash (id, text, embedding, metadata) VALUES ($1, $2, $3, $4);",
      [uniqueId, text, pgVectorString, JSON.stringify(metadata)]
    );
    console.log(`Persisted item to device relational vault: ${uniqueId}`);
  }

  // Execute near-instantaneous cosine-similarity vector calculations inside the browser
  async searchContext(queryText, limit = 3) {
    if (!this.pg) return "";

    const queryVector = await this._getEmbedding(queryText);
    const pgVectorString = `[${queryVector.join(",")}]`;

    // Use standard SQL vector distance ordering (<=> calculates cosine distance)
    const res = await this.pg.query(`
      SELECT text FROM knowledge_stash 
      ORDER BY embedding <=> $1 
      LIMIT $2;
    `, [pgVectorString, limit]);

    return res.rows.map(row => `[Context Item]: ${row.text}`).join("\n\n");
  }
}

export const ragManager = new LocalRAGManager();