import { Suspense, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Phase 8G — `VoiceBlob`: the floating, audio-reactive 3D blob that sits at
 * the centre of the voice-interview screen. A single `IcosahedronGeometry`
 * ("ico-sphere") deformed in the vertex shader by layered Perlin-style noise.
 *
 * Reactivity:
 *   • `norahIntensity`  — drives radial pulses + emerald glow when Norah talks.
 *   • `userIntensity`   — drives a subtle counter-pulse + slate tint when the
 *                         candidate talks. Both pulse simultaneously when there's
 *                         brief overlap; that's intentional (it visually mirrors
 *                         the conversation handing back and forth).
 *
 * Falls back to a CSS-only animated radial gradient if WebGL isn't available.
 */
export interface VoiceBlobProps {
  /** 0..1 ref updated each frame from the remote (Norah) MediaStream analyser. */
  norahIntensity: MutableRefObject<number>;
  /** 0..1 ref updated each frame from the local mic analyser. */
  userIntensity: MutableRefObject<number>;
  /** "norah" | "you" | "idle" — drives the status ring colour. */
  speaker: 'norah' | 'you' | 'idle';
  className?: string;
}

const NORAH_COLOR = new THREE.Color('#15803d'); // emerald — matches app accent
const USER_COLOR = new THREE.Color('#0f172a'); // slate
const IDLE_COLOR = new THREE.Color('#a7f3d0'); // pale mint

/** Vertex shader — layered noise displacement scaled by speaking intensity. */
const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uNorah;
  uniform float uUser;
  varying vec3 vNormal;
  varying float vDisplacement;

  // Classic 3D simplex noise (Ashima). Compact form.
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.0,i1.z,i2.z,1.0))+
      i.y+vec4(0.0,i1.y,i2.y,1.0))+
      i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    float t = uTime * 0.35;
    // Base ambient breathing — never fully still.
    float baseNoise = snoise(normal * 1.4 + vec3(t, t * 0.6, t * 0.9));
    // Norah's voice — fast, tight pulses.
    float norahPulse = snoise(normal * 2.4 + vec3(t * 2.1, t * 1.7, t * 2.3))
      * uNorah * 1.2;
    // User's voice — slower counter-wobble on the opposite axis.
    float userPulse = snoise(normal * 1.1 + vec3(-t * 1.4, t * 0.8, -t * 1.0))
      * uUser * 0.9;

    float displacement = baseNoise * 0.06 + norahPulse * 0.18 + userPulse * 0.14;
    vec3 displaced = position + normal * displacement;
    vDisplacement = displacement;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uNorah;
  uniform float uUser;
  varying vec3 vNormal;
  varying float vDisplacement;

  void main() {
    // Soft fresnel rim — feels gel-like.
    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
    float depth = smoothstep(-0.2, 0.25, vDisplacement);
    vec3 base = mix(uColorA, uColorB, depth);
    float speaking = clamp(uNorah + uUser * 0.5, 0.0, 1.0);
    base += rim * (0.35 + speaking * 0.4);
    // Inner glow when active.
    base += vec3(0.05, 0.18, 0.10) * speaking;
    gl_FragColor = vec4(base, 0.96);
  }
`;

interface BlobMeshProps {
  norahIntensity: MutableRefObject<number>;
  userIntensity: MutableRefObject<number>;
  colorA: THREE.Color;
  colorB: THREE.Color;
}

function BlobMesh({ norahIntensity, userIntensity, colorA, colorB }: BlobMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNorah: { value: 0 },
      uUser: { value: 0 },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
    }),
    [colorA, colorB],
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    // Lerp uniforms toward the ref values so the GPU sees smooth changes.
    uniforms.uNorah.value += (norahIntensity.current - uniforms.uNorah.value) * 0.18;
    uniforms.uUser.value += (userIntensity.current - uniforms.uUser.value) * 0.18;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12;
      meshRef.current.rotation.x = Math.sin(uniforms.uTime.value * 0.4) * 0.08;
      // Gentle Y oscillation — the "floating" effect.
      meshRef.current.position.y = Math.sin(uniforms.uTime.value * 0.6) * 0.04;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 24]} />
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

function CssBlobFallback({ speaker }: { speaker: VoiceBlobProps['speaker'] }) {
  return (
    <div
      role="img"
      aria-label="Voice blob"
      className="relative h-full w-full flex items-center justify-center"
    >
      <div
        className={[
          'h-[240px] w-[240px] rounded-full blur-md',
          'bg-[radial-gradient(circle_at_30%_30%,#a7f3d0,#15803d_60%,#064e3b)]',
          speaker === 'norah'
            ? 'animate-pulse'
            : speaker === 'you'
              ? 'opacity-90'
              : 'opacity-80',
        ].join(' ')}
      />
    </div>
  );
}

function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function VoiceBlob({
  norahIntensity,
  userIntensity,
  speaker,
  className,
}: VoiceBlobProps) {
  const supported = useMemo(() => hasWebGL(), []);
  const ringColor =
    speaker === 'norah' ? '#15803d' : speaker === 'you' ? '#475569' : '#cbd5e1';

  return (
    <div
      className={[
        'relative aspect-square w-full max-w-[300px] mx-auto',
        className ?? '',
      ].join(' ')}
    >
      {/* Status ring */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke={ringColor}
          strokeOpacity={speaker === 'idle' ? 0.4 : 0.85}
          strokeWidth="1.2"
          strokeDasharray={speaker === 'idle' ? '2 4' : '0'}
        />
      </svg>
      {/* Outer glow */}
      <div
        aria-hidden
        className="absolute inset-2 rounded-full blur-2xl opacity-60 transition-opacity"
        style={{
          background:
            speaker === 'norah'
              ? 'radial-gradient(circle, rgba(21,128,61,0.5), transparent 70%)'
              : speaker === 'you'
                ? 'radial-gradient(circle, rgba(71,85,105,0.4), transparent 70%)'
                : 'radial-gradient(circle, rgba(167,243,208,0.35), transparent 70%)',
        }}
      />
      <div className="absolute inset-3">
        {supported ? (
          <Canvas
            camera={{ position: [0, 0, 2.6], fov: 50 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.6} />
            <pointLight position={[3, 3, 3]} intensity={0.9} />
            <Suspense fallback={null}>
              <BlobMesh
                norahIntensity={norahIntensity}
                userIntensity={userIntensity}
                colorA={
                  speaker === 'you'
                    ? USER_COLOR
                    : speaker === 'norah'
                      ? NORAH_COLOR
                      : IDLE_COLOR
                }
                colorB={NORAH_COLOR}
              />
            </Suspense>
          </Canvas>
        ) : (
          <CssBlobFallback speaker={speaker} />
        )}
      </div>
    </div>
  );
}

export default VoiceBlob;
