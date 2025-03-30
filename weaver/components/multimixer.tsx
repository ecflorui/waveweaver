'use client'
import React, { useEffect, useRef, useState } from "react";
import Multitrack from "wavesurfer-multitrack";
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Mic, Music, SkipForward, SkipBack, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MixerTrack {
  id: string;
  track_id: string;
  track_path: string;
  original_filename: string;
  created_at: string;
  startCue?: number;
  endCue?: number;
  isLooping?: boolean;
}

interface Region {
  start: number;
  end?: number;
  content?: string;
  color: string;
  drag?: boolean;
  resize?: boolean;
  minLength?: number;
  maxLength?: number;
}

const MultiTrackPlayer = () => {
  const containerRef = useRef(null);
  const [multitrack, setMultitrack] = useState<Multitrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks] = useState<MixerTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState<number>(10);
  const [loopRegions, setLoopRegions] = useState<{ [key: string]: boolean }>({});
  const [activeRegion, setActiveRegion] = useState<any>(null);
  const regionsRef = useRef<any>(null);

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/mixer-tracks/${trackId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete track');
      }

      // Update the tracks list by removing the deleted track
      setTracks(tracks.filter(track => track.id !== trackId));
    } catch (error) {
      console.error('Error deleting track:', error);
      alert('Failed to delete track');
    }
  };

  // Random color generator for regions
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`;

  const fetchTracks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/mixer-tracks');
      const data = await response.json();
      console.log("Fetched tracks:", data.tracks);
      
      // Verify audio URLs are accessible
      const verifiedTracks = await Promise.all(
        data.tracks.map(async (track: MixerTrack) => {
          const audioUrl = `http://localhost:5001${track.track_path}`;
          try {
            const response = await fetch(audioUrl, { method: 'HEAD' });
            if (!response.ok) {
              console.error(`Audio file not accessible: ${audioUrl}`);
              return null;
            }
            return track;
          } catch (error) {
            console.error(`Error checking audio file: ${audioUrl}`, error);
            return null;
          }
        })
      );

      // Filter out inaccessible tracks
      const validTracks = verifiedTracks.filter((track): track is MixerTrack => track !== null);
      console.log("Valid tracks:", validTracks);
      setTracks(validTracks);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    if (!containerRef.current || tracks.length === 0) return;

    console.log("Creating multitrack with tracks:", tracks);
    console.log("Container ref:", containerRef.current);

    // Create regions plugin
    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const instance = Multitrack.create(
      tracks.map((track, index) => {
        console.log(`Initializing track ${index}:`, {
          id: track.id,
          url: `http://localhost:5001${track.track_path}`,
          trackId: track.track_id
        });
        return {
          id: index + 1,
          url: `http://localhost:5001${track.track_path}`,
          volume: 1,
          startPosition: 0,
          draggable: false,
          envelope: true,
          startCue: track.startCue || 0,
          endCue: track.endCue,
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
            interact: true,
            fillParent: true,
            minPxPerSec: zoom,
            autoplay: false,
            volume: 1,
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
        dragBounds: false,
      }
    );

    setMultitrack(instance);

    // Add keyboard event handler for backspace
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && instance) {
        // Remove all envelope points from all tracks
        tracks.forEach((_, index) => {
          instance.setEnvelopePoints(index + 1, []);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Log when tracks are loaded
    instance.once('canplay', () => {
      console.log('All tracks are ready to play');
      // Initialize track volumes to 1 and set default envelope points
      tracks.forEach((track, index) => {
        console.log(`Setting envelope points for track ${index + 1}:`, track.track_id);
        instance.setTrackVolume(index + 1, 1);
        
        // Set default envelope points at start and end
        const endTime = track.endCue || 30; // Use end cue or default to 30 seconds
        const points = [
          { time: 0, volume: 1 },
          { time: endTime, volume: 1 }
        ];
        
        // For vocals track (index 0), ensure points are set
        if (track.track_id === 'vocals') {
          console.log('Setting envelope points for vocals track:', points);
          instance.setEnvelopePoints(1, points);
        } else {
          instance.setEnvelopePoints(index + 1, points);
        }
      });

      // Create start and end regions for each track
      tracks.forEach((track, index) => {
        // Start region - make it more visible
        regions.addRegion({
          id: `start-${index}`,
          start: track.startCue || 0,
          end: (track.startCue || 0) + 0.5, // Increased width for better visibility
          color: 'rgba(255, 0, 0, 0.8)', // Increased opacity
          drag: true,
          resize: false,
          minLength: 0.5,
          maxLength: 0.5,
          content: 'Start',
        });

        // End region - make it more visible
        regions.addRegion({
          id: `end-${index}`,
          start: track.endCue || 30,
          end: (track.endCue || 30) + 0.5, // Increased width for better visibility
          color: 'rgba(0, 255, 0, 0.8)', // Increased opacity
          drag: true,
          resize: false,
          minLength: 0.5,
          maxLength: 0.5,
          content: 'End',
        });

        // Loop region - make it more visible when active
        regions.addRegion({
          id: `loop-${index}`,
          start: track.startCue || 0,
          end: track.endCue || 30,
          color: 'rgba(0, 255, 255, 0.3)', // Adjusted opacity
          drag: false,
          resize: true,
          content: 'Loop',
        });
      });
    });

    // Region event handlers
    regions.on('region-updated', (region: any) => {
      console.log('Updated region', region);
      const trackIndex = parseInt(region.id.split('-')[1]);
      const isStartRegion = region.id.startsWith('start-');
      const isEndRegion = region.id.startsWith('end-');
      const isLoopRegion = region.id.startsWith('loop-');
      
      if (isStartRegion) {
        const updatedTracks = [...tracks];
        updatedTracks[trackIndex] = { ...tracks[trackIndex], startCue: region.start };
        setTracks(updatedTracks);
        
        // Update loop region start
        const loopRegion = regions.getRegions().find(r => r.id === `loop-${trackIndex}`);
        if (loopRegion) {
          loopRegion.remove();
          regions.addRegion({
            ...loopRegion,
            start: region.start,
          });
        }
      } else if (isEndRegion) {
        const updatedTracks = [...tracks];
        updatedTracks[trackIndex] = { ...tracks[trackIndex], endCue: region.start };
        setTracks(updatedTracks);
        
        // Update loop region end
        const loopRegion = regions.getRegions().find(r => r.id === `loop-${trackIndex}`);
        if (loopRegion) {
          loopRegion.remove();
          regions.addRegion({
            ...loopRegion,
            end: region.start,
          });
        }
      } else if (isLoopRegion) {
        const updatedTracks = [...tracks];
        updatedTracks[trackIndex] = { 
          ...tracks[trackIndex], 
          startCue: region.start,
          endCue: region.end
        };
        setTracks(updatedTracks);
      }
    });

    // Update region visibility when loop toggle changes
    regions.on('region-clicked', (region: any, e: Event) => {
      e.stopPropagation();
      const trackIndex = parseInt(region.id.split('-')[1]);
      const isLoopRegion = region.id.startsWith('loop-');
      
      if (isLoopRegion) {
        const track = tracks[trackIndex];
        if (track) {
          const isLooping = loopRegions[track.id];
          region.setOptions({
            color: isLooping ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 255, 255, 0.1)',
          });
        }
      }
    });

    // Remove the old region handlers since we're using the sliding window now
    regions.on('region-in', (region: any) => {
      console.log('region-in', region);
    });

    regions.on('region-out', (region: any) => {
      console.log('region-out', region);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      instance.destroy();
    };
  }, [tracks, zoom, loopRegions, activeRegion]);

  const togglePlay = () => {
    if (multitrack) {
      try {
        if (multitrack.isPlaying()) {
          console.log('Pausing playback');
          multitrack.pause();
          setIsPlaying(false);
        } else {
          console.log('Starting playback');
          multitrack.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Playback error:', error);
      }
    } else {
      console.warn('Multitrack instance not initialized');
    }
  };

  const forward = () => {
    if (multitrack) {
      try {
        const currentTime = multitrack.getCurrentTime();
        console.log('Current time:', currentTime);
        multitrack.setTime(currentTime + 30);
      } catch (error) {
        console.error('Forward error:', error);
      }
    }
  };

  const backward = () => {
    if (multitrack) {
      try {
        const currentTime = multitrack.getCurrentTime();
        console.log('Current time:', currentTime);
        multitrack.setTime(Math.max(0, currentTime - 30));
      } catch (error) {
        console.error('Backward error:', error);
      }
    }
  };

  const handleZoom = (value: number[]) => {
    setZoom(value[0]);
  };

  const addRegion = () => {
    if (regionsRef.current && multitrack) {
      const currentTime = multitrack.getCurrentTime();
      regionsRef.current.addRegion({
        start: currentTime,
        end: currentTime + 5,
        content: 'New Region',
        color: randomColor(),
        resize: true,
      });
    }
  };

  const toggleLoop = (trackId: string) => {
    setLoopRegions(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
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
    <Card className="bg-gray-800 border-gray-700 w-full h-screen flex flex-col max-w-none">
      <CardContent className="p-0 w-full flex flex-col flex-1 max-w-none">
        <div className="flex flex-col w-full h-full max-w-none">
          <div className="px-4 py-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Zoom:</span>
                <Slider
                  value={[zoom]}
                  onValueChange={handleZoom}    
                  min={10}
                  max={100}
                  className="w-48"
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-400 mb-2">
              Tip: Drag the red line to set the start position and the green line to set the end position for each track. Double-click to create volume points. Press Backspace to remove all volume points.
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
                    <div className="ml-auto flex items-center gap-2">
                      <Switch
                        checked={loopRegions[track.id] || false}
                        onCheckedChange={() => toggleLoop(track.id)}
                        id={`loop-${track.id}`}
                      />
                      <Label htmlFor={`loop-${track.id}`} className="text-sm text-gray-400">
                        Loop Section
                      </Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTrack(track.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                          const updatedTracks = [...tracks];
                          updatedTracks[index] = { ...track, startCue: value };
                          setTracks(updatedTracks);
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
                          const updatedTracks = [...tracks];
                          updatedTracks[index] = { ...track, endCue: value };
                          setTracks(updatedTracks);
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
            className="flex-1 bg-gray-900"
            style={{ 
              display: 'block', 
              width: '100%',
              minWidth: '100%',
              minHeight: '0',
              overflow: 'hidden'
            }}
            onClick={() => setActiveRegion(null)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiTrackPlayer;
