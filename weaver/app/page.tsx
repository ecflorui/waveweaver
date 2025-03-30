"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SplitSquareVertical, Download, Music2, Mic, Music } from "lucide-react"
import { AudioSeparator } from "@/components/audio-separator"
import DraggableAudioTracks from "@/components/download";
import Link from 'next/link'

// Define SeparatedFiles interface here
interface SeparatedFiles {
  vocals: string | null;
  instrumental: string | null;
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [separatedFiles, setSeparatedFiles] = useState<SeparatedFiles>({
    vocals: null,
    instrumental: null,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            return 0;
          }
          return prevProgress + 1;
        });
      }, 50);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isProcessing]);

  const handleProcessingStart = () => {
    setIsProcessing(true);
    setProgress(0);
  };

  const handleProcessingComplete = (files?: { vocals: string; instrumental: string }) => {
    setIsProcessing(false);
    setProgress(0);
    if (files) {
      setSeparatedFiles(files);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-900">
      <div className="absolute top-4 left-4">
        <Link href="/mixer">
          <Button className="bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700">
            Go to Mixer
          </Button>
        </Link>
      </div>
      
      <Card className="w-full max-w-3xl bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-gray-100">
            <SplitSquareVertical className="h-6 w-6 text-blue-400" />
            Audio Separator
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload an audio file and extract vocals from instrumentals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="relative">
                <Music2 className="h-12 w-12 animate-pulse text-blue-400" />
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/20"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-100">Processing Audio</h3>
              <div className="w-full max-w-md">
                <Progress value={progress} className="w-full bg-gray-700" />
                <div className="flex justify-center mt-2">
                  <span className="text-sm text-gray-400">Loading...</span>
                </div>
              </div>
              <p className="text-sm text-gray-400">Please wait while we separate vocals from instrumentals...</p>
            </div>
          ) : separatedFiles.vocals && separatedFiles.instrumental ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <h3 className="text-lg font-medium text-gray-100">Your separated tracks are ready!</h3>
              <div className="grid grid-cols-1 gap-4 w-full">
                <DraggableAudioTracks separatedFiles={separatedFiles as any} />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSeparatedFiles({ vocals: null, instrumental: null })}
                className="bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700"
              >
                Process Another File
              </Button>
            </div>
          ) : (
            <AudioSeparator
              onProcessingStart={handleProcessingStart}
              onProcessingComplete={handleProcessingComplete}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
