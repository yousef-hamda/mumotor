import type { ComponentType } from 'react';
import ShaderLetters from '../effects/01-ShaderLetters';
import HolographicCard from '../effects/02-HolographicCard';
import FluidCursor from '../effects/03-FluidCursor';
import MagicMove from '../effects/04-MagicMove';
import ScrollShaderTransition from '../effects/05-ScrollShaderTransition';
import BayerGradient from '../effects/06-BayerGradient';
import VariableFontProximity from '../effects/07-VariableFontProximity';
import MorphingDrawer from '../effects/08-MorphingDrawer';
import ScrollVelocityDistortion from '../effects/09-ScrollVelocityDistortion';
import GooeyNav from '../effects/10-GooeyNav';
import ImageTrail from '../effects/11-ImageTrail';
// Tier A
import AsciiHalftone from '../effects/12-AsciiHalftone';
import GlassDispersion from '../effects/14-GlassDispersion';
import ParticleMorph from '../effects/18-ParticleMorph';
import ImageDisplaceHover from '../effects/22-ImageDisplaceHover';
import MeshGradient from '../effects/23-MeshGradient';
import RaymarchCrystal from '../effects/27-RaymarchCrystal';
import Gallery3D from '../effects/13-Gallery3D';
import PinnedScrolly from '../effects/15-PinnedScrolly';
import ViewTransition from '../effects/16-ViewTransition';
import ConicBorderGlow from '../effects/17-ConicBorderGlow';
import SkewMarquee from '../effects/19-SkewMarquee';
import MagneticButtons from '../effects/20-MagneticButtons';
import ScrubCanvasSequence from '../effects/21-ScrubCanvasSequence';
import MagneticCursor from '../effects/24-MagneticCursor';
import DotGridShockwave from '../effects/25-DotGridShockwave';
import CurtainTransition from '../effects/26-CurtainTransition';
// Tier B
import ScrollMoodShader from '../effects/31-ScrollMoodShader';
import GrainOverlay from '../effects/40-GrainOverlay';
import Metaballs from '../effects/41-Metaballs';
import FilmicPost from '../effects/47-FilmicPost';
import HorizontalPinned from '../effects/29-HorizontalPinned';
import MaskedLineReveal from '../effects/32-MaskedLineReveal';
import StickyStack from '../effects/33-StickyStack';
import ClipPathReveal from '../effects/38-ClipPathReveal';
import BlurFocusText from '../effects/45-BlurFocusText';
import PreloaderHandoff from '../effects/52-PreloaderHandoff';
import StrokeDrawText from '../effects/53-StrokeDrawText';
import ScrollRouteLine from '../effects/54-ScrollRouteLine';
import CssScrollDriven from '../effects/57-CssScrollDriven';
import TiltDepth from '../effects/28-TiltDepth';
import InfiniteCanvas from '../effects/30-InfiniteCanvas';
import ScrollSkewList from '../effects/34-ScrollSkewList';
import SpringDrag from '../effects/35-SpringDrag';
import WordMorph from '../effects/36-WordMorph';
import LampReveal from '../effects/37-LampReveal';
import DifferenceCursor from '../effects/39-DifferenceCursor';
import Odometer from '../effects/42-Odometer';
import SpotlightCards from '../effects/43-SpotlightCards';
import BentoEntrance from '../effects/44-BentoEntrance';
import GsapFlip from '../effects/46-GsapFlip';
import TextScramble from '../effects/48-TextScramble';
import ContextualCursor from '../effects/49-ContextualCursor';
import FlashlightReveal from '../effects/50-FlashlightReveal';
import CharSpring from '../effects/51-CharSpring';
import ToastStack from '../effects/55-ToastStack';
import CommandMenu from '../effects/56-CommandMenu';
import SquashRipple from '../effects/58-SquashRipple';
import Css3DHeadline from '../effects/59-Css3DHeadline';

export type Tier = 'S' | 'A' | 'B';

