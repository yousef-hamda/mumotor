import { ShaderCanvas } from '../lib/ShaderCanvas';

// A glass lens that refracts and warps whatever is behind it, splitting white
// light into R/G/B via per-channel offset (chromatic dispersion) plus a Fresnel
// rim. 2D approximation in raw WebGL (no three.js). The lens follows the cursor.
const FRAG = `
vec3 scene(vec2 uv){
  float t = u_reduced > 0.5 ? 0.0 : u_time * 0.1;
  vec2 q = vec2(fbm(uv * 2.5 + t), fbm(uv * 2.5 - t + 3.1));
  float f = fbm(uv * 2.5 + 3.0 * q);
  vec3 a = vec3(0.05, 0.18, 0.45);
  vec3 b = vec3(0.4, 0.7, 1.0);
  vec3 c = vec3(0.7, 0.45, 1.0);
  vec3 col = mix(a, b, clamp(f * 1.3, 0.0, 1.0));
  col = mix(col, c, clamp(length(q) * 0.9, 0.0, 1.0));
  // a few crisp light streaks so refraction is legible
  col += 0.15 * smoothstep(0.49, 0.5, fract(uv.x * 6.0 + f));
  return col;
}
void main(){
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 uv = vUv;
  vec2 m = u_mouse.x < 0.0
    ? vec2(0.5 + 0.16 * sin(u_time * 0.6), 0.5 + 0.12 * cos(u_time * 0.5))
    : u_mouse;
  vec2 d = (uv - m) * vec2(aspect, 1.0);
  float dist = length(d);
  float R = 0.26;
  vec3 col;
  if (dist < R) {
    float h = sqrt(max(R * R - dist * dist, 0.0)) / R;   // lens height 0..1
    vec2 n = normalize(d + 1e-5);
    float bend = pow(1.0 - h, 1.5) * 0.16;
    vec3 disp = vec3(1.06, 1.0, 0.94) * bend;             // wavelength-dependent IOR
    float r = scene(uv - n * disp.r).r;
    float g = scene(uv - n * disp.g).g;
    float b = scene(uv - n * disp.b).b;
    col = vec3(r, g, b);
    float fres = pow(1.0 - h, 3.0);                       // Fresnel rim
    col += fres * 0.6;
    col += smoothstep(0.0, 0.6, h) * 0.05;                // faint body sheen
  } else {
    col = scene(uv);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function GlassDispersion() {
  return (
    <div className="relative h-[460px] w-full cursor-none" style={{ background: '#08122a' }}>
      <ShaderCanvas className="absolute inset-0" frag={FRAG} />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/60">
        Move your cursor — the glass refracts &amp; splits the light behind it
      </div>
    </div>
  );
}
