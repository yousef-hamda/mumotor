import { useEffect, useRef, useState } from 'react';
import { useScrollProgress } from '../lib/useScrollProgress';

const PATH = 'M 40 230 C 160 230, 160 70, 300 70 S 460 200, 560 150 S 720 40, 770 90';
const STOPS = [
  { t: 0.0, label: 'Sign up' },
  { t: 0.34, label: 'First lesson' },
  { t: 0.66, label: 'Mock test' },
  { t: 1.0, label: 'Pass 🎉' },
];

export default function ScrollRouteLine() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(1);
  const [car, setCar] = useState({ x: 40, y: 230 });

  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, []);
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const pt = path.getPointAtLength(Math.max(0.001, progress) * len);
    setCar({ x: pt.x, y: pt.y });
  }, [progress, len]);

  const ptAt = (t: number) => (pathRef.current ? pathRef.current.getPointAtLength(t * len) : { x: 0, y: 0 });

  return (
    <div ref={ref} className="grid h-[460px] w-full place-items-center px-6" style={{ background: 'radial-gradient(130% 130% at 50% 0%, #0d1426, #06070d)' }}>
      <div className="w-full max-w-2xl">
        <svg viewBox="0 0 810 300" className="w-full">
          {/* faint full route */}
          <path d={PATH} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />
          {/* drawn portion */}
          <path
            ref={pathRef}
            d={PATH}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - progress)}
            style={{ filter: 'drop-shadow(0 0 6px rgba(94,168,242,0.6))' }}
          />
          {/* stops */}
          {STOPS.map((s, i) => {
            const p = ptAt(s.t);
            const reached = progress >= s.t - 0.01;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={reached ? 8 : 6} fill={reached ? 'var(--accent)' : '#1a2030'} stroke="#0a0d14" strokeWidth="3" />
                <text x={p.x} y={p.y - 16} textAnchor="middle" fill={reached ? '#fff' : 'rgba(255,255,255,0.4)'} fontSize="13" fontWeight="600">{s.label}</text>
              </g>
            );
          })}
          {/* car marker */}
          <circle cx={car.x} cy={car.y} r="7" fill="#fff" />
        </svg>
        <p className="mt-4 text-center text-xs text-white/40">Scroll the page — the route draws itself toward your licence.</p>
      </div>
    </div>
  );
}
