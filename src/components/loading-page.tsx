import { useEffect, type ReactNode } from "react";
import { motion } from "motion/react";

export function LoadingPage({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border border-border" />
          <div className="absolute inset-0 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </motion.div>
      {children}
    </div>
  );
}
