import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Music, Download, Plus } from "lucide-react";

interface SeparatedFiles {
  vocals: string;
  instrumental: string;
  drums: string;
  bass: string;
  original_filename: string;
}

interface DraggableAudioTracksProps {
  separatedFiles: SeparatedFiles;
}

export default function DraggableAudioTracks({ separatedFiles }: DraggableAudioTracksProps) {
  // Function to clean up the filename
  const cleanFileName = (filename: string) => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    // Remove any special characters and extra spaces
    return nameWithoutExt.replace(/[\[\]()]/g, '').trim();
  };

  const [tracks, setTracks] = useState([
    { 
      id: "vocals", 
      label: `Vocals - ${cleanFileName(separatedFiles.original_filename)}`, 
      icon: <Mic className="h-4 w-4 text-blue-400" />, 
      src: separatedFiles.vocals 
    },
    { 
      id: "instrumental", 
      label: `Instrumental - ${cleanFileName(separatedFiles.original_filename)}`, 
      icon: <Music className="h-4 w-4 text-green-400" />, 
      src: separatedFiles.instrumental 
    },
    { 
      id: "drums", 
      label: `Drums - ${cleanFileName(separatedFiles.original_filename)}`, 
      icon: <Music className="h-4 w-4 text-yellow-400" />, 
      src: separatedFiles.drums 
    },
    { 
      id: "bass", 
      label: `Bass - ${cleanFileName(separatedFiles.original_filename)}`, 
      icon: <Music className="h-4 w-4 text-red-400" />, 
      src: separatedFiles.bass 
    },
  ]); 

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("trackIndex", index.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    const dragIndex = parseInt(e.dataTransfer.getData("trackIndex"), 10);
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;
    
    const newTracks = [...tracks];
    const [movedTrack] = newTracks.splice(dragIndex, 1);
    newTracks.splice(dropIndex, 0, movedTrack);
    setTracks(newTracks);
  };

  const handleAddToMixer = async (track: { id: string; src: string; label: string }) => {
    try {
      console.log('Track data:', track); // Log the entire track object
      
      if (!track.src) {
        throw new Error(`No source path found for track: ${track.id}`);
      }

      // Ensure the track path is properly formatted
      const trackPath = track.src.startsWith('/') ? track.src : `/${track.src}`;
      
      console.log('Adding track to mixer:', { 
        trackId: track.id, 
        trackPath: trackPath,
        originalFilename: cleanFileName(separatedFiles.original_filename)
      });
      
      const response = await fetch('http://localhost:5001/api/add-to-mixer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId: track.id,
          trackPath: trackPath,
          originalFilename: cleanFileName(separatedFiles.original_filename)
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add track to mixer');
      }

      console.log('Track added to mixer successfully:', data);
      alert('Track added to mixer successfully!');
    } catch (error: any) {
      console.error('Error adding track to mixer:', error);
      alert(`Failed to add track to mixer: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {tracks.map((track, index) => (
        <Card
          key={track.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, index)}
          className="cursor-grab hover:shadow-lg transition bg-gray-800 border-gray-700"
        >
          <CardHeader className="pb-2 flex items-center gap-2">
            {track.icon}
            <CardTitle className="text-base text-gray-100">{track.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <audio 
              controls 
              src={`http://localhost:5001${track.src}`} 
              className="w-full [&::-webkit-media-controls-panel]:bg-gray-700 [&::-webkit-media-controls-current-time-display]:text-gray-100 [&::-webkit-media-controls-time-remaining-display]:text-gray-100"
            ></audio>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              className="w-1/2 bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600" 
              onClick={() => window.open(`http://localhost:5001${track.src}`, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button 
              className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleAddToMixer(track)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to Mixer
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}