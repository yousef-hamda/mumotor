/**
 * FluidSim — a compact GPU fluid (Navier–Stokes) solver in raw WebGL1.
 * Condensed from the well-known Pavel Dobryakov "WebGL Fluid Simulation" approach:
 * advection → curl → vorticity → divergence → Jacobi pressure → gradient subtract → display.
 * Scoped to a single canvas; pointer splats inject velocity + dye.
 *
 * Returns null from create() if half-float render targets aren't available
 * (caller then shows a CSS fallback).
 */

type FBO = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
};
type DoubleFBO = {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
};

const BASE_VERTEX = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv, vL, vR, vT, vB;
uniform vec2 texelSize;
void main(){
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const F = (body: string) => `precision highp float; precision highp sampler2D; varying vec2 vUv, vL, vR, vT, vB;\n${body}`;

const COPY = F(`uniform sampler2D uTexture; void main(){ gl_FragColor = texture2D(uTexture, vUv); }`);
const CLEAR = F(`uniform sampler2D uTexture; uniform float value; void main(){ gl_FragColor = value * texture2D(uTexture, vUv); }`);
const SPLAT = F(`
uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
void main(){
  vec2 p = vUv - point.xy; p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}`);
const ADVECTION = F(`
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation;
void main(){
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  gl_FragColor = dissipation * texture2D(uSource, coord);
  gl_FragColor.a = 1.0;
}`);
const DIVERGENCE = F(`
uniform sampler2D uVelocity;
void main(){
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`);
const CURL = F(`
uniform sampler2D uVelocity;
void main(){
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`);
const VORTICITY = F(`
uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
void main(){
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture2D(uVelocity, vUv).xy;
  gl_FragColor = vec4(clamp(vel + force * dt, -1000.0, 1000.0), 0.0, 1.0);
}`);
const PRESSURE = F(`
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main(){
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`);
const GRAD_SUB = F(`
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main(){
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 vel = texture2D(uVelocity, vUv).xy;
  vel -= vec2(R - L, T - B);
  gl_FragColor = vec4(vel, 0.0, 1.0);
}`);
const DISPLAY = F(`
uniform sampler2D uTexture;
void main(){
  vec3 c = texture2D(uTexture, vUv).rgb;
  float a = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c, a);
}`);

const CONFIG = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 512,
  PRESSURE_ITERATIONS: 18,
  CURL: 26,
  VELOCITY_DISSIPATION: 0.985,
  DENSITY_DISSIPATION: 0.975,
  SPLAT_RADIUS: 0.0035,
};

export type Fluid = {
  step: (dt: number) => void;
  splat: (x: number, y: number, dx: number, dy: number, color: [number, number, number]) => void;
  resize: () => void;
  destroy: () => void;
};

