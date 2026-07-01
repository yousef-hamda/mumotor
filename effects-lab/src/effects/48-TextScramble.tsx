import { useEffect, useRef, useState } from 'react';
import { useStageReveal } from '../lib/useStageReveal';

const CHARS = '!<>-_\\/[]{}—=+*^?#________';

// Text resolves from a flicker of random glyphs into the final words, settling
// left-to-right like a terminal decoding. Fires once on enter, restrained.
function Scramble({ text, className, play }: { text: string; className?: string; play: boolean }) {
  const [out, setOut] = useState(text);
  const raf = useRef(0);
  useEffect(() => {
    if (!play) { setOut(' '.repeat(text.length)); return; }
    const start = performance.now();
    const dur = 900;
    const seeds = text.split('').map((_, i) => i / text.length);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      let s = '';
      for (let i = 0; i < text.length; i++) {
        if (p > seeds[i] + 0.25) s += text[i];
        else if (p < seeds[i]) s += ' ';
        else s += CHARS[(Math.floor(now / 40) + i) % CHARS.length];
      }
      setOut(s);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [play, text]);
  return <span className={className}>{out}</span>;
}

export default function TextScramble() {
  const { ref, revealed: play } = useStageReveal<HTMLDivElement>(0.6);
  return (
    <div ref={ref} className="grid h-[440px] w-full place-items-center" style={{ background: '#06070d' }}>
      <div className="text-center font-mono">
        <Scramble key={play ? 'a' : 'b'} text="PASS FIRST TIME" play={play} className="text-4xl font-bold tracking-tight text-white sm:text-5xl" />
        <div className="mt-4">
          <Scramble text="Tel Aviv · Haifa · Jerusalem" play={play} className="text-sm tracking-widest text-accent" />
        </div>
        <p className="mt-10 text-xs text-white/30">Scroll inside this frame (down to decode, up to replay).</p>
      </div>
    </div>
  );
}
