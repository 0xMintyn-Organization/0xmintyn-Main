// components/YouTubePlayer.tsx

"use client";

import { useEffect, useRef } from "react";
import { getYouTubeEmbedUrl, extractYouTubeVideoId } from "@/lib/youtubeUtils";

interface YouTubePlayerProps {
  url: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function YouTubePlayer({
  url,
  title,
  autoPlay = false,
  className = "",
  onEnded,
  onPlay,
  onPause,
}: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embedUrl = getYouTubeEmbedUrl(url);
  const videoId = extractYouTubeVideoId(url);

  if (!embedUrl || !videoId) {
    return (
      <div className={`flex items-center justify-center bg-black text-white ${className}`}>
        <p>Invalid YouTube URL</p>
      </div>
    );
  }

  // Add autoplay parameter if needed
  // Include additional parameters for better embedding
  const finalEmbedUrl = autoPlay 
    ? `${embedUrl}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : `${embedUrl}?rel=0&modestbranding=1&playsinline=1`;

  useEffect(() => {
    if (!iframeRef.current) return;

    // Listen for YouTube iframe API events
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;

      try {
        const data = JSON.parse(event.data);
        
        if (data.event === "video-progress" || data.info?.currentTime !== undefined) {
          // Video is playing
          if (onPlay) onPlay();
        }
        
        if (data.event === "onStateChange") {
          // 0 = ended, 1 = playing, 2 = paused
          if (data.info === 0 && onEnded) {
            onEnded();
          } else if (data.info === 1 && onPlay) {
            onPlay();
          } else if (data.info === 2 && onPause) {
            onPause();
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onEnded, onPlay, onPause]);

  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: "56.25%" }}>
      <iframe
        ref={iframeRef}
        src={finalEmbedUrl}
        title={title || "YouTube video player"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
        style={{ border: 0 }}
      />
    </div>
  );
}
