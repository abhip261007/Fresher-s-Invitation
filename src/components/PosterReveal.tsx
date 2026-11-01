import React, { useRef, useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

interface PosterRevealProps {
  src?: string;
  className?: string;
}

export function PosterReveal({
  src = "poster.mp4",
  className = "",
}: PosterRevealProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPausedAtAligned, setIsPausedAtAligned] = useState(false);

  // The exact timestamp where the SAARTHI FRESHER'S 2K26 poster is fully revealed,
  // perfectly centered, facing straight, and completely aligned before the flip transition.
  const ALIGN_TIMESTAMP = 2.95;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let frameId: number;

    const monitorTiming = () => {
      if (video && !video.paused) {
        if (video.currentTime >= ALIGN_TIMESTAMP) {
          video.pause();
          video.currentTime = ALIGN_TIMESTAMP;
          setIsPausedAtAligned(true);
          return;
        }
        frameId = requestAnimationFrame(monitorTiming);
      }
    };

    const handleTimeUpdate = () => {
      if (video.currentTime >= ALIGN_TIMESTAMP && !video.paused) {
        video.pause();
        video.currentTime = ALIGN_TIMESTAMP;
        setIsPausedAtAligned(true);
      }
    };

    const handlePlay = () => {
      setIsPausedAtAligned(false);
      frameId = requestAnimationFrame(monitorTiming);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);

    // Initial autoplay
    video.play().catch(() => {
      // Fallback if browser requires interaction
    });

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsPausedAtAligned(false);
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-[#00072D] shadow-[0_25px_60px_rgba(0,7,45,0.25)] border border-[#0A2472]/20 ${className}`}>
      {/* Video without any controls */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        className="w-full h-auto object-cover select-none pointer-events-none rounded-3xl block"
        style={{ pointerEvents: "none" }}
      />

      {/* Discretely placed Replay button when perfectly paused */}
      {isPausedAtAligned && (
        <div className="absolute bottom-4 right-4 z-20 animate-in fade-in duration-500">
          <button
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00072D]/75 hover:bg-[#00072D] text-white/90 hover:text-white text-[11px] font-semibold backdrop-blur-md border border-white/20 shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Replay poster reveal animation"
          >
            <RotateCcw className="h-3 w-3 text-sky-400" />
            <span>Replay Reveal</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default PosterReveal;
