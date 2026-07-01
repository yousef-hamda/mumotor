import { ShaderCanvas } from '../lib/ShaderCanvas';

// An animated colour field re-rendered as a grid of procedurally-drawn ASCII
// glyphs whose density tracks luminance. Glyphs are decoded from 15-bit (3×5)
// patterns with mod/floor (WebGL1 has no bit ops).
const FRAG = `
uniform vec3 u_accent;
uniform vec3 u_accent2;

// 3x5 glyph: bit a = x + 3*y on/off in n
float charPix(float n, vec2 p){
  vec2 g = floor(p * vec2(3.0, 5.0));
  if (g.x < 0.0 || g.x > 2.0 || g.y < 0.0 || g.y > 4.0) return 0.0;
  float a = g.x + 3.0 * g.y;
  return mod(floor(n / pow(2.0, a)), 2.0);
}
float glyphFor(float lum, vec2 p){
  float n = 0.0;
  if (lum > 0.92) n = 32767.0;       // #
  else if (lum > 0.78) n = 4088.0;   // 8
  else if (lum > 0.62) n = 3960.0;   // o
  else if (lum > 0.46) n = 2728.0;   // x
  else if (lum > 0.32) n = 1488.0;   // +
  else if (lum > 0.20) n = 1040.0;   // :
  else if (lum > 0.09) n = 2.0;      // .
  else n = 0.0;                      // (space)
  return charPix(n, p);
}
vec3 scene(vec2 uv){
  float t = u_reduced > 0.5 ? 0.0 : u_time * 0.25;
  float n = fbm(uv * 3.0 + vec2(t, t * 0.6));
  n += 0.35 * fbm(uv * 6.0 - vec2(t * 0.7, t));
  vec3 c = mix(u_accent * 0.15, u_accent, smoothstep(0.2, 0.8, n));
  c = mix(c, u_accent2, smoothstep(0.6, 1.0, n));
  return c;
}
void main(){
  float cell = 11.0 * u_dpr;
  vec2 cellId = floor(gl_FragCoord.xy / cell);
  vec2 local = fract(gl_FragCoord.xy / cell);
  vec2 centerUv = (cellId + 0.5) * cell / u_resolution;
  vec3 col = scene(centerUv);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float on = glyphFor(lum, local);
  vec3 bg = vec3(0.02, 0.03, 0.05);
  vec3 ink = col / max(lum, 0.001) * (0.5 + 0.5 * lum);
  gl_FragColor = vec4(mix(bg, ink, on), 1.0);
}
`;

export default function AsciiHalftone() {
  return (
    <div className="relative h-[440px] w-full" style={{ background: '#060a12' }}>
      <ShaderCanvas
        className="absolute inset-0"
        trackMouse={false}
        frag={FRAG}
        uniforms={() => ({ u_accent: [0.35, 0.7, 1.0], u_accent2: [0.7, 0.5, 1.0] })}
      />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/55">
        Real-time ASCII render of a live colour field
      </div>
    </div>
  );
}
