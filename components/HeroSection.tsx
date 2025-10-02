"use client";

import { motion } from "framer-motion";
import React from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const text = "Trade on any verifiable on-chain event.".split(" ");

  return (
    <div className="h-[40rem] w-full rounded-md bg-neutral-950 relative flex flex-col items-center justify-center antialiased">
      <div className="max-w-3xl mx-auto p-4 text-center">
        <h1 className="relative z-10 text-4xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-sans font-bold">
          {text.map((word, index) => (
            <motion.span
              // biome-ignore lint/suspicious/noArrayIndexKey: <biome-ignore lint: false positive>
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="inline-block mr-2"
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <p className="text-neutral-500 max-w-lg mx-auto my-4 text-lg relative z-10">
          VeriFi is a decentralized prediction market protocol on Aptos that
          resolves trustlessly, without oracles.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Button size="lg" className="mt-4 font-bold">
            Explore Markets
          </Button>
        </motion.div>
      </div>
      <BackgroundBeams />
    </div>
  );
}
