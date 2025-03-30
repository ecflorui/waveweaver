'use client'
import WaveSurfer from 'wavesurfer.js'
import { useWavesurfer } from '@wavesurfer/react'
import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Music, Play, Pause, Trash2 } from "lucide-react"

interface MixerTrack {
  id: string;
  track_id: string;
  track_path: string;
  original_filename: string;
  created_at: string;
}

const formatTime = (seconds: number) => [seconds / 60, seconds % 60].map((v) => `0${Math.floor(v)}`.slice(-2)).join(':')

const App = () => {
  const containerRef = useRef(null)
  const [urlIndex, setUrlIndex] = useState(0)
  const [tracks, setTracks] = useState<MixerTrack[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTracks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/mixer-tracks')
      const data = await response.json()
      setTracks(data.tracks)
    } catch (error) {
      console.error('Error fetching tracks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTracks()
  }, [])

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
      
      // If we deleted the current track, move to the next one
      if (tracks[urlIndex]?.id === trackId) {
        setUrlIndex((index) => (index + 1) % (tracks.length - 1));
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      alert('Failed to delete track');
    }
  };

  const audioUrls = tracks.map(track => `http://localhost:5001${track.track_path}`)

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    height: 100,
    waveColor: 'rgb(59, 130, 246)',
    progressColor: 'rgb(37, 99, 235)',
    url: audioUrls[urlIndex],
    plugins: useMemo(() => [Timeline.create()], []),
  })

  const onUrlChange = useCallback(() => {
    setUrlIndex((index) => (index + 1) % audioUrls.length)
  }, [audioUrls.length])

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause()
  }, [wavesurfer])

  if (loading) {
    return <div className="text-gray-400">Loading tracks...</div>
  }

  if (audioUrls.length === 0) {
    return <div className="text-gray-400">No tracks available</div>
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tracks[urlIndex]?.track_id === 'vocals' ? (
            <Mic className="h-4 w-4 text-blue-400" />
          ) : (
            <Music className="h-4 w-4 text-green-400" />
          )}
          <CardTitle className="text-base text-gray-100">
            {tracks[urlIndex]?.track_id === 'vocals' ? `Vocals - ${tracks[urlIndex]?.original_filename}` : `No Vocals - ${tracks[urlIndex]?.original_filename}`}
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDeleteTrack(tracks[urlIndex].id)}
          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="mb-4" />
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-400">Current time: {formatTime(currentTime)}</p>
          <div className="flex gap-2">
            <Button 
              onClick={onUrlChange}
              className="bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600"
            >
              Next Track
            </Button>
            <Button 
              onClick={onPlayPause}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default App