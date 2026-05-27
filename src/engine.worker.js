import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

console.log("engine.worker.js: Script loaded, initializing WebWorkerMLCEngineHandler...");

try {
  const handler = new WebWorkerMLCEngineHandler();

  self.onmessage = (msg) => {
    handler.onmessage(msg);
  };
  console.log("engine.worker.js: WebWorkerMLCEngineHandler initialized successfully.");
} catch (err) {
  console.error("engine.worker.js: WebWorkerMLCEngineHandler failed to initialize:", err);
  self.postMessage({
    type: "error",
    message: err.message || "Failed to initialize WebWorkerMLCEngineHandler"
  });
}