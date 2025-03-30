import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Music, Download } from "lucide-react";

interface SeparatedFiles {
  vocals: string;
  instrumental: string;
}

interface DraggableAudioTracksProps {
  separatedFiles: SeparatedFiles;
}

export default function DraggableAudioTracks({ separatedFiles }: DraggableAudioTracksProps) {
  const [tracks, setTracks] = useState([
    { id: "vocals", label: "Vocals Track", icon: <Mic className="h-4 w-4" />, src: separatedFiles.vocals },
    { id: "instrumental", label: "Instrumental Track", icon: <Music className="h-4 w-4" />, src: separatedFiles.instrumental },
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

  return (
    <div className="flex flex-col gap-4 w-full">
      {tracks.map((track, index) => (
        <Card
          key={track.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, index)}
          className="cursor-grab hover:shadow-lg transition"
        >
          <CardHeader className="pb-2 flex items-center gap-2">
            {track.icon}
            <CardTitle className="text-base">{track.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <audio controls src={`http://localhost:5001${track.src}`} className="w-full"></audio>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => window.open(`http://localhost:5001${track.src}`, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Download {track.label}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
