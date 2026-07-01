import { motion } from 'framer-motion';
import { DRIVE_IMAGES } from '../assets/images';
import { useStageReveal } from '../lib/useStageReveal';

// Images aren't faded in — they're unmasked by an animating clip-path polygon
// wipe as they enter view. The hard masked edge (vs opacity) is the craft.
const CLIPS = [
  { from: 'inset(0 100% 0 0)', to: 'inset(0 0% 0 0)' },        // wipe →
  { from: 'inset(100% 0 0 0)', to: 'inset(0% 0 0 0)' },        // wipe ↓
  { from: 'inset(0 0 0 100%)', to: 'inset(0 0 0 0%)' },        // wipe ←
];

export default function ClipPathReveal() {
  const { ref, revealed } = useStageReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="grid h-[440px] w-full place-items-center p-6" style={{ background: '#06070d' }}>
      <div className="grid w-full max-w-3xl grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl">
            <motion.img
              src={DRIVE_IMAGES[i + 1]}
              alt=""
              className="h-[260px] w-full object-cover"
              initial={false}
              animate={{ clipPath: revealed ? CLIPS[i].to : CLIPS[i].from, scale: revealed ? 1 : 1.15 }}
              transition={{ duration: 0.9, delay: revealed ? i * 0.12 : 0, ease: [0.65, 0, 0.35, 1] }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
