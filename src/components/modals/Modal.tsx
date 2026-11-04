'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalOverlayClass } from './modalStack';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentClassName?: string;
  overlayZIndexClass?: string;
}
export default function Modal({
  isOpen,
  onClose,
  children,
  contentClassName,
  overlayZIndexClass,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={modalOverlayClass(overlayZIndexClass)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={contentClassName ?? 'w-full max-w-4xl bg-white rounded-lg shadow-xl'}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
