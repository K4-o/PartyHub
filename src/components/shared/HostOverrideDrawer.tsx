import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Sliders } from 'lucide-react';

interface Props {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function HostOverrideDrawer({ title, children, defaultOpen = false }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-4xl mx-auto px-4">
        {/* Toggle tab */}
        <div className="flex justify-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-5 py-2 bg-slate-900 border-t border-x border-slate-700 rounded-t-2xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-2xl"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold">{title}</span>
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Drawer Body */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden bg-slate-900/95 border-t border-slate-700/80 backdrop-blur-xl rounded-t-3xl p-5 shadow-2xl"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
