/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export default function Toast({ toasts, onClose }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast, onClose }: { key?: string; toast: ToastItem; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const config = {
    success: {
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      bar: "bg-emerald-500"
    },
    error: {
      bg: "bg-rose-500/10 border-rose-500/20 text-rose-300",
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      bar: "bg-rose-500"
    },
    warning: {
      bg: "bg-amber-500/10 border-amber-500/20 text-amber-300",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      bar: "bg-amber-500"
    },
    info: {
      bg: "bg-sky-500/10 border-sky-500/20 text-sky-400",
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
      bar: "bg-sky-500"
    }
  }[toast.type];

  return (
    <motion.div
      id={`toast-${toast.id}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md ${config.bg} shadow-lg relative overflow-hidden`}
    >
      {config.icon}
      <div className="flex-1 text-sm font-medium pr-4 leading-relaxed text-slate-800 dark:text-slate-200">
        {toast.message}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-white/10 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
      {/* Progress countdown tracker bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4.5, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-1 ${config.bar}`}
      />
    </motion.div>
  );
}
