import { useScrollProgress } from '../lib/useScrollProgress';
import { clamp } from '../lib/raf';

const TEXT = 'We turn nervous beginners into calm, confident, licence-ready drivers — one patient lesson at a time.';

// Words enter soft and defocused, then pull into razor-sharp clarity word-by-word
// as you scroll through — a camera rack-focus (Apple-style, scroll-linked).
export default function BlurFocusText() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const words = TEXT.split(' ');
  // map scroll progress 0.15..0.85 across the words
  const p = clamp((progress - 0.15) / 0.7);

  return (
    <div ref={ref} className="grid h-[460px] w-full place-items-center px-8" style={{ background: 'radial-gradient(120% 120% at 50% 30%, #0e1530, #06070d)' }}>
      <p className="max-w-2xl text-center text-2xl font-semibold leading-snug text-white sm:text-3xl">
        {words.map((w, i) => {
          const wp = i / words.length;
          const local = clamp((p - wp) * words.length * 1.4 + 0.5); // 0 (blurred) → 1 (sharp)
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: '0.28em',
                filter: `blur(${(1 - local) * 12}px)`,
                opacity: 0.2 + local * 0.8,
                transform: `translateY(${(1 - local) * 8}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </p>
    </div>
  );
}
