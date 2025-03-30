'use client'

import { useEffect, useRef, useState } from 'react';
import { motion, PanInfo, useMotionValue } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import { Volume2 } from "lucide-react";

interface TrackRegionProps {
  duration: number;
  currentTime: number;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  volume: number;
  onRegionChange: (start: number, end: number) => void;
  onVolumeChange: (volume: number) => void;
}

export function TrackRegion({
  duration,
  currentTime,
  startTime,
  endTime,
  isPlaying,
  volume,
  onRegionChange,
  onVolumeChange,
}: TrackRegionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isMovingRegion, setIsMovingRegion] = useState(false);

  const startX = useMotionValue(0);
  const endX = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      startX.set((startTime / duration) * containerWidth);
      endX.set((endTime / duration) * containerWidth);
    }
  }, [startTime, endTime, duration]);

  const handleDrag = (info: PanInfo, isStart: boolean, isEnd: boolean) => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const pixelToTime = duration / containerWidth;

    if (isStart) {
      const newStartX = Math.max(0, Math.min(endX.get() - 10, startX.get() + info.delta.x));
      startX.set(newStartX);
      const newStartTime = newStartX * pixelToTime;
      onRegionChange(newStartTime, endTime);
    } else if (isEnd) {
      const newEndX = Math.max(startX.get() + 10, Math.min(containerWidth, endX.get() + info.delta.x));
      endX.set(newEndX);
      const newEndTime = newEndX * pixelToTime;
      onRegionChange(startTime, newEndTime);
    } else {
      // Moving entire region
      const regionWidth = endX.get() - startX.get();
      let newStartX = startX.get() + info.delta.x;
      let newEndX = endX.get() + info.delta.x;

      // Keep region within bounds
      if (newStartX < 0) {
        newStartX = 0;
        newEndX = regionWidth;
      }
      if (newEndX > containerWidth) {
        newEndX = containerWidth;
        newStartX = containerWidth - regionWidth;
      }

      startX.set(newStartX);
      endX.set(newEndX);
      const newStartTime = newStartX * pixelToTime;
      const newEndTime = newEndX * pixelToTime;
      onRegionChange(newStartTime, newEndTime);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div 
          ref={containerRef}
          className="relative flex-1 h-16 bg-gray-800/50 rounded-lg overflow-hidden group"
        >
          {/* Time indicators */}
          <div className="absolute top-1 left-0 right-0 flex justify-between px-2 text-xs text-gray-400">
            <span>{formatTime(startTime)}</span>
            <span>{formatTime(endTime)}</span>
          </div>

          {/* Playhead */}
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-20"
            style={{
              left: `${(currentTime / duration) * 100}%`,
              display: isPlaying ? 'block' : 'none'
            }}
          />

          {/* Region */}
          <motion.div
            className="absolute top-0 bottom-0 bg-blue-500/10 cursor-move group-hover:bg-blue-500/20 transition-colors"
            style={{
              left: startX,
              right: 0,
              width: `${((endTime - startTime) / duration) * 100}%`
            }}
            drag="x"
            dragMomentum={false}
            dragConstraints={containerRef}
            onDragStart={() => setIsMovingRegion(true)}
            onDragEnd={() => setIsMovingRegion(false)}
            onDrag={(_, info) => handleDrag(info, false, false)}
          >
            {/* Start handle - wider and with hover effect */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-6 cursor-col-resize hover:bg-blue-400/10 transition-colors"
              drag="x"
              dragMomentum={false}
              dragConstraints={containerRef}
              onDragStart={() => setIsDraggingStart(true)}
              onDragEnd={() => setIsDraggingStart(false)}
              onDrag={(_, info) => handleDrag(info, true, false)}
            />

            {/* End handle - wider and with hover effect */}
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-6 cursor-col-resize hover:bg-blue-400/10 transition-colors"
              drag="x"
              dragMomentum={false}
              dragConstraints={containerRef}
              onDragStart={() => setIsDraggingEnd(true)}
              onDragEnd={() => setIsDraggingEnd(false)}
              onDrag={(_, info) => handleDrag(info, false, true)}
            />
          </motion.div>

          {/* Current time indicator */}
          <div className="absolute bottom-1 left-0 right-0 text-center">
            <span className="text-xs text-gray-400 font-mono">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Volume slider aligned with region */}
        <div className="w-24 flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <Slider
            value={[volume * 100]}
            min={0}
            max={100}
            onValueChange={(values: number[]) => onVolumeChange(values[0] / 100)}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
} 