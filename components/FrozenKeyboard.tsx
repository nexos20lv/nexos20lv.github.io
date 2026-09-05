"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  Text,
  Text3D,
} from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSeason } from "@/components/SeasonProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useActiveSection } from "@/lib/useActiveSection";
import * as THREE from "three";
import { SKILLS_GRID, type SkillIcon } from "@/lib/skills";

// Suppress non-fatal Three.js r183+ deprecation warning emitted by @react-three/fiber's
// internal loop until R3F v10 switches to THREE.Timer.
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Clock: This module has been deprecated")
    ) {
      return;
    }
    originalWarn(...args);
  };
}

// Per-section keyboard "states" — same idea as Naresh's animated-background-
// config.ts, but for our R3F keyboard. Values are tweened toward via lerp
// inside useFrame; the active section is detected via IntersectionObserver
// on elements carrying data-kb-section.
type KeyboardState = {
  yaw: number; // rotation.y
  pitch: number; // rotation.x
  roll: number; // rotation.z
  posX: number;
  posY: number;
  posZ: number;
  scale: number;
};

const SECTION_STATES: Record<string, KeyboardState> = {
  hero: {
    yaw: Math.PI * 0.15,
    pitch: Math.PI * 0.18,
    roll: Math.PI * 0.025,
    posX: 1.5,
    posY: 0,
    posZ: 0,
    scale: 1,
  },
  stack: {
    // Naresh's reference: keyboard lives in the lower-right, moderate
    // isometric tilt — enough yaw to show the left face but not so much
    // pitch that the base wall takes over the silhouette.
    yaw: Math.PI * 0.40,
    pitch: Math.PI * 0.14,
    roll: -Math.PI * -0.13,
    posX: 0,
    posY: -0.6,
    posZ: 0,
    scale: 1.3,
  },
  // Project 1 — text is left-aligned, so the keyboard slides to the RIGHT,
  // near the giant "01" watermark.
  project1: {
    yaw: 0,
    pitch: 0.7,
    roll: 0.2,
    posX: 1.5,
    posY: 0.2,
    posZ: 0,
    scale: 0.85,
  },
  // Project 2 — text is right-aligned, keyboard moves to the LEFT near "02".
  project2: {
    yaw: 0.5,
    pitch: 0.8,
    roll: -0.3,
    posX: -1.9,
    posY: 0.2,
    posZ: 0,
    scale: 0.85,
  },
  // Project 3 — left-aligned again, keyboard right.
  project3: {
    yaw: 0,
    pitch: 0.7,
    roll: 0.2,
    posX: 1.5,
    posY: 0.2,
    posZ: 0,
    scale: 0.85,
  },
  // Project 4 — right-aligned, keyboard left.
  project4: {
    yaw: 0.5,
    pitch: 0.8,
    roll: -0.3,
    posX: -1.9,
    posY: 0.2,
    posZ: 0,
    scale: 0.85,
  },
  experience: {
    yaw: Math.PI * 0.3,
    pitch: Math.PI * 0.08,
    roll: 0,
    posX: 0,
    posY: 0.05,
    posZ: 0,
    scale: 0.95,
  },
  // Contact — mirrors the hero pose (same yaw/pitch/roll and scale) but
  // pushed to the right so the "¿Hablamos?" copy can sit on the left. The
  // Keyboard component also reuses the hero-style cinematic idle swing
  // while this section is active.
  contact: {
    yaw: Math.PI * 0.15,
    pitch: Math.PI * 0.18,
    roll: Math.PI * 0.025,
    posX: 1.4,
    posY: 0,
    posZ: 0,
    scale: 1,
  },
};

// Mobile lives in the hero only (the canvas scrolls away with it), so there is
// no per-section choreography — the keyboard sits centered with a permanent
// cinematic idle swing and reacts to taps instead of hover.
const MOBILE_STATE: KeyboardState = {
  yaw: Math.PI * 0.16,
  pitch: Math.PI * 0.2,
  roll: 0.02,
  posX: 0,
  posY: 0,
  posZ: 0,
  scale: 1.55,
};



// Taglines are now resolved via the i18n dictionary (keyboard.taglines.<slug>),
// keyed by the simple-icons slug on each key. See lib/i18n.ts.