export type EffectMeta = {
  rank: number;
  id: string;
  tier: Tier;
  /** Stage height in px (stable layout + lazy placeholder). */
  h: number;
  /** Full title shown on the stage. */
  name: string;
  /** Short title for the index nav. */
  short: string;
  score: number;
  difficulty: 'low' | 'med' | 'high';
  /** One-paragraph explanation under the title. */
  blurb: string;
  /** Optional usage hint ("how to drive it"). */
  hint?: string;
  Component: ComponentType;
};

export const EFFECTS: EffectMeta[] = [
  {
    rank: 1,
    id: 'shader-letters',
    tier: 'S',
    h: 440,
    name: 'Shader-displaced letters',
    short: 'Shader letters',
    score: 96,
    difficulty: 'high',
    blurb:
      'The headline lives on a GPU surface — as your cursor sweeps over it the letters ripple, peel and smear, splitting into red/green/blue fringes around the pointer. True shader physics, impossible to fake in CSS.',
    hint: 'Move your cursor across the words.',
    Component: ShaderLetters,
  },
  {
    rank: 2,
    id: 'holographic-card',
    tier: 'S',
    h: 460,
    name: 'Holographic foil card',
    short: 'Holographic card',
    score: 95,
    difficulty: 'high',
    blurb:
      'A card that behaves like real trading-card foil: tilt it and a rainbow sheen, metallic sparkle flakes and a bright glare hot-spot all slide across the surface at different speeds — a physical, light-reactive object.',
    hint: 'Hover and move over the card to tilt it.',
    Component: HolographicCard,
  },
  {
    rank: 3,
    id: 'fluid-cursor',
    tier: 'S',
    h: 460,
    name: 'WebGL fluid / ink cursor',
    short: 'Fluid cursor',
    score: 95,
    difficulty: 'high',
    blurb:
      'A real-time GPU fluid simulation you stir like ink in water — your cursor injects velocity into a dye field that swirls, blooms and dissipates. The Cuberto / Active-Theory signature.',
    hint: 'Drag your cursor through the panel.',
    Component: FluidCursor,
  },
  {
    rank: 4,
    id: 'magic-move',
    tier: 'S',
    h: 560,
    name: 'Magic-move morph (shared element)',
    short: 'Magic-move morph',
    score: 95,
    difficulty: 'high',
    blurb:
      'A package card does not “open” a page — it physically becomes the detail view, its rectangle stretching and unfolding in place, then collapsing back into the card. The identity-defining motion of iOS, Linear and Vercel.',
    hint: 'Click any card, then click the backdrop to close.',
    Component: MagicMove,
  },
  {
    rank: 5,
    id: 'scroll-transition',
    tier: 'S',
    h: 480,
    name: 'Scroll-triggered shader transition',
    short: 'Scroll transition',
    score: 94,
    difficulty: 'high',
    blurb:
      'One image dissolves into the next through a GPU displacement / expanding-noise threshold — the transition shape itself becomes brand identity. Driven by scroll progress (or the slider).',
    hint: 'Scroll through this section, or drag the slider.',
    Component: ScrollShaderTransition,
  },
  {
    rank: 6,
    id: 'bayer-gradient',
    tier: 'S',
    h: 440,
    name: 'Bayer-dithered gradient',
    short: 'Bayer dither',
    score: 92,
    difficulty: 'med',
    blurb:
      'A slow aurora gradient quantized through an ordered Bayer matrix so it breaks into crisp retro dot-banding instead of smooth blending — the hottest 2025–26 background look, tactile and instantly “designed”.',
    hint: 'Click to send a ripple through the dither.',
    Component: BayerGradient,
  },
  {
    rank: 7,
    id: 'variable-font',
    tier: 'S',
    h: 440,
    name: 'Cursor-proximity variable font',
    short: 'Variable font',
    score: 92,
    difficulty: 'med',
    blurb:
      'Each letter continuously interpolates its weight and width by distance to the cursor — the type fattens and stretches as the pointer sweeps past, “breathing” around your mouse while staying real and selectable.',
    hint: 'Move your cursor across the headline.',
    Component: VariableFontProximity,
  },
  {
    rank: 8,
    id: 'morphing-drawer',
    tier: 'S',
    h: 460,
    name: 'Family-style morphing drawer',
    short: 'Morphing drawer',
    score: 92,
    difficulty: 'high',
    blurb:
      'A single panel that reshapes its own height to fit each view while the old content blurs out and the new blurs in during the resize — so navigating feels like one living surface, not a screen swap.',
    hint: 'Step through the booking views with the buttons.',
    Component: MorphingDrawer,
  },
  {
    rank: 9,
    id: 'scroll-velocity',
    tier: 'S',
    h: 440,
    name: 'Scroll-velocity fluid distortion',
    short: 'Scroll velocity',
    score: 94,
    difficulty: 'high',
    blurb:
      'The canvas reacts to how fast you scroll — quick flicks smear it with chromatic aberration and a liquid vertical warp, which springs back to rest when you stop. Momentum has consequence.',
    hint: 'Scroll the page fast, then slow — watch it smear and settle.',
    Component: ScrollVelocityDistortion,
  },
  {
    rank: 10,
    id: 'gooey-nav',
    tier: 'S',
    h: 440,
    name: 'Gooey / liquid nav indicator',
    short: 'Gooey nav',
    score: 90,
    difficulty: 'med',
    blurb:
      'The active-tab indicator behaves like a blob of mercury: as it slides between items it stretches, necks, pinches off and re-coalesces — surface-tension physics instead of a rigid sliding pill.',
    hint: 'Click between the tabs and watch the blob merge.',
    Component: GooeyNav,
  },
  {
    rank: 11,
    id: 'image-trail',
    tier: 'S',
    h: 460,
    name: 'WebGL-style image-trail hover',
    short: 'Image trail',
    score: 90,
    difficulty: 'med',
    blurb:
      'As your cursor moves across the panel it flings out a ribbon of photos that scale in and dissolve behind the pointer — velocity-aware, so fast flicks throw more images. The defining agency-portfolio interaction.',
    hint: 'Sweep your cursor across the panel.',
    Component: ImageTrail,
  },

  // ---------------- TIER A ----------------
  {
    rank: 12, id: 'ascii-halftone', tier: 'A', h: 440,
    name: 'Real-time ASCII / halftone', short: 'ASCII / halftone', score: 90, difficulty: 'med',
    blurb: 'A live colour field re-rendered on the GPU as a grid of procedurally-drawn ASCII glyphs whose density tracks luminance — CRT-era nostalgia meets modern shaders, with strong editorial identity.',
    hint: 'It animates on its own.',
    Component: AsciiHalftone,
  },
  {
    rank: 14, id: 'glass-dispersion', tier: 'A', h: 460,
    name: 'Glass dispersion / refraction', short: 'Glass dispersion', score: 88, difficulty: 'high',
    blurb: 'A glass lens that refracts and warps whatever is behind it, splitting white light into red/green/blue at the edges (wavelength-dependent IOR) with a Fresnel rim — the Apple/Rivian “liquid glass” material.',
    hint: 'Move your cursor — the lens follows.',
    Component: GlassDispersion,
  },
  {
    rank: 18, id: 'particle-morph', tier: 'A', h: 440,
    name: 'Particle morphing', short: 'Particle morph', score: 87, difficulty: 'high',
    blurb: 'Thousands of particles flow and re-form between shapes — here cycling through words — lerping between target point-clouds. Cinematic and alive; your cursor pushes them aside.',
    hint: 'Move your cursor through the particles.',
    Component: ParticleMorph,
  },
  {
    rank: 22, id: 'image-displace-hover', tier: 'A', h: 460,
    name: 'Image displacement + RGB-shift hover', short: 'Displace hover', score: 86, difficulty: 'med',
    blurb: 'Hover a photo and it morphs into another via a displacement map, with a directional RGB-channel split (chromatic aberration along the cursor vector) — glitchy, liquid, expensive-feeling reveals.',
    hint: 'Hover the image.',
    Component: ImageDisplaceHover,
  },
  {
    rank: 23, id: 'mesh-gradient', tier: 'A', h: 440,
    name: 'WebGL mesh-gradient background', short: 'Mesh gradient', score: 86, difficulty: 'low',
    blurb: 'The Stripe-style flowing multi-colour gradient, elevated with domain warping (noise fed back into noise) for marbled, liquid colour, finished with film grain. The gold-standard ambient background.',
    hint: 'It breathes on its own.',
    Component: MeshGradient,
  },
  {
    rank: 27, id: 'raymarch-crystal', tier: 'A', h: 460,
    name: 'Raymarched SDF crystal', short: 'Raymarch SDF', score: 85, difficulty: 'high',
    blurb: 'A full 3D iridescent crystal defined entirely by signed-distance fields and rendered by marching rays in one fragment shader — tiny payload, real lighting and Fresnel from maths alone.',
    hint: 'It rotates on its own.',
    Component: RaymarchCrystal,
  },
  {
    rank: 13, id: 'gallery-3d', tier: 'A', h: 480,
    name: 'Scroll-warped 3D gallery', short: '3D gallery', score: 89, difficulty: 'high',
    blurb: 'Photos mounted on a perspective curve that bend away in 3D with depth-blur on the off-centre cards — a spatial gallery, not a flat slider. (CSS-3D approximation; true three.js is a follow-up.)',
    hint: 'Drag the cards, or use the arrows.',
    Component: Gallery3D,
  },
  {
    rank: 15, id: 'pinned-scrolly', tier: 'A', h: 520,
    name: 'Pinned scrollytelling (element morph)', short: 'Scrollytelling', score: 88, difficulty: 'high',
    blurb: 'A device pins and, as you scrub, rotates while its screen morphs through a storyboard of states — the signature Apple/Locomotive narrative format.',
    hint: 'Scroll through, or drag the scrubber.',
    Component: PinnedScrolly,
  },
  {
    rank: 16, id: 'view-transition', tier: 'A', h: 520,
    name: 'View Transitions shared-element morph', short: 'View transitions', score: 88, difficulty: 'med',
    blurb: 'Click a card and its image IS the next view’s hero — it morphs position, size and radius across the swap via the native View Transitions API (cross-browser since late 2025), with a fade fallback.',
    hint: 'Click a card, then “Back”.',
    Component: ViewTransition,
  },
  {
    rank: 17, id: 'conic-border-glow', tier: 'A', h: 440,
    name: 'Cursor-following conic border glow', short: 'Conic border glow', score: 88, difficulty: 'med',
    blurb: 'A thin band of light rides each card’s border, rotating to point toward the cursor — the Cursor.com / Linear-era signature. The conic gradient is masked to just the 1px ring.',
    hint: 'Sweep your cursor across the grid.',
    Component: ConicBorderGlow,
  },
  {
    rank: 19, id: 'skew-marquee', tier: 'A', h: 440,
    name: 'Velocity-reactive skew marquee', short: 'Skew marquee', score: 87, difficulty: 'low',
    blurb: 'Looping rows of type that accelerate and skew with your scroll velocity, reverse with direction, and spring back to a cruise when you stop — kinetic-poster energy.',
    hint: 'Scroll the page to drive the rows.',
    Component: SkewMarquee,
  },
  {
    rank: 20, id: 'magnetic-buttons', tier: 'A', h: 440,
    name: 'Magnetic / gravity buttons', short: 'Magnetic buttons', score: 86, difficulty: 'low',
    blurb: 'Buttons (and their labels, independently) lean toward the cursor as it approaches, then spring back — the UI feels aware of you. The label parallaxes further than the pill for depth.',
    hint: 'Hover near the buttons.',
    Component: MagneticButtons,
  },
  {
    rank: 21, id: 'scrub-canvas', tier: 'A', h: 480,
    name: 'Scroll-scrubbed canvas sequence', short: 'Scrubbed sequence', score: 86, difficulty: 'med',
    blurb: 'A frame sequence painted to canvas where scroll position chooses the frame — a cinematic shot you control. Here, a procedurally-drawn drive down a road (the Apple-AirPods pattern).',
    hint: 'Scroll the page, or drag the scrubber.',
    Component: ScrubCanvasSequence,
  },
  {
    rank: 24, id: 'magnetic-cursor', tier: 'A', h: 440,
    name: 'Magnetic cursor → target shape', short: 'Magnetic cursor', score: 87, difficulty: 'med',
    blurb: 'A custom cursor that is magnetically pulled toward interactive elements and morphs into their bounding shape — stretching into a pill over a button, squaring over a card.',
    hint: 'Move toward the buttons.',
    Component: MagneticCursor,
  },
  {
    rank: 25, id: 'dot-grid-shockwave', tier: 'A', h: 440,
    name: 'Reactive dot-grid + shockwave', short: 'Dot-grid shockwave', score: 85, difficulty: 'med',
    blurb: 'A field of dots that scale and brighten near the cursor and, on click, send a shockwave ripple radiating through the grid with inertia — a calm background that becomes a toy.',
    hint: 'Move over it, then click.',
    Component: DotGridShockwave,
  },
  {
    rank: 26, id: 'curtain-transition', tier: 'A', h: 460,
    name: 'Curtain / panel page transition', short: 'Curtain transition', score: 85, difficulty: 'med',
    blurb: 'Full-height panels sweep across to cover the screen, the “page” swaps behind them, then they split apart on a different easing — a theatrical curtain between routes.',
    hint: 'Click the tabs to switch pages.',
    Component: CurtainTransition,
  },

  // ---------------- TIER B ----------------
  {
    rank: 31, id: 'scroll-mood', tier: 'B', h: 440,
    name: 'Scroll-reactive mood shader', short: 'Scroll mood', score: 84, difficulty: 'med',
    blurb: 'Scroll velocity drives the shader’s palette and distortion — calm blue at rest, warm and rippling when you move fast, decaying naturally when you stop. The page feels like one reactive material.',
    hint: 'Scroll the page fast, then stop.',
    Component: ScrollMoodShader,
  },
  {
    rank: 40, id: 'grain-overlay', tier: 'B', h: 440,
    name: 'Animated grain / dither overlay', short: 'Grain overlay', score: 81, difficulty: 'low',
    blurb: 'A faint, animated film-grain texture over a gradient that flickers like 16mm — the 2025–26 “texture over flat digital” move. Subtle motion is what makes a minimal surface feel art-directed.',
    hint: 'Toggle the grain on/off.',
    Component: GrainOverlay,
  },
  {
    rank: 41, id: 'metaballs', tier: 'B', h: 440,
    name: 'Metaballs / gooey blobs', short: 'Metaballs', score: 81, difficulty: 'med',
    blurb: 'Droplet-like blobs that merge and separate with surface-tension goo, blended via a thresholded distance field — liquid-mercury motion that’s mesmerising and hard to fake in CSS.',
    hint: 'Move your cursor among the blobs.',
    Component: Metaballs,
  },
  {
    rank: 47, id: 'filmic-post', tier: 'B', h: 440,
    name: 'Filmic post stack', short: 'Filmic post', score: 80, difficulty: 'med',
    blurb: 'A full-screen post layer over a photo — lens fringing toward the edges, film grain, vignette and bloom — the “expensive” finish that separates agency work from template work.',
    hint: 'It runs continuously.',
    Component: FilmicPost,
  },
  {
    rank: 29, id: 'horizontal-pinned', tier: 'B', h: 480,
    name: 'Horizontal-on-vertical pinned scroll', short: 'Horizontal pinned', score: 84, difficulty: 'med',
    blurb: 'You scroll down and the content slides sideways — a horizontal panel sequence — then releases to vertical. A direction-flip that reframes the whole layout.',
    hint: 'Scroll, or drag the scrubber.',
    Component: HorizontalPinned,
  },
  {
    rank: 32, id: 'masked-line-reveal', tier: 'B', h: 440,
    name: 'Masked line-clip text reveal', short: 'Line reveal', score: 84, difficulty: 'low',
    blurb: 'Lines of a heading rise from behind a hard mask edge with a tailored stagger — the single most recognizable “premium agency site” move, done with per-line masking (not a fade).',
    hint: 'Scroll it in and out of view.',
    Component: MaskedLineReveal,
  },
  {
    rank: 33, id: 'sticky-stack', tier: 'B', h: 480,
    name: 'Sticky stacking cards', short: 'Sticky stack', score: 83, difficulty: 'med',
    blurb: 'Full cards stack into a depth-stacked deck as you scroll — each scales up to the front while the previous recedes and dims beneath it. A storytelling staple of 2025.',
    hint: 'Scroll, or drag the scrubber.',
    Component: StickyStack,
  },
  {
    rank: 38, id: 'clip-path-reveal', tier: 'B', h: 440,
    name: 'Clip-path image unmask', short: 'Clip-path reveal', score: 82, difficulty: 'low',
    blurb: 'Images aren’t faded in — they’re unmasked by an animating clip-path wipe with a crisp moving edge, each on its own direction. Directional and editorial.',
    hint: 'Scroll it in and out of view.',
    Component: ClipPathReveal,
  },
  {
    rank: 45, id: 'blur-focus-text', tier: 'B', h: 460,
    name: 'Blur-to-sharp focus-pull text', short: 'Blur focus', score: 84, difficulty: 'low',
    blurb: 'Words enter soft and defocused, then pull into razor-sharp clarity word-by-word as you scroll — a camera rack-focus. Exactly on-brand for an Apple-minimal system.',
    hint: 'Scroll slowly through the words.',
    Component: BlurFocusText,
  },
  {
    rank: 52, id: 'preloader-handoff', tier: 'B', h: 460,
    name: 'Preloader → hero handoff', short: 'Preloader handoff', score: 80, difficulty: 'med',
    blurb: 'The loader doesn’t just fade — it hands off: the counter climbs, the panel lifts like a curtain, and the hero’s headline staggers in on the same beat. Choreography, not a spinner.',
    hint: 'Click “Replay intro”.',
    Component: PreloaderHandoff,
  },
  {
    rank: 53, id: 'stroke-draw-text', tier: 'B', h: 440,
    name: 'SVG stroke-draw → fill', short: 'Stroke-draw text', score: 80, difficulty: 'med',
    blurb: 'Letters write themselves — outlined strokes trace on as if drawn by an invisible pen, then flood-fill with colour. Sharp at any resolution, bespoke and signature.',
    hint: 'Scroll it in and out of view.',
    Component: StrokeDrawText,
  },
  {
    rank: 54, id: 'scroll-route-line', tier: 'B', h: 460,
    name: 'Scroll-driven route line', short: 'Route line', score: 80, difficulty: 'low',
    blurb: 'A driving “route” line draws itself toward your licence as you scroll, lighting up each milestone — compositor-friendly stroke-dashoffset, and genuinely on-theme for mumotor.',
    hint: 'Scroll the page to draw the route.',
    Component: ScrollRouteLine,
  },
  {
    rank: 57, id: 'css-scroll-driven', tier: 'B', h: 560,
    name: 'CSS scroll-driven animations', short: 'CSS scroll-driven', score: 80, difficulty: 'low',
    blurb: 'Native CSS ties keyframes to scroll — reveals and a progress bar — on the compositor thread with zero JavaScript, via animation-timeline: view()/scroll(). The modern 2025–26 move.',
    hint: 'Scroll to reveal the rows.',
    Component: CssScrollDriven,
  },
  {
    rank: 28, id: 'tilt-depth', tier: 'B', h: 440,
    name: 'Cursor-aware 3D tilt + depth', short: 'Tilt depth', score: 84, difficulty: 'low',
    blurb: 'A card tilts toward the cursor while its inner layers float at different translateZ depths — a real diorama, not a flat plane tipping — finished with a glare that tracks the pointer.',
    hint: 'Hover and move over the card.',
    Component: TiltDepth,
  },
  {
    rank: 30, id: 'infinite-canvas', tier: 'B', h: 460,
    name: 'Draggable infinite canvas', short: 'Infinite canvas', score: 84, difficulty: 'high',
    blurb: 'A FigJam-style infinite plane you drag to pan and scroll to zoom, with content scattered in 2D space — explorable spatial navigation instead of a vertical scroll.',
    hint: 'Drag to pan · scroll to zoom.',
    Component: InfiniteCanvas,
  },
  {
    rank: 34, id: 'scroll-skew-list', tier: 'B', h: 440,
    name: 'Scroll-velocity skew (DOM)', short: 'Scroll skew', score: 83, difficulty: 'low',
    blurb: 'Content skews and stretches in the scroll direction proportional to speed, then springs back flat when you stop — the cheapest "expensive-feeling" effect, all in the DOM.',
    hint: 'Scroll the page fast.',
    Component: ScrollSkewList,
  },
  {
    rank: 35, id: 'spring-drag', tier: 'B', h: 440,
    name: 'Spring-physics drag + rubber-band', short: 'Spring drag', score: 82, difficulty: 'med',
    blurb: 'Throwable chips that keep gliding with momentum, decelerate naturally, and rubber-band off the edges — the velocity-aware inertial physics of native touch UIs.',
    hint: 'Fling the chips around.',
    Component: SpringDrag,
  },
  {
    rank: 36, id: 'word-morph', tier: 'B', h: 440,
    name: 'Word morphing (gooey)', short: 'Word morph', score: 86, difficulty: 'med',
    blurb: 'One word melts and reforms into the next — two blurred layers merging under an SVG goo threshold, like liquid metal cycling through your value props.',
    hint: 'It cycles on its own.',
    Component: WordMorph,
  },
  {
    rank: 37, id: 'lamp-reveal', tier: 'B', h: 440,
    name: 'Lamp / beam light reveal', short: 'Lamp reveal', score: 82, difficulty: 'low',
    blurb: 'Two angled conic beams converge into a glowing filament line that ignites, and the heading fades up out of the light — the Linear signature header that "turns on".',
    hint: 'Scroll it in and out of view.',
    Component: LampReveal,
  },
  {
    rank: 39, id: 'difference-cursor', tier: 'B', h: 440,
    name: 'mix-blend-mode difference cursor', short: 'Difference cursor', score: 81, difficulty: 'low',
    blurb: 'A white blob that auto-inverts whatever’s beneath it via mix-blend-mode: difference — perfect contrast over black, white or photos — expanding into a labelled disc over targets.',
    hint: 'Move across the light/dark split.',
    Component: DifferenceCursor,
  },
  {
    rank: 42, id: 'odometer', tier: 'B', h: 440,
    name: 'Odometer / rolling number ticker', short: 'Odometer', score: 80, difficulty: 'low',
    blurb: 'Stats count up by physically rolling each digit on a spring-driven reel — far beyond a setInterval count-up — firing when they scroll into view.',
    hint: 'Scroll it in and out of view.',
    Component: Odometer,
  },
  {
    rank: 43, id: 'spotlight-cards', tier: 'B', h: 440,
    name: 'Spotlight glow-follow cards', short: 'Spotlight cards', score: 80, difficulty: 'low',
    blurb: 'A soft radial spotlight rides the cursor across a grid, lighting up each card’s border and a faint inner glow as you pass — subtle, restrained, very Linear/Vercel.',
    hint: 'Sweep your cursor over the cards.',
    Component: SpotlightCards,
  },
  {
    rank: 44, id: 'bento-entrance', tier: 'B', h: 440,
    name: 'Bento-grid entrance choreography', short: 'Bento entrance', score: 80, difficulty: 'low',
    blurb: 'A bento layout whose tiles cascade in with a directional stagger (scale + blur-in + translate), reading top-left → bottom-right, then settle — the 2026 minimum for bento.',
    hint: 'Scroll it in and out of view.',
    Component: BentoEntrance,
  },
  {
    rank: 46, id: 'gsap-flip', tier: 'B', h: 480,
    name: 'GSAP Flip grid → detail', short: 'GSAP Flip', score: 84, difficulty: 'med',
    blurb: 'Click a thumbnail and GSAP Flip records first/last states and inverts the delta — so it animates flawlessly into a full detail layout even as the grid reflows around it.',
    hint: 'Click a tile, then click it again.',
    Component: GsapFlip,
  },
  {
    rank: 48, id: 'text-scramble', tier: 'B', h: 440,
    name: 'Text scramble / decode', short: 'Text scramble', score: 80, difficulty: 'low',
    blurb: 'Text resolves from a flicker of random glyphs into the final words, settling left-to-right like a terminal decoding — confident and technical when kept to short labels.',
    hint: 'Scroll it in and out of view.',
    Component: TextScramble,
  },
  {
    rank: 49, id: 'contextual-cursor', tier: 'B', h: 440,
    name: 'Contextual cursor labels', short: 'Contextual cursor', score: 80, difficulty: 'med',
    blurb: 'The cursor expands into a filled disc carrying a context word — VIEW over projects, PLAY over video, DRAG over sliders — making the cursor a UX affordance system, not decoration.',
    hint: 'Move over the different zones.',
    Component: ContextualCursor,
  },
  {
    rank: 50, id: 'flashlight-reveal', tier: 'B', h: 440,
    name: 'Flashlight reveal cursor', short: 'Flashlight cursor', score: 80, difficulty: 'low',
    blurb: 'The page sits under a dark veil and the cursor carries a soft radial flashlight that reveals the hidden layer beneath — suspense and narrative via a CSS mask.',
    hint: 'Move your cursor to shine the torch.',
    Component: FlashlightReveal,
  },
  {
    rank: 51, id: 'char-spring', tier: 'B', h: 440,
    name: 'Per-character spring stagger', short: 'Char spring', score: 81, difficulty: 'low',
    blurb: 'Letters pop in individually on a spring with a touch of overshoot and rotation, cascading across the word so it bounces into place with personality — not a uniform fade-up.',
    hint: 'Scroll it in and out of view.',
    Component: CharSpring,
  },
  {
    rank: 55, id: 'toast-stack', tier: 'B', h: 440,
    name: 'Toast / notification choreography', short: 'Toast stack', score: 80, difficulty: 'med',
    blurb: 'Stacked toasts behave like a deck: new ones push in with a spring, older ones scale down in 3D depth, and hover expands the whole stack into a readable list. A motion system, not isolated fade-ins.',
    hint: 'Trigger a few, then hover the stack.',
    Component: ToastStack,
  },
  {
    rank: 56, id: 'command-menu', tier: 'B', h: 440,
    name: '⌘K command-menu motion', short: 'Command menu', score: 80, difficulty: 'med',
    blurb: 'As you type, results re-rank with layout animation and a highlight pill morphs (layoutId) to follow the selected row — the Linear/Raycast signature that makes search feel like it thinks.',
    hint: 'Type to filter; ↑/↓ to move.',
    Component: CommandMenu,
  },
  {
    rank: 58, id: 'squash-ripple', tier: 'B', h: 440,
    name: 'Elastic squash + ripple click', short: 'Squash + ripple', score: 80, difficulty: 'low',
    blurb: 'On press, an element briefly squashes then overshoots back through a spring — Disney’s squash-&-stretch with restraint — plus a ripple that originates exactly at the click point.',
    hint: 'Click the buttons.',
    Component: SquashRipple,
  },
  {
    rank: 59, id: 'css-3d-headline', tier: 'B', h: 440,
    name: 'CSS-3D extruded headline', short: '3D headline', score: 82, difficulty: 'med',
    blurb: 'A headline with extruded depth from layered shadows that rotates toward the cursor. (Dependency-free CSS-3D approximation of Troika SDF text; a real three.js build is a follow-up.)',
    hint: 'Move your cursor to rotate it.',
    Component: Css3DHeadline,
  },
];

export const TIER_ORDER: Tier[] = ['S', 'A', 'B'];
export const byTier = (t: Tier) => EFFECTS.filter((e) => e.tier === t).sort((a, b) => a.rank - b.rank);
