'use client'
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Music, Download, Trash2 } from "lucide-react";

interface MixerTrack {
  id: string;
  track_id: string;
  track_path: string;
  original_filename: string;
  created_at: string;
}

export default function MixerTracks() {
  const [tracks, setTracks] = useState<MixerTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMixerTracks();
  }, []);

  const fetchMixerTracks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/mixer-tracks');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch mixer tracks');
      }

      setTracks(data.tracks);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching mixer tracks:', error);
      setError(error.message);
      setLoading(false);
    }
  };

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

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-300">Loading mixer tracks...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      {tracks.map((track) => (
        <Card
          key={track.id}
          className="hover:shadow-lg transition bg-gray-800 border-gray-700"
        >
          <CardHeader className="pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {track.track_id === 'vocals' ? (
                <Mic className="h-4 w-4 text-blue-400" />
              ) : (
                <Music className="h-4 w-4 text-green-400" />
              )}
              <CardTitle className="text-base text-gray-100">
                {track.track_id === 'vocals' ? `Vocals - ${track.original_filename}` : `No Vocals - ${track.original_filename}`}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteTrack(track.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <audio 
              controls 
              src={`http://localhost:5001${track.track_path}`} 
              className="w-full [&::-webkit-media-controls-panel]:bg-gray-700 [&::-webkit-media-controls-current-time-display]:text-gray-100 [&::-webkit-media-controls-time-remaining-display]:text-gray-100"
            ></audio>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={() => window.open(`http://localhost:5001${track.track_path}`, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardFooter>
        </Card>
      ))}
      {tracks.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No tracks in the mixer yet. Add some tracks from the separation page!
        </div>
      )}
    </div>
  );
} 