function makeRoundedRectShape(
  width: number,
  depth: number,
  cornerRadius: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const w = width / 2;
  const d = depth / 2;
  const r = Math.min(cornerRadius, w, d);
  shape.moveTo(-w + r, -d);
  shape.lineTo(w - r, -d);
  shape.quadraticCurveTo(w, -d, w, -d + r);
  shape.lineTo(w, d - r);
  shape.quadraticCurveTo(w, d, w - r, d);
  shape.lineTo(-w + r, d);
  shape.quadraticCurveTo(-w, d, -w, d - r);
  shape.lineTo(-w, -d + r);
  shape.quadraticCurveTo(-w, -d, -w + r, -d);
  return shape;
}

function createExtrudedBox(
  width: number,
  depth: number,
  height: number,
  cornerRadius: number,
  bevelSize: number,
  topScale = 1
): THREE.BufferGeometry {
  const shape = makeRoundedRectShape(width, depth, cornerRadius);
  const extrudeDepth = Math.max(0.001, height - 2 * bevelSize);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: bevelSize > 0,
    bevelThickness: bevelSize,
    bevelSize: bevelSize,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -height / 2 + bevelSize, 0);

  if (topScale !== 1) {
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y + height / 2) / height;
      const factor = THREE.MathUtils.lerp(1, topScale, t);
      pos.setX(i, pos.getX(i) * factor);
      pos.setZ(i, pos.getZ(i) * factor);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  return geometry;
}

// Render a simple-icons SVG path into a square CanvasTexture.
function makeIconTexture(
  svgPath: string,
  color: string,
  size = 256
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  const iconTargetSize = Math.round(size * 0.62);
  const scale = iconTargetSize / 24;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(scale, scale);
  ctx.translate(-12, -12);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(svgPath));
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

const SKILLS = SKILLS_GRID;

const COLS = 5;
const ROWS = 3;
const KEYCAP_SIZE = 0.4;
const KEYCAP_HEIGHT = 0.28;
const KEYCAP_TOP_SCALE = 0.78;
const COL_SPACING = 0.42;
const ROW_SPACING = 0.42;
const BASE_WIDTH = 2.4;
const BASE_DEPTH = 1.4;
const BASE_HEIGHT = 0.26;
const ICON_PLANE_SIZE = KEYCAP_SIZE * KEYCAP_TOP_SCALE * 0.78;
const PRESS_DEPTH = 0.15;

// Mechanical keyboard "tock" synthesized on the fly. Mixes a short bandpass-
// filtered noise burst (the click) with a fast low-frequency thump. One
// AudioContext per tab, lazily created on first play.
// Browsers block audio until a real user gesture (click/keydown) — pointerover
// does not count in Chrome. A one-shot unlock listener resumes the context on
// the first real interaction so every subsequent hover plays immediately.
let audioCtx: AudioContext | null = null;
let audioUnlockInstalled = false;
function installAudioUnlock() {
  if (audioUnlockInstalled || typeof window === "undefined") return;
  audioUnlockInstalled = true;
  const unlock = () => {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: false });
  window.addEventListener("keydown", unlock, { once: false });
  window.addEventListener("touchstart", unlock, { once: false });
}
// Two pre-decoded samples (press / release) — pick one at random on each
// hover for variety. Fetched + decoded once on first play; subsequent hovers
// just spawn a fresh BufferSource (cheap, can overlap).
const KEY_SOUND_URLS = [
  "/sounds/switch_press.mp3",
  "/sounds/switch_release.mp3",
] as const;
const keySoundBuffers: (AudioBuffer | null)[] = [null, null];
let keySoundsLoading: Promise<void> | null = null;
function loadKeySounds(ctx: AudioContext): Promise<void> {
  if (keySoundsLoading) return keySoundsLoading;
  keySoundsLoading = Promise.all(
    KEY_SOUND_URLS.map((url, i) =>
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((buf) => ctx.decodeAudioData(buf))
        .then((decoded) => {
          keySoundBuffers[i] = decoded;
        })
        .catch(() => {
          /* keep null; playKeyClick will pick the other sample */
        })
    )
  ).then(() => undefined);
  return keySoundsLoading;
}

