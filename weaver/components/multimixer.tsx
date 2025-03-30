'use client'
import React, { useEffect, useRef, useState } from "react";
import Multitrack from "wavesurfer-multitrack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Mic, Music, SkipForward, SkipBack } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface MixerTrack {
  id: string;
  track_id: string;
  track_path: string;
  original_filename: string;
  created_at: string;
  startCue?: number;
  endCue?: number;
}

const MultiTrackPlayer = () => {
  const containerRef = useRef(null);
  const [multitrack, setMultitrack] = useState<Multitrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks] = useState<MixerTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState<number>(10);

  const fetchTracks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/mixer-tracks');
      const data = await response.json();
      console.log("Fetched tracks:", data.tracks);
      setTracks(data.tracks);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  // Add function to update track cues
  const updateTrackCue = (index: number, type: 'start' | 'end', value: number) => {
    const updatedTracks = [...tracks];
    if (type === 'start') {
      updatedTracks[index].startCue = value;
    } else {
      updatedTracks[index].endCue = value;
    }
    setTracks(updatedTracks);
  };

  useEffect(() => {
    if (!containerRef.current || tracks.length === 0) return;

    console.log("Creating multitrack with tracks:", tracks);
    console.log("Container ref:", containerRef.current);

    const instance = Multitrack.create(
      tracks.map((track, index) => {
        console.log(`Track ${index} URL:`, `http://localhost:5001${track.track_path}`);
        return {
          id: index + 1,
          url: `http://localhost:5001${track.track_path}`,
          volume: 0.95,
          startPosition: 0,
          draggable: true,
          envelope: true,
          startCue: track.startCue || 0,
          endCue: track.endCue,
          markers: [
            { time: 5, label: 'Intro' },
            { time: 10, label: 'M1' },
            { time: 12, label: 'M3' },
            { time: 15, label: 'M4' },
          ],
          options: { 
            waveColor: track.track_id === 'vocals' ? "#FFD700" : "#00FF9D",
            progressColor: track.track_id === 'vocals' ? "#B39700" : "#00B36E",
            height: 128,
            barWidth: 2,
            barGap: 1,
            barRadius: 0,
            normalize: true,
            backend: 'WebAudio',
            mediaControls: false,
            interact: false,
            fillParent: true,
            minPxPerSec: zoom,
            autoplay: false,
          },
        };
      }),
      {
        container: containerRef.current,
        minPxPerSec: zoom,
        cursorWidth: 2,
        cursorColor: "#FF0000",
        trackBackground: "#2D2D2D",
        trackBorderColor: "#3D3D3D",
        dragBounds: true,
        envelopeOptions: {
          lineColor: '#FF0000',
          lineWidth: '2',
          dragPointSize: 8,
          dragPointFill: '#FFFFFF',
          dragPointStroke: '#FF0000',
        },
        timelineOptions: {
          height: 20,
          style: {
            fontSize: '10px',
            color: '#666'
          },
          timeInterval: 1,
          primaryLabelInterval: 5,
          secondaryLabelInterval: 1,
          secondaryLabelOpacity: 0.25,
          formatTimeCallback: (seconds: number) => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
          }
        }
      }
    );

    setMultitrack(instance);

    // Set up event listeners
    instance.on('start-position-change', ({ id, startPosition }) => {
      console.log(`Track ${id} start position updated to ${startPosition}`);
    });

    instance.on('volume-change', ({ id, volume }) => {
      console.log(`Track ${id} volume updated to ${volume}`);
    });

    instance.on('fade-in-change', ({ id, fadeInEnd }) => {
      console.log(`Track ${id} fade-in updated to ${fadeInEnd}`);
    });

    instance.on('fade-out-change', ({ id, fadeOutStart }) => {
      console.log(`Track ${id} fade-out updated to ${fadeOutStart}`);
    });

    instance.on('start-cue-change', ({ id, startCue }) => {
      console.log(`Track ${id} start cue updated to ${startCue}`);
      const trackIndex = Number(id) - 1; // Convert 1-based ID to 0-based index
      updateTrackCue(trackIndex, 'start', startCue);
    });

    instance.on('end-cue-change', ({ id, endCue }) => {
      console.log(`Track ${id} end cue updated to ${endCue}`);
      const trackIndex = Number(id) - 1; // Convert 1-based ID to 0-based index
      updateTrackCue(trackIndex, 'end', endCue);
    });

    instance.once("canplay", () => {
      console.log("Tracks are ready to play");
    });

    return () => {
      instance.destroy();
    };
  }, [tracks, zoom]);

  const togglePlay = () => {
    if (multitrack) {
      if (multitrack.isPlaying()) {
        multitrack.pause();
        setIsPlaying(false);
      } else {
        multitrack.play();
        setIsPlaying(true);
      }
    }
  };

  const forward = () => {
    if (multitrack) {
      multitrack.setTime(multitrack.getCurrentTime() + 30);
    }
  };

  const backward = () => {
    if (multitrack) {
      multitrack.setTime(multitrack.getCurrentTime() - 30);
    }
  };

  const handleZoom = (value: number[]) => {
    setZoom(value[0]);
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base text-gray-100">Multi-Track Player</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-gray-400">
            Loading tracks...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tracks.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base text-gray-100">Multi-Track Player</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-gray-400">
            No tracks available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700 w-full">
      <CardContent className="p-0 w-full">
        <div className="flex flex-col w-full">
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-400">Zoom:</span>
              <Slider
                value={[zoom]}
                onValueChange={handleZoom}    
                min={10}
                max={100}
                className="w-48"
              />
            </div>
            
            {/* Track Controls */}
            <div className="space-y-4 mb-4">
              {tracks.map((track, index) => (
                <div key={track.id} className="bg-gray-700/50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {track.track_id === 'vocals' ? (
                      <Mic className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <Music className="h-4 w-4 text-green-400" />
                    )}
                    <span className="text-sm text-gray-300">
                      {track.track_id === 'vocals' ? 'Vocals' : 'No Vocals'} - {track.original_filename}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Intro:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={track.startCue || 0}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          updateTrackCue(index, 'start', value);
                          multitrack?.setTrackStartPosition(index, value);
                        }}
                        className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-300"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">End:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={track.endCue || 0}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          updateTrackCue(index, 'end', value);
                        }}
                        className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mb-4">
              <Button 
                onClick={togglePlay}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button 
                onClick={forward}
                variant="outline"
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                Forward 30s
              </Button>
              <Button 
                onClick={backward}
                variant="outline"
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                Back 30s
              </Button>
            </div>
          </div>

          <div 
            ref={containerRef} 
            className="w-full bg-gray-900 min-h-[256px]"
            style={{ display: 'block', minWidth: '100%' }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiTrackPlayer;
