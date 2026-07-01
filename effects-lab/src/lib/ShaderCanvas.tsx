/**
 * ShaderCanvas — raw-WebGL fullscreen-quad renderer, adapted from mumotor's
 * templates/webgl/ShaderBackground.tsx and extended for the effects lab:
 *  - built-in uniforms: u_time / u_resolution / u_dpr / u_mouse / u_reduced /
 *    u_progress / u_velocity
 *  - per-frame custom scalar/vec uniforms via `uniforms()` getter
 *  - texture uploads via `textures` (image src or a live <canvas>/<img>),
 *    exposed as u_tex0, u_tex1, … plus u_tex0_res (vec2 natural size)
 * Perf/a11y safe: DPR ≤ 1.75, pauses offscreen (IntersectionObserver) + when the
 * tab is hidden, reduced-motion renders a single static frame, and on WebGL
 * failure it hides the canvas so a CSS fallback shows through.
 */
import { useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { SHADER_HEADER } from './shaderHeader';

const VERT = `
attribute vec2 a_pos;
varying vec2 vUv;
void main(){ vUv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }
`;
const MAX_DPR = 1.75;

export type TexSource = string | HTMLCanvasElement | HTMLImageElement;
type UniformValue = number | number[];

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // Surface shader errors during dev so we can fix them quickly.
    if (import.meta.env.DEV) console.warn('[ShaderCanvas] compile error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function setUniform(gl: WebGLRenderingContext, loc: WebGLUniformLocation, v: UniformValue) {
  if (typeof v === 'number') gl.uniform1f(loc, v);
  else if (v.length === 2) gl.uniform2f(loc, v[0], v[1]);
  else if (v.length === 3) gl.uniform3f(loc, v[0], v[1], v[2]);
  else if (v.length === 4) gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
}

export function ShaderCanvas({
  frag,
  className,
  speed = 1,
  uniforms,
  textures,
  trackMouse = true,
  mouseEase = 0.12,
}: {
  frag: string;
  className?: string;
  speed?: number;
  /** Called every frame; return extra uniforms to set (must be declared in `frag`). */
  uniforms?: () => Record<string, UniformValue>;
  /** Textures → u_tex0, u_tex1, … (+ u_texN_res vec2). */
  textures?: TexSource[];
  trackMouse?: boolean;
  mouseEase?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  // Keep the latest uniforms getter without restarting the GL program.
  const uniformsRef = useRef(uniforms);
  uniformsRef.current = uniforms;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // Declared first so drawFrame's closure can never hit it in the temporal dead zone.
    let disposed = false;
    const fail = () => { canvas.style.display = 'none'; };
    const gl = (canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext('experimental-webgl', { antialias: false, alpha: true })) as WebGLRenderingContext | null;
    if (!gl) { fail(); return; }

    const program = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, SHADER_HEADER + frag);
    if (!program || !vs || !fs) { fail(); return; }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { fail(); return; }
    canvas.style.display = 'block';
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = {
      time: gl.getUniformLocation(program, 'u_time'),
      res: gl.getUniformLocation(program, 'u_resolution'),
      dpr: gl.getUniformLocation(program, 'u_dpr'),
      mouse: gl.getUniformLocation(program, 'u_mouse'),
      reduced: gl.getUniformLocation(program, 'u_reduced'),
    };
    // Cache custom uniform locations lazily.
    const customLoc = new Map<string, WebGLUniformLocation | null>();
    const locOf = (name: string) => {
      if (!customLoc.has(name)) customLoc.set(name, gl.getUniformLocation(program, name));
      return customLoc.get(name) ?? null;
    };

    // ---- textures ----
    type Tex = { tex: WebGLTexture; res: [number, number]; el?: HTMLCanvasElement | HTMLImageElement; dynamic: boolean };
    const texList: Tex[] = [];
    const makeTex = (): WebGLTexture => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      // 1px placeholder until the image loads.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 22, 30, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    };
    (textures ?? []).forEach((src, i) => {
      const t = makeTex();
      const entry: Tex = { tex: t, res: [1, 1], dynamic: typeof src !== 'string' };
      texList.push(entry);
      if (typeof src === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          entry.res = [img.naturalWidth, img.naturalHeight];
          if (!running) drawFrame(0);
        };
        img.src = src;
      } else {
        entry.el = src;
        entry.res = [src.width || 1, src.height || 1];
      }
      void i;
    });
    const uploadDynamic = () => {
      for (let i = 0; i < texList.length; i++) {
        const e = texList[i];
        if (!e.el) continue;
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, e.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, e.el);
          e.res = [e.el.width || 1, e.el.height || 1];
        } catch { /* element not ready */ }
      }
    };
    const bindTextures = () => {
      for (let i = 0; i < texList.length; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texList[i].tex);
        const sLoc = locOf(`u_tex${i}`);
        if (sLoc) gl.uniform1i(sLoc, i);
        const rLoc = locOf(`u_tex${i}_res`);
        if (rLoc) gl.uniform2f(rLoc, texList[i].res[0], texList[i].res[1]);
      }
    };

    // ---- mouse (smoothed, normalized, origin bottom-left) ----
    const mouse = { tx: -1, ty: -1, x: -1, y: -1, inside: false };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
      mouse.inside = true;
    };
    const onLeave = () => { mouse.inside = false; mouse.tx = -1; mouse.ty = -1; };
    if (trackMouse) {
      canvas.parentElement?.addEventListener('pointermove', onMove);
      canvas.parentElement?.addEventListener('pointerleave', onLeave);
    }

    let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (U.res) gl.uniform2f(U.res, canvas.width, canvas.height);
      if (U.dpr) gl.uniform1f(U.dpr, dpr);
    };

    const drawFrame = (tSec: number) => {
      // Guard against deferred callbacks (texture onload, timers) firing after
      // cleanup — under StrictMode a stale run must not draw into the live
      // context with its own (now-detached) program/uniform locations.
      if (disposed) return;
      gl.useProgram(program);
      // ease mouse toward target
      if (mouse.x < 0 && mouse.inside) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.x += (mouse.tx - mouse.x) * mouseEase;
      mouse.y += (mouse.ty - mouse.y) * mouseEase;
      if (U.time) gl.uniform1f(U.time, tSec);
      if (U.reduced) gl.uniform1f(U.reduced, reduced ? 1 : 0);
      if (U.mouse) gl.uniform2f(U.mouse, mouse.inside ? mouse.x : -1, mouse.inside ? mouse.y : -1);
      const extra = uniformsRef.current?.();
      if (extra) for (const k in extra) { const l = locOf(k); if (l) setUniform(gl, l, extra[k]); }
      if (texList.length) { uploadDynamic(); bindTextures(); }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    resize();

    let raf = 0, running = false, visible = true, start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      drawFrame(((now - start) / 1000) * speed);
      raf = requestAnimationFrame(tick);
    };
    const play = () => {
      if (running || reduced || !visible || document.hidden) return;
      running = true; raf = requestAnimationFrame(tick);
    };
    const pause = () => { running = false; cancelAnimationFrame(raf); };

    drawFrame(0);
    const timers = [60, 250, 600].map((ms) => window.setTimeout(() => { if (!running) drawFrame(0); }, ms));

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { resize(); if (!running) drawFrame(0); }) : null;
    ro?.observe(canvas);
    const io = new IntersectionObserver((es) => { visible = es[0]?.isIntersecting ?? true; if (visible) play(); else pause(); }, { threshold: 0 });
    io.observe(canvas);
    const onVis = () => { if (document.hidden) pause(); else play(); };
    document.addEventListener('visibilitychange', onVis);
    const onLost = (e: Event) => { e.preventDefault(); pause(); };
    canvas.addEventListener('webglcontextlost', onLost as EventListener, false);

    if (!reduced) play();

    return () => {
      disposed = true;
      pause();
      timers.forEach(clearTimeout);
      ro?.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost as EventListener);
      if (trackMouse) {
        canvas.parentElement?.removeEventListener('pointermove', onMove);
        canvas.parentElement?.removeEventListener('pointerleave', onLeave);
      }
      // Free the GPU context on unmount. StrictMode is disabled (see main.tsx),
      // so this only runs on a real unmount — e.g. when LazyStage unmounts an
      // off-screen effect — keeping concurrent WebGL contexts well under the limit.
      const lose = gl.getExtension('WEBGL_lose_context');
      lose?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frag, speed, reduced]);

  return <canvas ref={ref} className={className} aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }} />;
}
