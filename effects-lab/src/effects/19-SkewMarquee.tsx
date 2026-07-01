import { Marquee } from '../components/Marquee';

const ROW1 = ['MANUAL', 'AUTOMATIC', 'TEST-READY', 'PASS FIRST TIME', 'MOTORWAY', 'PARKING'];
const ROW2 = ['Tel Aviv', 'Haifa', 'Jerusalem', 'Beer Sheva', 'Netanya', 'Eilat'];

function Word({ children, faded }: { children: React.ReactNode; faded?: boolean }) {
  return (
    <span className={`mx-6 text-5xl font-bold tracking-tight sm:text-6xl ${faded ? 'text-white/15' : 'text-white'}`}>
      {children}
      <span className="mx-6 text-accent">✦</span>
    </span>
  );
}

export default function SkewMarquee() {
  return (
    <div className="flex h-[440px] w-full flex-col justify-center gap-6" style={{ background: '#06070d' }}>
      <Marquee baseVelocity={3}>{ROW1.map((w) => <Word key={w}>{w}</Word>)}</Marquee>
      <Marquee baseVelocity={-2.2}>{ROW2.map((w) => <Word key={w} faded>{w}</Word>)}</Marquee>
      <p className="px-8 text-center text-xs text-white/40">Scroll the page — the rows accelerate and skew with your velocity, then settle.</p>
    </div>
  );
}
