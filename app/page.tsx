"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { setupUlbrichtProtocol } from "@/security/ulbrichtProtocol";

export default function SpatialInterface() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [leftSheetOpen, setLeftSheetOpen] = useState(false);
  const [rightSheetOpen, setRightSheetOpen] = useState(false);

  useEffect(() => {
    // Initialize motion-sensor lockdown
    const cleanup = setupUlbrichtProtocol();
    return cleanup;
  }, []);

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden text-white flex flex-col">
      {/* LAYER 1: The AI Workspace (Background Canvas) */}
      <div className="absolute inset-0 z-0 p-6 flex flex-col justify-center items-center">
        <h1 className="text-4xl font-light text-white/50 tracking-widest uppercase">The Void</h1>
        <p className="text-sm text-white/30 mt-2">Local AI Workspace (Awaiting Initialization)</p>
      </div>

      {/* LAYER 2: The Orbs / Spatial Chat Morphing */}
      <div className="absolute inset-x-0 top-1/4 h-64 z-10 pointer-events-none flex justify-between px-8">
        <AnimatePresence>
          {activeChat !== "peer1" && (
            <motion.div
              layoutId="chat-peer1"
              className="w-16 h-16 rounded-full glass-panel cursor-pointer pointer-events-auto shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              onClick={() => setActiveChat("peer1")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Morphed Chat Panel (Takes bottom 50%) */}
      <AnimatePresence>
        {activeChat && (
          <motion.div
            layoutId={`chat-${activeChat}`}
            className="absolute bottom-0 left-0 right-0 h-[55dvh] glass-panel rounded-t-[2.5rem] z-20 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) {
                setActiveChat(null);
              }
            }}
          >
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <p className="text-white/50 text-sm text-center">Encrypted Peer-to-Peer Session established.</p>
              {/* Chat bubbles will go here */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLASSMORPHIC EDGE TRIGGERS */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-6 z-30 touch-none"
        onPointerDown={(e) => {
           // Primitive edge swipe detection (in a real app, use useDrag or similar)
           setLeftSheetOpen(true);
        }}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-6 z-30 touch-none"
        onPointerDown={(e) => {
           setRightSheetOpen(true);
        }}
      />

      {/* Edge Sheets */}
      <AnimatePresence>
        {leftSheetOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute left-0 top-0 bottom-0 w-3/4 max-w-sm glass-panel border-r border-white/10 z-40 p-6"
          >
            <button className="text-white/50 mb-8" onClick={() => setLeftSheetOpen(false)}>Close</button>
            <h2 className="text-xl font-light">Photo Gallery</h2>
          </motion.div>
        )}
        {rightSheetOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm glass-panel border-l border-white/10 z-40 p-6"
          >
            <button className="text-white/50 mb-8" onClick={() => setRightSheetOpen(false)}>Close</button>
            <h2 className="text-xl font-light">Local File Explorer</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DYNAMIC INPUT SANDBOX */}
      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="glass-panel rounded-full h-14 flex items-center px-6">
          <input 
            type="text" 
            placeholder="Message or command (^ for emojis)..." 
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/30"
          />
        </div>
      </div>
    </main>
  );
}
