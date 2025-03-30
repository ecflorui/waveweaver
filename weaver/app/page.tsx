"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Music2, Mic, Music } from "lucide-react";
import { AudioSeparator } from "@/components/audio-separator";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [separatedFiles, setSeparatedFiles] = useState<{
    vocals: string | null;
    instrumental: string | null;
  }>({ vocals: null, instrumental: null });

  const handleProcessingStart = () => {
    setIsProcessing(true);
  };

  const handleProcessingComplete = (files?: { vocals: string; instrumental: string }) => {
    setIsProcessing(false);
    if (files) {
      setSeparatedFiles(files);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Music2 className="h-6 w-6" />
            Audio Separator
          </CardTitle>
          <CardDescription>Upload an audio file and extract vocals from instrumentals</CardDescription>
        </CardHeader>
        <CardContent>
          {!isProcessing && !separatedFiles.vocals && !separatedFiles.instrumental && (
            <AudioSeparator
              onProcessingStart={handleProcessingStart}
              onProcessingComplete={handleProcessingComplete}
            />
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Music2 className="h-12 w-12 animate-pulse text-primary" />
              <h3 className="text-lg font-medium">Processing Audio</h3>
              <Progress value={66} className="w-full max-w-md" />
              <p className="text-sm text-muted-foreground">Please wait while we separate vocals from instrumentals...</p>
            </div>
          )}

          {separatedFiles.vocals && separatedFiles.instrumental && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <h3 className="text-lg font-medium">Your separated tracks are ready!</h3>
              <div className="grid grid-cols-1 gap-4 w-full">
                {separatedFiles.vocals && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        Vocals Track
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <audio controls src={`http://localhost:5001${separatedFiles.vocals}`} className="w-full"></audio>
                    </CardContent>
                    <Button
                      onClick={() => window.open(`http://localhost:5001${separatedFiles.vocals}`, '_blank')}
                      className="w-full"
                    >
                      Download Vocals
                    </Button>
                  </Card>
                )}

                {separatedFiles.instrumental && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        Instrumental Track
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <audio controls src={`http://localhost:5001${separatedFiles.instrumental}`} className="w-full"></audio>
                    </CardContent>
                    <Button
                      onClick={() => window.open(`http://localhost:5001${separatedFiles.instrumental}`, '_blank')}
                      className="w-full"
                    >
                      Download Instrumental
                    </Button>
                  </Card>
                )}
              </div>
              <Button variant="outline" onClick={() => setSeparatedFiles({ vocals: null, instrumental: null })}>
                Process Another File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
