"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cake, Sparkles } from "lucide-react";
import { BRANDING, brandName } from "@/lib/branding";
import { BRANDS } from "@/lib/brands";

export function SplashScreen({ duration = 2000 }: { duration?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-orange-700 via-orange-800 to-amber-900 fixed inset-0 z-[100] flex flex-col items-center justify-center text-white"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 14 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
              <div className="relative grid size-20 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/30 backdrop-blur-md">
                <Cake className="size-10 text-white" />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                {BRANDING.product.name}
              </h1>
              <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-white/80">
                <span>{BRANDS.MARKETING.emoji} {BRANDS.MARKETING.shortName}</span>
                <span className="text-white/40" aria-hidden>·</span>
                <span>{BRANDS.INSTITUTE.emoji} {BRANDS.INSTITUTE.shortName}</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-10 flex flex-col items-center gap-1 text-xs text-white/70"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> {BRANDING.product.poweredBy}
            </span>
            <span>
              Designed &amp; Developed for{" "}
              <span className="font-semibold text-white">{brandName}</span>
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
