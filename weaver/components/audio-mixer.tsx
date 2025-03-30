'use client'

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Repeat, FastForward, Rewind, Mic, Music, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { TrackRegion } from "./track-region";

interface AudioTrack {
  id: string;
  track_id: string;
  track_path: string;
  original_filename: string;
  audio: HTMLAudioElement;
  isPlaying: boolean;
  startTime: number;
  endTime: number;
  isLooping: boolean;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  regionInterval?: NodeJS.Timeout;
}

interface MixerTrackResponse {
  id: string;
  track_id: string;
  track_path: string;
  original_filename: string;
  created_at: string;
}

export default function AudioMixer() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [masterPlay, setMasterPlay] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);
  const [masterPlaybackRate, setMasterPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const masterAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchMixerTracks();
    return () => {
      // Cleanup audio elements when component unmounts
      tracks.forEach(track => {
        track.audio.pause();
        track.audio.src = '';
        if (track.regionInterval) {
          clearInterval(track.regionInterval);
        }
      });
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (masterAudioRef.current) {
        setCurrentTime(masterAudioRef.current.currentTime);
        setDuration(masterAudioRef.current.duration);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    tracks.forEach(track => {
      if (track.regionInterval) {
        clearInterval(track.regionInterval);
      }

      const interval = setInterval(() => {
        if (track.isPlaying) {
          // Check if we've reached the end of the region
          if (track.audio.currentTime >= track.endTime) {
            if (track.isLooping) {
              track.audio.currentTime = track.startTime;
            } else {
              track.audio.pause();
              setTracks(prev => prev.map(t => 
                t.id === track.id ? { ...t, isPlaying: false } : t
              ));
            }
          }
        }
      }, 10);

      setTracks(prev => prev.map(t => 
        t.id === track.id ? { ...t, regionInterval: interval } : t
      ));
    });

    return () => {
      tracks.forEach(track => {
        if (track.regionInterval) {
          clearInterval(track.regionInterval);
        }
      });
    };
  }, [tracks.length]); // Only run when tracks are added/removed

  const fetchMixerTracks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/mixer-tracks');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch mixer tracks');
      }

      const loadedTracks = await Promise.all(
        data.tracks.map(async (track: MixerTrackResponse) => {
          const audio = new Audio();
          audio.src = `http://localhost:5001${track.track_path}`;
          await new Promise((resolve) => {
            audio.addEventListener('loadedmetadata', resolve, { once: true });
          });
          return {
            ...track,
            audio,
            isPlaying: false,
            startTime: 0,
            endTime: audio.duration,
            isLooping: false,
            volume: 1,
            isMuted: false,
            playbackRate: 1,
          };
        })
      );

      setTracks(loadedTracks);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching mixer tracks:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playTrack = async (track: AudioTrack) => {
    try {
      // Always start from the region start time
      track.audio.currentTime = track.startTime;
      track.audio.playbackRate = masterPlaybackRate;
      
      // Add timeupdate listener for region end
      const handleTimeUpdate = () => {
        if (track.audio.currentTime >= track.endTime) {
          if (track.isLooping) {
            track.audio.currentTime = track.startTime;
          } else {
            track.audio.pause();
            track.audio.removeEventListener('timeupdate', handleTimeUpdate);
            setTracks(prev => prev.map(t => 
              t.id === track.id ? { ...t, isPlaying: false } : t
            ));
          }
        }
      };

      track.audio.addEventListener('timeupdate', handleTimeUpdate);
      await track.audio.play();
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const toggleMasterPlay = async () => {
    try {
      if (masterPlay) {
        tracks.forEach(track => {
          track.audio.pause();
        });
        setTracks(tracks.map(track => ({ ...track, isPlaying: false })));
      } else {
        // Play tracks sequentially to avoid interference
        for (const track of tracks) {
          await playTrack(track);
        }
        setTracks(tracks.map(track => ({ ...track, isPlaying: true })));
      }
      setMasterPlay(!masterPlay);
    } catch (error) {
      console.error('Error toggling master play:', error);
    }
  };

  const setMasterSpeed = (speed: number) => {
    setMasterPlaybackRate(speed);
    tracks.forEach((track: AudioTrack) => {
      track.audio.playbackRate = speed;
    });
  };

  const toggleTrackPlay = async (trackId: string) => {
    const trackToToggle = tracks.find(t => t.id === trackId);
    if (!trackToToggle) return;

    try {
      if (trackToToggle.isPlaying) {
        trackToToggle.audio.pause();
      } else {
        await playTrack(trackToToggle);
      }

      setTracks(tracks.map(track => 
        track.id === trackId 
          ? { ...track, isPlaying: !track.isPlaying }
          : track
      ));
    } catch (error) {
      console.error('Error toggling track play:', error);
    }
  };

  const toggleTrackLoop = (trackId: string) => {
    setTracks(tracks.map((track: AudioTrack) => {
      if (track.id === trackId) {
        track.audio.loop = !track.isLooping;
        return { ...track, isLooping: !track.isLooping };
      }
      return track;
    }));
  };

  const setTrackVolume = (trackId: string, volume: number) => {
    setTracks(tracks.map((track: AudioTrack) => {
      if (track.id === trackId) {
        track.audio.volume = volume * masterVolume;
        return { ...track, volume };
      }
      return track;
    }));
  };

  const toggleTrackMute = (trackId: string) => {
    setTracks(tracks.map((track: AudioTrack) => {
      if (track.id === trackId) {
        track.audio.muted = !track.isMuted;
        return { ...track, isMuted: !track.isMuted };
      }
      return track;
    }));
  };

  const setTrackRegion = (trackId: string, start: number, end: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    // Validate start and end times
    const validStart = Math.max(0, Math.min(start, track.audio.duration));
    const validEnd = Math.max(validStart, Math.min(end, track.audio.duration));

    // If track is playing, immediately update current time if needed
    if (track.isPlaying && track.audio.currentTime < validStart) {
      track.audio.currentTime = validStart;
    }

    setTracks(tracks.map((t: AudioTrack) => {
      if (t.id === trackId) {
        // If current time is outside new region, reset to start
        if (t.audio.currentTime < validStart || t.audio.currentTime > validEnd) {
          t.audio.currentTime = validStart;
        }
        return { ...t, startTime: validStart, endTime: validEnd };
      }
      return t;
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-400">
        <span className="bg-red-100/10 px-4 py-2 rounded-lg">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-6">
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-gray-100 flex items-center gap-2">
            <Music className="h-6 w-6 text-blue-400" />
            Master Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleMasterPlay}
                className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full"
              >
                {masterPlay ? 
                  <Pause className="h-6 w-6" /> : 
                  <Play className="h-6 w-6 ml-1" />
                }
              </Button>
              <div className="flex-1">
                <Progress
                  value={(currentTime / duration) * 100}
                  className="h-3"
                />
              </div>
              <div className="text-sm text-gray-300 font-mono min-w-[80px] text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Rewind className="h-4 w-4 text-gray-400" />
                <div className="flex-1 min-w-[200px]">
                  <Slider
                    value={[masterPlaybackRate * 100]}
                    min={50}
                    max={200}
                    step={25}
                    onValueChange={(values: number[]) => setMasterSpeed(values[0] / 100)}
                    className="w-[200px]"
                  />
                </div>
                <FastForward className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300 font-mono min-w-[60px]">
                  {masterPlaybackRate.toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center gap-2">
                <VolumeX className="h-4 w-4 text-gray-400" />
                <Slider
                  value={[masterVolume * 100]}
                  min={0}
                  max={100}
                  onValueChange={(values: number[]) => setMasterVolume(values[0] / 100)}
                  className="w-[100px]"
                />
                <Volume2 className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {tracks.map((track: AudioTrack) => (
          <Card key={track.id} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm shadow-xl hover:bg-gray-800/60 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {track.track_id === 'vocals' ? (
                    <Mic className="h-5 w-5 text-blue-400" />
                  ) : track.track_id === 'instrumental' ? (
                    <Music className="h-5 w-5 text-green-400" />
                  ) : track.track_id === 'drums' ? (
                    <Music className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <Music className="h-5 w-5 text-red-400" />
                  )}
                  <CardTitle className="text-base text-gray-100">
                    {track.track_id === 'vocals' ? `Vocals - ${track.original_filename}` :
                     track.track_id === 'instrumental' ? `Instrumental - ${track.original_filename}` :
                     track.track_id === 'drums' ? `Drums - ${track.original_filename}` :
                     `Bass - ${track.original_filename}`}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleTrackMute(track.id)}
                    className={track.isMuted ? "text-red-400" : "text-gray-400"}
                  >
                    {track.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleTrackPlay(track.id)}
                    className={track.isPlaying ? "text-green-400" : "text-gray-400"}
                  >
                    {track.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleTrackLoop(track.id)}
                    className={track.isLooping ? "text-blue-400" : "text-gray-400"}
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TrackRegion
                  duration={track.audio.duration}
                  currentTime={track.audio.currentTime}
                  startTime={track.startTime}
                  endTime={track.endTime}
                  isPlaying={track.isPlaying}
                  onRegionChange={(start, end) => setTrackRegion(track.id, start, end)}
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Slider
                      value={[track.volume * 100]}
                      min={0}
                      max={100}
                      onValueChange={(values: number[]) => setTrackVolume(track.id, values[0] / 100)}
                    />
                  </div>
                  <span className="text-sm text-gray-300 font-mono min-w-[80px] text-right">
                    {formatTime(track.audio.currentTime)} / {formatTime(track.audio.duration)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {tracks.length === 0 && (
        <div className="text-center text-gray-400 py-12 bg-gray-800/20 rounded-lg border border-gray-700/30">
          <Music className="h-12 w-12 mx-auto mb-4 text-gray-500" />
          <p className="text-lg">No tracks in the mixer yet.</p>
          <p className="text-sm text-gray-500">Add some tracks from the separation page!</p>
        </div>
      )}
      <audio ref={masterAudioRef} className="hidden" />
    </div>
  );
} 