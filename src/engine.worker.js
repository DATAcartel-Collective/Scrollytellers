import { WebWorkerEngineHandler } from "@mlc-ai/web-llm";

// Instantiate the background listener handler
const handler = new WebWorkerEngineHandler();

// Connect the worker's internal messaging to WebLLM
self.onmessage = (msg) => {
  handler.onmessage(msg);
};