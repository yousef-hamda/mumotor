import { ShaderCanvas } from '../lib/ShaderCanvas';

// Stripe-style flowing mesh gradient, elevated with domain warping (noise fed
// back into noise coords) for marbled, liquid colour, finished with film grain.
const FRAG = `
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
void main(){
  vec2 uv = vUv;
  float t = u_reduced > 0.5 ? 0.0 : u_time * 0.12;
  // domain warp
  vec2 q = vec2(fbm(uv * 2.0 + t), fbm(uv * 2.0 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(uv * 2.0 + 4.0 * q + vec2(1.7, 9.2)), fbm(uv * 2.0 + 4.0 * q + vec2(8.3, 2.8)));
  float f = fbm(uv * 2.0 + 4.0 * r);
  vec3 col = mix(u_c1, u_c2, clamp(f * 1.4, 0.0, 1.0));
  col = mix(col, u_c3, clamp(length(q), 0.0, 1.0));
  col = mix(col, u_c2, smoothstep(0.6, 1.0, r.x));
  // film grain
  float g = hash21(gl_FragCoord.xy + fract(u_time));
  col += (g - 0.5) * 0.05;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function MeshGradient() {
  return (
    <div className="relative h-[440px] w-full" style={{ background: 'linear-gradient(135deg,#10204a,#3a1a5a)' }}>
      <ShaderCanvas
        className="absolute inset-0"
        trackMouse={false}
        speed={1}
        frag={FRAG}
        uniforms={() => ({ u_c1: [0.06, 0.22, 0.55], u_c2: [0.36, 0.66, 0.96], u_c3: [0.62, 0.4, 0.95] })}
      />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/60">
        Domain-warped WebGL mesh gradient + film grain
      </div>
    </div>
  );
}
