import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Widescreen video lightbox — a focused, cinematic overlay for the marketing
 * demo. Backdrop/Esc close, body-scroll lock, autoplays with sound on open,
 * and pauses on close. The app's generic `Modal` is capped at max-w-md, so this
 * is a dedicated 16:9 player.
 */
export function VideoLightbox({
  open,
  onClose,
  title,
  mp4,
  webm,
  poster,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  mp4: string;
  webm?: string;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Focus the close button and start playback from the top.
    closeRef.current?.focus();
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {
        /* autoplay-with-sound may be blocked — the controls still work */
      });
    }
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      videoRef.current?.pause();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-sand-950/80 p-4 backdrop-blur-md animate-fade-in sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl">
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-11 end-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 coarse:min-h-11 coarse:min-w-11 sm:-end-11 sm:-top-2"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black shadow-elevated ring-1 ring-black/40">
          <video
            ref={videoRef}
            className="aspect-video w-full bg-black"
            poster={poster}
            controls
            playsInline
            preload="metadata"
          >
            {webm && <source src={webm} type="video/webm" />}
            <source src={mp4} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>,
    document.body
  );
}