export function createFluid(canvas: HTMLCanvasElement): Fluid | null {
  const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
  const gl = (canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params)) as WebGLRenderingContext | null;
  if (!gl) return null;

  const halfFloat = gl.getExtension('OES_texture_half_float');
  const supportLinear = gl.getExtension('OES_texture_half_float_linear');
  if (!halfFloat) return null;
  const HALF = halfFloat.HALF_FLOAT_OES;
  gl.clearColor(0, 0, 0, 1);

  // Verify we can actually render to a half-float target (some drivers lie).
  const testFilter = supportLinear ? gl.LINEAR : gl.NEAREST;

  function compileShader(type: number, source: string): WebGLShader | null {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, source);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      if (import.meta.env.DEV) console.warn('[FluidSim] shader error', gl!.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  function program(vs: string, fs: string) {
    const p = gl!.createProgram()!;
    const v = compileShader(gl!.VERTEX_SHADER, vs);
    const f = compileShader(gl!.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    gl!.attachShader(p, v);
    gl!.attachShader(p, f);
    // Force aPosition to attribute location 0 — blit() uses a fixed
    // vertexAttribPointer(0, …) for every program, so the mapping must match.
    gl!.bindAttribLocation(p, 0, 'aPosition');
    gl!.linkProgram(p);
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) return null;
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const count = gl!.getProgramParameter(p, gl!.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const name = gl!.getActiveUniform(p, i)!.name;
      uniforms[name] = gl!.getUniformLocation(p, name);
    }
    return { program: p, uniforms };
  }

  const progs = {
    copy: program(BASE_VERTEX, COPY),
    clear: program(BASE_VERTEX, CLEAR),
    splat: program(BASE_VERTEX, SPLAT),
    advection: program(BASE_VERTEX, ADVECTION),
    divergence: program(BASE_VERTEX, DIVERGENCE),
    curl: program(BASE_VERTEX, CURL),
    vorticity: program(BASE_VERTEX, VORTICITY),
    pressure: program(BASE_VERTEX, PRESSURE),
    gradient: program(BASE_VERTEX, GRAD_SUB),
    display: program(BASE_VERTEX, DISPLAY),
  };
  if (Object.values(progs).some((p) => !p)) return null;

  // fullscreen triangle/quad
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const idx = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  function blit(target: FBO | null) {
    if (target) {
      gl!.viewport(0, 0, target.width, target.height);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo);
    } else {
      gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    }
    gl!.drawElements(gl!.TRIANGLES, 6, gl!.UNSIGNED_SHORT, 0);
  }

  function createFBO(w: number, h: number, filter: number): FBO {
    gl!.activeTexture(gl!.TEXTURE0);
    const texture = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, w, h, 0, gl!.RGBA, HALF, null);
    const fbo = gl!.createFramebuffer()!;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);
    gl!.viewport(0, 0, w, h);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    return {
      texture, fbo, width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h,
      attach(id: number) { gl!.activeTexture(gl!.TEXTURE0 + id); gl!.bindTexture(gl!.TEXTURE_2D, texture); return id; },
    };
  }
  function createDoubleFBO(w: number, h: number, filter: number): DoubleFBO {
    let fbo1 = createFBO(w, h, filter);
    let fbo2 = createFBO(w, h, filter);
    return {
      width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h,
      get read() { return fbo1; },
      get write() { return fbo2; },
      swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; },
    } as DoubleFBO;
  }
  // Confirm the FBO is framebuffer-complete; if not, half-float RTT is unusable.
  {
    const probe = createFBO(4, 4, testFilter);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.deleteFramebuffer(probe.fbo);
    gl.deleteTexture(probe.texture);
    if (!ok) return null;
  }

  function getResolution(resolution: number) {
    let aspect = gl!.drawingBufferWidth / gl!.drawingBufferHeight;
    if (aspect < 1) aspect = 1 / aspect;
    const min = Math.round(resolution);
    const max = Math.round(resolution * aspect);
    return gl!.drawingBufferWidth > gl!.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
  }

  let dye: DoubleFBO, velocity: DoubleFBO, divergence: FBO, curl: FBO, pressure: DoubleFBO;
  function initFramebuffers() {
    const simRes = getResolution(CONFIG.SIM_RESOLUTION);
    const dyeRes = getResolution(CONFIG.DYE_RESOLUTION);
    const filter = testFilter;
    dye = createDoubleFBO(dyeRes.width, dyeRes.height, filter);
    velocity = createDoubleFBO(simRes.width, simRes.height, filter);
    divergence = createFBO(simRes.width, simRes.height, gl!.NEAREST);
    curl = createFBO(simRes.width, simRes.height, gl!.NEAREST);
    pressure = createDoubleFBO(simRes.width, simRes.height, gl!.NEAREST);
  }
  initFramebuffers();

  const use = (p: { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> }) => {
    gl!.useProgram(p.program);
    return p.uniforms;
  };

  function step(dt: number) {
    gl!.disable(gl!.BLEND);
    // curl
    let u = use(progs.curl!);
    gl!.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(u.uVelocity, velocity.read.attach(0));
    blit(curl);
    // vorticity
    u = use(progs.vorticity!);
    gl!.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(u.uVelocity, velocity.read.attach(0));
    gl!.uniform1i(u.uCurl, curl.attach(1));
    gl!.uniform1f(u.curl, CONFIG.CURL);
    gl!.uniform1f(u.dt, dt);
    blit(velocity.write); velocity.swap();
    // divergence
    u = use(progs.divergence!);
    gl!.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(u.uVelocity, velocity.read.attach(0));
    blit(divergence);
    // clear pressure
    u = use(progs.clear!);
    gl!.uniform1i(u.uTexture, pressure.read.attach(0));
    gl!.uniform1f(u.value, 0.8);
    blit(pressure.write); pressure.swap();
    // pressure solve
    u = use(progs.pressure!);
    gl!.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(u.uDivergence, divergence.attach(0));
    for (let i = 0; i < CONFIG.PRESSURE_ITERATIONS; i++) {
      gl!.uniform1i(u.uPressure, pressure.read.attach(1));
      blit(pressure.write); pressure.swap();
    }
    // gradient subtract
    u = use(progs.gradient!);
    gl!.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(u.uPressure, pressure.read.attach(0));
    gl!.uniform1i(u.uVelocity, velocity.read.attach(1));
    blit(velocity.write); velocity.swap();
    // advect velocity
    u = use(progs.advection!);
    gl!.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(u.uVelocity, velocity.read.attach(0));
    gl!.uniform1i(u.uSource, velocity.read.attach(0));
    gl!.uniform1f(u.dt, dt);
    gl!.uniform1f(u.dissipation, CONFIG.VELOCITY_DISSIPATION);
    blit(velocity.write); velocity.swap();
    // advect dye
    gl!.uniform1i(u.uVelocity, velocity.read.attach(0));
    gl!.uniform1i(u.uSource, dye.read.attach(1));
    gl!.uniform1f(u.dissipation, CONFIG.DENSITY_DISSIPATION);
    blit(dye.write); dye.swap();
    // display
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    u = use(progs.display!);
    gl!.uniform1i(u.uTexture, dye.read.attach(0));
    blit(null);
  }

  function splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]) {
    const aspect = canvas.width / canvas.height;
    // velocity
    let u = use(progs.splat!);
    gl!.uniform1i(u.uTarget, velocity.read.attach(0));
    gl!.uniform1f(u.aspectRatio, aspect);
    gl!.uniform2f(u.point, x, y);
    gl!.uniform3f(u.color, dx, dy, 0);
    gl!.uniform1f(u.radius, CONFIG.SPLAT_RADIUS);
    blit(velocity.write); velocity.swap();
    // dye
    gl!.uniform1i(u.uTarget, dye.read.attach(0));
    gl!.uniform3f(u.color, color[0], color[1], color[2]);
    blit(dye.write); dye.swap();
  }

  function resize() {
    const w = gl!.drawingBufferWidth, h = gl!.drawingBufferHeight;
    if (!w || !h) return;
    initFramebuffers();
  }

  function destroy() {
    // StrictMode is disabled, so this only runs on real unmount — free the GPU
    // context so LazyStage can keep the concurrent-context count low.
    const lose = gl!.getExtension('WEBGL_lose_context');
    lose?.loseContext();
  }

  return { step, splat, resize, destroy };
}