function playKeyClick(seed = 0, type: "press" | "release" | "random" = "random") {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      audioCtx = new Ctor();
      installAudioUnlock();
    }
    const ctx = audioCtx;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
      return;
    }
    const trigger = () => {
      let buffer: AudioBuffer | null = null;
      if (type === "press" && keySoundBuffers[0]) {
        buffer = keySoundBuffers[0];
      } else if (type === "release" && keySoundBuffers[1]) {
        buffer = keySoundBuffers[1];
      } else {
        const available = keySoundBuffers.filter(
          (b): b is AudioBuffer => b !== null
        );
        if (available.length === 0) return;
        buffer = available[Math.floor(Math.random() * available.length)];
      }
      if (!buffer) return;

      // Per-key playback rate detune (±4%) keeps repeated presses lively.
      const detune =
        1 + (((seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.08;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = detune;
      const gain = ctx.createGain();
      gain.gain.value = type === "release" ? 0.45 : 0.7;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    };
    if (keySoundBuffers.some((b) => b !== null)) {
      trigger();
    } else {
      loadKeySounds(ctx).then(trigger);
    }
  } catch {
    // Audio failure must never break the 3D scene.
  }
}

const PHYSICAL_KEY_MAP: Record<string, string> = {
  // Numbers
  Digit1: "0-0",
  Digit2: "0-1",
  Digit3: "0-2",
  Digit4: "0-3",
  Digit5: "0-4",
  Digit6: "1-0",
  Digit7: "1-1",
  Digit8: "1-2",
  Digit9: "1-3",
  Digit0: "1-4",

  // Top row letters (QWERTY / AZERTY)
  KeyQ: "0-0",
  KeyA: "0-0",
  KeyW: "0-1",
  KeyZ: "0-1",
  KeyE: "0-2",
  KeyR: "0-3",
  KeyT: "0-4",
  KeyY: "0-4",
  KeyU: "1-0",
  KeyI: "1-1",
  KeyO: "1-2",
  KeyP: "1-3",

  // Middle row letters
  KeyS: "1-1",
  KeyD: "1-2",
  KeyF: "1-3",
  KeyG: "1-4",
  KeyH: "2-0",
  KeyJ: "2-1",
  KeyK: "2-2",
  KeyL: "2-3",
  KeyM: "2-4",

  // Bottom row letters
  KeyX: "2-1",
  KeyC: "2-2",
  KeyV: "2-3",
  KeyB: "2-4",
  KeyN: "1-3",

  // Common keys
  Space: "2-2",
  Enter: "2-4",
  Backspace: "0-4",
  Tab: "0-0",
};

function get3DKeyForEvent(e: KeyboardEvent): string | null {
  // Never intercept navigation, functional or modifier keys
  if (
    e.key === "ArrowDown" ||
    e.key === "ArrowUp" ||
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight" ||
    e.key === "PageDown" ||
    e.key === "PageUp" ||
    e.key === "Home" ||
    e.key === "End" ||
    e.key === "Escape" ||
    e.key === "Tab" ||
    e.key === "CapsLock" ||
    (e.key.startsWith("F") && e.key.length > 1)
  ) {
    return null;
  }
  if (PHYSICAL_KEY_MAP[e.code]) return PHYSICAL_KEY_MAP[e.code];
  if (e.key.length !== 1) return null;
  const char = e.key.toLowerCase();
  const code = char.charCodeAt(0) || 0;
  const index = Math.abs(code) % (ROWS * COLS);
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  return `${row}-${col}`;
}

function Keycap({
  geometry,
  position,
  isMobile,
  icon,
  onHoverChange,
  hovered,
  isPressed = false,
  highlightsRef,
  activeSectionRef,
  wavePhase,
  accent,
}: {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  isMobile: boolean;
  icon: SkillIcon;
  onHoverChange: (hovered: boolean) => void;
  hovered: boolean;
  isPressed?: boolean;
  // Reactive set of slugs to animate; read every frame so we don't force
  // re-renders when the active project changes.
  highlightsRef: React.RefObject<Set<string>>;
  // Current section id (ref so we don't re-render when it flips). Used by
  // the contact section to trigger idle random bobs.
  activeSectionRef: React.RefObject<string>;
  // Per-key phase so neighbouring highlighted keys bob out of sync and
  // look like a wave rather than a synchronised jump.
  wavePhase: number;
  // Season accent colour — highlighted keys glow in this colour, so the
  // bouncing keys feel "part of" the current theme.
  accent: string;
}) {
  const pressRef = useRef<THREE.Group>(null);
  const pressY = useRef(0);
  const liftAmp = useRef(0); // smoothed 0..1 gate for the bounce + glow
  const contactAmp = useRef(0); // smoothed 0..1 gate for the random idle bob
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const baseEmissive = 0.3;

  // Each key gets its own random frequency + phase, stable across re-renders
  // so every keycap's random bob feels independent (no synchronised wave).
  // Sampled once at mount.
  const randomBob = useMemo(
    () => ({
      freq: 0.6 + Math.random() * 0.6, // 0.6..1.2 Hz-ish
      phase: Math.random() * Math.PI * 2,
      threshold: 0.45 + Math.random() * 0.2, // 0.45..0.65 — higher = rarer pop
    }),
    []
  );

  const iconTexture = useMemo(
    () => makeIconTexture(icon.path, `#${icon.hex}`),
    [icon.path, icon.hex]
  );

  // Stable THREE.Color objects so useFrame can lerp in place (no garbage
  // per-tick). Recomputed whenever the season accent changes.
  const whiteColor = useMemo(() => new THREE.Color("#ffffff"), []);
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);
  // Tinted white for the plastic body — keeps the "white keycap with a
  // hint of the season" look without going cartoonishly saturated.
  const bodyTint = useMemo(() => {
    const c = new THREE.Color(accent);
    c.lerp(whiteColor, 0.25);
    return c;
  }, [accent, whiteColor]);

  useEffect(() => {
    return () => iconTexture.dispose();
  }, [iconTexture]);

  useFrame((state) => {
    if (!pressRef.current) return;
    const isDown = hovered || isPressed;
    const pressed = isDown ? -PRESS_DEPTH : 0;
    const t = state.clock.elapsedTime;

    // Project wave: 1 while this key's slug is in the active section's
    // highlights, fading out when it leaves. Produces the synchronised
    // travelling bounce on project sections.
    const isHighlighted =
      highlightsRef.current?.has(icon.slug) ?? false;
    liftAmp.current = THREE.MathUtils.lerp(
      liftAmp.current,
      isHighlighted ? 1 : 0,
      0.08
    );
    const bob =
      Math.sin(t * 2.2 + wavePhase) * 0.14 * liftAmp.current;

    // Contact idle: each keycap pops up at its own random cadence. We use
    // a thresholded sine so every key spends most of its time at rest and
    // only jumps briefly when its sine crosses the threshold — creates the
    // Naresh-style "random keys popping" effect without anything global.
    const isContact = activeSectionRef.current === "contact";
    contactAmp.current = THREE.MathUtils.lerp(
      contactAmp.current,
      isContact ? 1 : 0,
      0.06
    );
    const sineRaw = Math.sin(t * randomBob.freq + randomBob.phase);
    const popRaw = Math.max(0, sineRaw - randomBob.threshold);
    // Normalise the pop so keys with higher thresholds don't end up flat.
    const popNorm = popRaw / (1 - randomBob.threshold);
    const randomPop = popNorm * 0.18 * contactAmp.current;

    const target = pressed + bob + randomPop;
    pressY.current = THREE.MathUtils.lerp(pressY.current, target, 0.22);
    pressRef.current.position.y = pressY.current;

    if (matRef.current) {
      // Emissive intensity pulses with the bob so glow brightens on the
      // upswing of the wave.
      const pulse = (bob / 0.14 + 1) * 0.5; // 0..1 from the sine
      const targetIntensity = isPressed
        ? 1.25
        : baseEmissive + liftAmp.current * (0.45 + pulse * 0.55);
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity,
        targetIntensity,
        0.2
      );
      // Emissive COLOUR lerps white → season accent so highlighted keys
      // glow in the current theme (blue in winter, green in spring, …).
      matRef.current.emissive
        .copy(whiteColor)
        .lerp(accentColor, isPressed ? 1 : liftAmp.current);
      // Body tint pushes clearly toward the accent so the key reads as
      // "tinted white" (e.g. an icy blue-white in winter) rather than pure
      // plastic when lifted.
      matRef.current.color
        .copy(whiteColor)
        .lerp(bodyTint, liftAmp.current);
    }
  });

  const handleOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onHoverChange(true);
    },
    [onHoverChange]
  );
  const handleOut = useCallback(() => onHoverChange(false), [onHoverChange]);

  // Touch devices never fire hover, so on mobile we drive the same press +
  // SFX path from pointer down/up — a momentary tap-to-bounce.
  const handleDown = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onHoverChange(true);
    },
    [onHoverChange]
  );
  const handleUp = useCallback(() => onHoverChange(false), [onHoverChange]);

  const iconY = KEYCAP_HEIGHT / 2 + 0.0015;

  return (
    <group position={position}>
      <group ref={pressRef}>
        <mesh
          geometry={geometry}
          onPointerOver={isMobile ? undefined : handleOver}
          onPointerOut={isMobile ? undefined : handleOut}
          onPointerDown={isMobile ? handleDown : undefined}
          onPointerUp={isMobile ? handleUp : undefined}
          onPointerCancel={isMobile ? handleUp : undefined}
        >
          <meshPhysicalMaterial
            ref={matRef}
            color="#ffffff"
            transmission={0}
            roughness={0.32}
            clearcoat={isMobile ? 0 : 0.5}
            clearcoatRoughness={0.18}
            metalness={0}
            emissive="#ffffff"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh
          position={[0, iconY, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <planeGeometry args={[ICON_PLANE_SIZE, ICON_PLANE_SIZE]} />
          <meshBasicMaterial
            map={iconTexture}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function Keyboard({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const isMobile = mobile;
  const { palette } = useSeason();
  const { t } = useLanguage();
  const [activeSection, activeSectionRef, highlightsRef] = useActiveSection();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  // Mutable holders for the smoothed target — kept off React state so
  // useFrame can read them every tick without triggering re-renders.
  const current = useRef<KeyboardState>({ ...SECTION_STATES.hero });
  // Accumulated spin (radians) added on top of the target yaw while it
  // decays to zero — produces a flip between project sections.
  const spinRef = useRef(0);
  const prevSectionId = useRef<string>("hero");

  // When scrolling between two project sections, kick off a spin. Direction
  // alternates per target project so consecutive flips don't look identical.
  useEffect(() => {
    if (mobile) return; // no project→project flips on mobile (hero-only)
    const prev = prevSectionId.current;
    prevSectionId.current = activeSection;
    if (prev === activeSection) return;
    const wasProject = prev.startsWith("project");
    const isProject = activeSection.startsWith("project");
    if (!wasProject || !isProject) return;
    const n = parseInt(activeSection.replace("project", ""), 10) || 0;
    const dir = n % 2 === 0 ? 1 : -1;
    spinRef.current += Math.PI * 2 * dir;
  }, [activeSection, mobile]);

  // Drive global cursor + click SFX from the single Keyboard instance.
  useEffect(() => {
    document.body.style.cursor = hoveredKey ? "pointer" : "auto";
    if (hoveredKey) {
      const [row, col] = hoveredKey.split("-").map(Number);
      playKeyClick(row * COLS + col);
    }
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hoveredKey]);

  // Physical keyboard typing (Easter Egg): presses 3D keys with mechanical audio
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [typedSkill, setTypedSkill] = useState<SkillIcon | null>(null);
  const typedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside form fields or using browser shortcuts
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      if (e.repeat) return;

      const id = get3DKeyForEvent(e);
      if (!id) return;

      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      const [row, col] = id.split("-").map(Number);
      const icon = SKILLS[row]?.[col];
      if (icon) {
        setTypedSkill(icon);
        if (typedTimeoutRef.current) clearTimeout(typedTimeoutRef.current);
        typedTimeoutRef.current = setTimeout(() => {
          setTypedSkill(null);
        }, 2200);
      }

      playKeyClick(row * COLS + col, "press");
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const id = get3DKeyForEvent(e);
      if (!id) return;

      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      const [row, col] = id.split("-").map(Number);
      playKeyClick(row * COLS + col, "release");
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (typedTimeoutRef.current) clearTimeout(typedTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (ref.current) ref.current.rotation.order = "YXZ";
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const target = mobile
      ? MOBILE_STATE
      : SECTION_STATES[activeSectionRef.current] ?? SECTION_STATES.hero;
    // Frame-rate-independent lerp: ~0.06 per 16ms tick = a satisfying ease.
    const k = 1 - Math.pow(0.001, delta);
    const c = current.current;
    c.yaw = THREE.MathUtils.lerp(c.yaw, target.yaw, k);
    c.pitch = THREE.MathUtils.lerp(c.pitch, target.pitch, k);
    c.roll = THREE.MathUtils.lerp(c.roll, target.roll, k);
    c.posX = THREE.MathUtils.lerp(c.posX, target.posX, k);
    c.posY = THREE.MathUtils.lerp(c.posY, target.posY, k);
    c.posZ = THREE.MathUtils.lerp(c.posZ, target.posZ, k);
    c.scale = THREE.MathUtils.lerp(c.scale, target.scale, k);

    // Decay the project-transition spin frame-rate independently so the
    // flip settles at roughly the same pace regardless of refresh rate.
    spinRef.current *= Math.exp(-3.2 * delta);
    if (Math.abs(spinRef.current) < 0.003) spinRef.current = 0;
    // Normalised magnitude (0..1) — used for a subtle "pop" on scale & a
    // small hop on Y so the flip reads as a tiny jump-and-turn.
    const spinNorm = Math.min(1, Math.abs(spinRef.current) / (Math.PI * 2));

    // Idle motion layered on top. Hero and Contact share a wide cinematic
    // yoyo so the keyboard "shows itself"; other sections keep a quiet
    // breathing so the copy is easier to read.
    const isShowcase =
      mobile ||
      activeSectionRef.current === "hero" ||
      activeSectionRef.current === "contact";
    const yawSwing = isShowcase ? 0.5 : 0.025;
    const pitchSwing = isShowcase ? 0.07 : 0.0;
    const rollSwing = isShowcase ? 0.05 : 0.0;
    const period = isShowcase ? 9 : 20; // seconds per full cycle
    const w = (Math.PI * 2) / period;
    ref.current.rotation.y =
      c.yaw + Math.sin(t * w) * yawSwing + spinRef.current;
    ref.current.rotation.x = c.pitch + Math.sin(t * w * 0.6) * pitchSwing;
    ref.current.rotation.z = c.roll + Math.sin(t * w * 0.8) * rollSwing;
    ref.current.position.x = c.posX;
    ref.current.position.y =
      c.posY + Math.sin(t * 0.6) * 0.04 + spinNorm * 0.35;
    ref.current.position.z = c.posZ;
    ref.current.scale.setScalar(c.scale * (1 - spinNorm * 0.12));
  });

  const keycapGeom = useMemo(
    () =>
      createExtrudedBox(
        KEYCAP_SIZE,
        KEYCAP_SIZE,
        KEYCAP_HEIGHT,
        0.05,
        0.012,
        KEYCAP_TOP_SCALE
      ),
    []
  );
  const baseGeom = useMemo(
    () => createExtrudedBox(BASE_WIDTH, BASE_DEPTH, BASE_HEIGHT, 0.12, 0.02, 1),
    []
  );

  useEffect(() => {
    return () => {
      keycapGeom.dispose();
      baseGeom.dispose();
    };
  }, [keycapGeom, baseGeom]);

  const hoveredIcon = useMemo(() => {
    if (hoveredKey) {
      const [r, c] = hoveredKey.split("-").map(Number);
      return SKILLS[r]?.[c] ?? null;
    }
    return typedSkill;
  }, [hoveredKey, typedSkill]);

  const keycapY = BASE_HEIGHT / 2 + KEYCAP_HEIGHT / 2 + 0.005;
  const keycaps = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = (col - (COLS - 1) / 2) * COL_SPACING;
      const z = (row - (ROWS - 1) / 2) * ROW_SPACING;
      const id = `${row}-${col}`;
      const icon = SKILLS[row][col];
      // Phase staggered by grid position so highlighted keys look like a
      // travelling wave rather than a synchronised pulse. Constants tuned
      // by eye — any non-degenerate combo works, just avoid exact multiples
      // of 2π between neighbours.
      const wavePhase = row * 0.9 + col * 0.55;
      keycaps.push(
        <Keycap
          key={id}
          geometry={keycapGeom}
          position={[x, keycapY, z]}
          isMobile={isMobile}
          icon={icon}
          hovered={hoveredKey === id}
          isPressed={pressedKeys.has(id)}
          highlightsRef={highlightsRef}
          activeSectionRef={activeSectionRef}
          wavePhase={wavePhase}
          accent={palette.accent}
          onHoverChange={(h) =>
            setHoveredKey((prev) => (h ? id : prev === id ? null : prev))
          }
        />
      );
    }
  }

  return (
    <>
      <group ref={ref}>
        <mesh geometry={baseGeom}>
          {/* Solid matte plastic — color prop controls the tone directly.
              No transmission/clearcoat so the white environment doesn't
              wash it out to grey. */}
          <meshStandardMaterial
            color={palette.keyboardBase}
            roughness={0.6}
            metalness={0}
          />
        </mesh>
        {keycaps}
      </group>
      {/* Callout lives OUTSIDE the animated keyboard group so the keyboard's
          yaw/pitch/scale don't warp the text. Placed in world space, to the
          left of the tilted keyboard, with its own matching isometric yaw +
          a small roll so the baseline rises left-to-right like Naresh's. */}
      {!mobile && activeSection === "stack" && hoveredIcon && (
        <Suspense fallback={null}>
          <group
            //position={[-2.6, -0.5, 0.9]}
            position={[-1.7,0,1.5]}
            //rotation={[-0.8, Math.PI * -0.1  , Math.PI * 4.33]}
            rotation={[-1,0.2,1.03]}
          >
            {/* No <Center>: Text3D renders with its first letter anchored
                at the group's origin (X=0) and baseline at Y=0. So the first
                letter stays fixed regardless of how long the title is. */}
            <Text3D
              key={hoveredIcon.slug}
              font="/fonts/space_grotesk_bold.typeface.json"
              size={0.25}
              height={0.1}
              curveSegments={12}
              bevelEnabled={false}
            >
              {hoveredIcon.title}
              {/* Naresh-style: pure white, no emissive. All the shading
                  comes from the directional light hitting the faces — the
                  top face catches it, side walls fall into shadow, giving
                  real 3D depth instead of a flat uniform glow. */}
              <meshStandardMaterial
                color="#ffffff"
                roughness={0.55}
                metalness={0}
              />
            </Text3D>
            <Text
              position={[0, -0.05, 0]}
              fontSize={0.12}
              color="#a6c5e4"
              anchorX="left"
              anchorY="top"
              maxWidth={2.2}
              lineHeight={1.25}
              overflowWrap="break-word"
            >
              {t(`keyboard.taglines.${hoveredIcon.slug}`)}
            </Text>
          </group>
        </Suspense>
      )}
    </>
  );
}

export default function FrozenKeyboard({
  mobile = false,
}: {
  mobile?: boolean;
}) {
  return (
    <Canvas
      // Portrait gets a pulled-back, centered, less top-down camera so the
      // keyboard reads as a front-facing hero centerpiece instead of the
      // off-axis desktop composition.
      camera={
        mobile
          ? { position: [0, 2.0, 9.0], fov: 26 }
          : { position: [1.5, 3.6, 11], fov: 22 }
      }
      dpr={mobile ? [1, 1.5] : [1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
    >
      {/* Canvas is transparent so the FrozenBackground (snow + aurora) shows
          through behind/around the keyboard. */}

      {/* Local environment map built from Lightformer quads — no external
          HDR fetch, so the scene works offline. Gives the glass keycaps
          soft icy highlights without relying on drei's CDN. */}
      <Environment resolution={128} environmentIntensity={0.25}>
        <Lightformer
          intensity={1.1}
          color="#ffffff"
          position={[0, 6, -4]}
          rotation={[0, 0, 0]}
          scale={[12, 6, 1]}
        />
        <Lightformer
          intensity={0.7}
          color="#ffffff"
          position={[-6, 2, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[6, 4, 1]}
        />
        <Lightformer
          intensity={0.5}
          color="#ffffff"
          position={[6, 3, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[6, 4, 1]}
        />
        <Lightformer
          intensity={0.35}
          color="#ffffff"
          position={[0, -4, 3]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 8, 1]}
        />
      </Environment>
      {/* Naresh-style lighting: low ambient + strong single directional from
          upper-left gives crisp top-bright / sides-shadowed contrast. The
          hemisphere adds a subtle sky-ground gradient so the darkest faces
          still read as "the lower faces" instead of pitch-black. */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[-5, 8, 3]} intensity={2.2} />
      <hemisphereLight
        intensity={0.25}
        color="#eaf2fb"
        groundColor="#0a1428"
      />

      <Keyboard mobile={mobile} />

    </Canvas>
  );
}
