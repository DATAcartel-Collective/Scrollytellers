import React, { useState, useEffect } from "react";
import { CreateWebGPUEngine } from "@mlc-ai/web-llm";
import { ragManager } from "./LocalRAGManager";

export default function App() {
  const [engine, setEngine] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Booting Client Engines...");

  useEffect(() => {
    async function bootClientSide() {
      try {
        // Step A: Fire up the local vector database and embedding pipeline
        setStatus("Initializing Local Vector DB (OPFS)...");
        await ragManager.init();

        // Step B: Fire up WebLLM pointing to your custom Cloudflare R2 Model
        setStatus("Loading WebGPU Model Weights from R2...");
        const config = {
          model_list: [{
            model_url: "https://your-r2-url.com/My-Custom-Model-Name/",
            local_id: "My-Custom-Model-Name",
            model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/webgpu/qwen3.5-2b-v1.0-webgpu.wasm"
          }]
        };
        
        const webGPUEngine = await CreateWebGPUEngine("My-Custom-Model-Name", {
          onUpdate: (info) => setStatus(info.text) // Tracks actual browser caching progress
        }, config);
        
        setEngine(webGPUEngine);
        setStatus("System Fully Autonomous");
      } catch (err) {
        setStatus(`Initialization failed: ${err.message}`);
      }
    }
    bootClientSide();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !engine) return;

    const userText = input;
    setInput("");
    
    // Add raw user message immediately to the UI array
    setMessages((prev) => [...prev, { role: "user", content: userText }]);

    // Step 1: Run local vector lookup against the user's query
    setStatus("Searching local vector space...");
    const retrievedContext = await ragManager.searchContext(userText, 3);

    // Step 2: Inject system instructions + the retrieved local knowledge
    const systemPrompt = `You are a completely client-side local intelligence agent. 
Use the following local contexts retrieved from the user's device storage if relevant to answer the query:
---
${retrievedContext}
---`;

    // Step 3: Stream response from local WebGPU
    setStatus("Thinking...");
    let aiResponse = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const chunks = await engine.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userText }
      ],
      stream: true,
    });

    for await (const chunk of chunks) {
      const content = chunk.choices[0]?.delta?.content || "";
      aiResponse += content;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = aiResponse;
        return updated;
      });
    }

    // Step 4: Automatically persist this conversation fragment to LanceDB so it remembers it later!
    await ragManager.ingestDocument(`User said: ${userText}\nAssistant replied: ${aiResponse}`, { timestamp: Date.now() });
    setStatus("System Fully Autonomous");
  };

  return (
    // Your beautiful premium custom UI goes here, mapping out the messages array seamlessly.
    <div className="bg-black text-white h-screen">...</div>
  );
}
