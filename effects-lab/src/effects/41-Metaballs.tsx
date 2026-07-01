import { ShaderCanvas } from '../lib/ShaderCanvas';

// Droplet-like blobs that merge and separate with surface-tension goo, blended
// via a summed inverse-distance field thresholded into a smooth surface. One
// blob follows the cursor.
const FRAG = `
uniform vec3 u_accent;
float field(vec2 uv, vec2 c, float r){
  float d = length((uv - c) * vec2(u_resolution.x / u_resolution.y, 1.0));
  return r / (d * d + 0.0008);
}
void main(){
  vec2 uv = vUv;
  float t = u_reduced > 0.5 ? 0.5 : u_time;
  float f = 0.0;
  f += field(uv, vec2(0.5 + 0.26 * sin(t * 0.7), 0.5 + 0.2 * cos(t * 0.9)), 0.018);
  f += field(uv, vec2(0.5 + 0.3 * sin(t * 0.5 + 2.0), 0.5 + 0.24 * sin(t * 0.6)), 0.016);
  f += field(uv, vec2(0.5 + 0.22 * cos(t * 0.8 + 1.0), 0.5 + 0.28 * sin(t * 0.4 + 3.0)), 0.02);
  f += field(uv, vec2(0.5 + 0.18 * sin(t * 1.1), 0.5 - 0.22 * cos(t * 0.7)), 0.014);
  if (u_mouse.x >= 0.0) f += field(uv, u_mouse, 0.03);

  float surface = smoothstep(0.9, 1.1, f);
  float rim = smoothstep(0.7, 0.9, f) - surface;
  vec3 bg = mix(vec3(0.03, 0.04, 0.08), vec3(0.07, 0.06, 0.14), uv.y);
  vec3 body = mix(u_accent * 0.7, u_accent, smoothstep(1.0, 2.2, f));
  vec3 col = bg;
  col = mix(col, body, surface);
  col += rim * vec3(0.4, 0.6, 1.0) * 0.6;             // gooey rim glow
  col += surface * pow(max(0.0, 1.0 - length(uv - 0.5)), 2.0) * 0.15;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function Metaballs() {
  return (
    <div className="relative h-[440px] w-full" style={{ background: '#06070d' }}>
      <ShaderCanvas className="absolute inset-0" frag={FRAG} uniforms={() => ({ u_accent: [0.36, 0.66, 0.98] })} />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/60">
        Move your cursor — your blob merges and splits with the others
      </div>
    </div>
  );
}
