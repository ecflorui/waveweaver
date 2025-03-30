'use client'
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Music, Download } from "lucide-react";

interface MixerTrack {
  id: string;
  track_id: string;
  track_path: string;
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading mixer tracks...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {tracks.map((track) => (
        <Card
          key={track.id}
          className="hover:shadow-lg transition"
        >
          <CardHeader className="pb-2 flex items-center gap-2">
            {track.track_id === 'vocals' ? (
              <Mic className="h-4 w-4" />
            ) : (
              <Music className="h-4 w-4" />
            )}
            <CardTitle className="text-base">
              {track.track_id === 'vocals' ? 'Vocals Track' : 'Instrumental Track'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <audio controls src={`http://localhost:5001${track.track_path}`} className="w-full"></audio>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => window.open(`http://localhost:5001${track.track_path}`, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardFooter>
        </Card>
      ))}
      {tracks.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No tracks in the mixer yet. Add some tracks from the separation page!
        </div>
      )}
    </div>
  );
} 