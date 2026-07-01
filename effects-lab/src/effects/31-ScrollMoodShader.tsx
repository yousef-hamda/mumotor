import { useRef } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { useStageScroll } from '../lib/stageScroll';

// A generative field whose mood shifts with scroll velocity: calm blue at rest,
// warm and energetic (with ripple distortion) when you scroll fast. Decays back.
const FRAG = `
void main(){
  vec2 uv = vUv;
  float v = abs(u_velocity);
  float t = u_reduced > 0.5 ? 0.0 : u_time * 0.2;
  // velocity-driven wobble
  uv.x += sin(uv.y * 8.0 + u_time * 3.0) * v * 0.03;
  uv.y += cos(uv.x * 8.0 - u_time * 2.0) * v * 0.02;
  float n = fbm(uv * 3.0 + vec2(t, t * 0.7));
  n += 0.4 * fbm(uv * 6.0 - t);
  // calm palette
  vec3 calm = mix(vec3(0.03, 0.08, 0.2), vec3(0.2, 0.5, 0.9), n);
  // energetic palette
  vec3 hot = mix(vec3(0.25, 0.05, 0.15), vec3(1.0, 0.45, 0.2), n);
  float mood = clamp(v * 0.8, 0.0, 1.0);
  vec3 col = mix(calm, hot, mood);
  // chromatic split at high velocity
  col.r += v * 0.12 * sin(uv.y * 30.0);
  col.b += v * 0.10 * cos(uv.x * 30.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function ScrollMoodShader() {
  const track = useRef({ lastY: typeof window !== 'undefined' ? window.scrollY : 0, vel: 0 });
  const stage = useStageScroll();
  return (
    <div className="relative h-[440px] w-full" style={{ background: '#06070d' }}>
      <ShaderCanvas
        className="absolute inset-0"
        trackMouse={false}
        frag={FRAG}
        uniforms={() => {
          if (stage) return { u_velocity: Math.max(-2, Math.min(2, stage.velocityRef.current / 70)) };
          const y = window.scrollY;
          const dy = y - track.current.lastY;
          track.current.lastY = y;
          track.current.vel += (dy - track.current.vel) * 0.2;
          return { u_velocity: Math.max(-2, Math.min(2, track.current.vel / 30)) };
        }}
      />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/60">
        Scroll fast — the mood shifts warm and ripples, then cools back to calm
      </div>
    </div>
  );
}
