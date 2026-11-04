'use client'

import { X } from 'lucide-react'
import Modal from '@/components/modals/Modal'

const VIDEO_SRC = 'https://www.youtube.com/embed/eqssV1NLnzk?si=bx6SblMaiINXj3-q'

export default function ConoceloModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="relative w-full max-w-4xl overflow-hidden rounded-lg bg-neutral-950 shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="aspect-video w-full overflow-hidden bg-black">
        {isOpen && (
          <iframe
            src={VIDEO_SRC}
            title="Centro de distribución Intercap"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
      </div>
    </Modal>
  )
}
