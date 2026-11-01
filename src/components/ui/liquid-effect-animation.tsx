import { useEffect, useRef } from "react"

interface LiquidEffectAnimationProps {
  className?: string;
  /** Reflection image — use a deep blue image for blue liquid */
  imageUrl?: string;
  metalness?: number;
  roughness?: number;
  displacementScale?: number;
  rain?: boolean;
}

export function LiquidEffectAnimation({
  className = "",
  imageUrl = "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=80",
  metalness = 0.88,
  roughness = 0.08,
  displacementScale = 5,
  rain = false,
}: LiquidEffectAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Unique ID per mount so multiple instances never conflict
    const uid = `liquid-${Math.random().toString(36).slice(2, 9)}`
    canvasRef.current.id = uid

    const script = document.createElement("script")
    script.type = "module"
    script.textContent = `
      import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js';
      const canvas = document.getElementById('${uid}');
      if (canvas) {
        const app = LiquidBackground(canvas);
        app.loadImage('${imageUrl}');
        app.liquidPlane.material.metalness = ${metalness};
        app.liquidPlane.material.roughness  = ${roughness};
        app.liquidPlane.uniforms.displacementScale.value = ${displacementScale};
        app.setRain(${rain});
        canvas._liquidApp = app;
      }
    `
    document.body.appendChild(script)
    scriptRef.current = script

    return () => {
      const c = canvasRef.current as (HTMLCanvasElement & { _liquidApp?: { dispose?: () => void } }) | null
      c?._liquidApp?.dispose?.()
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  )
}

declare global {
  interface Window {
    __liquidApp?: unknown
  }
}
