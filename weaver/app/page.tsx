"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Music2, Mic, Music } from "lucide-react"
import { AudioSeparator } from "@/components/audio-separator"
import DraggableAudioTracks from "@/components/download"
import Link from 'next/link'
import { useProcessing } from "@/contexts/processing-context"

export default function Home() {
  const { isProcessing, processingFile, separatedFiles, setSeparatedFiles } = useProcessing();

  // Load from localStorage on client-side only
  useEffect(() => {
    const saved = localStorage.getItem('separatedFiles');
    if (saved) {
      setSeparatedFiles(JSON.parse(saved));
    }
  }, [setSeparatedFiles]);

  // Save to localStorage whenever separatedFiles changes
  useEffect(() => {
    localStorage.setItem('separatedFiles', JSON.stringify(separatedFiles));
  }, [separatedFiles]);

  const handleProcessingComplete = (files?: { vocals: string; instrumental: string; drums: string; bass: string; original_filename: string }) => {
    if (files) {
      setSeparatedFiles(files);
    }
  };

  const handleProcessAnother = () => {
    setSeparatedFiles({
      vocals: null,
      instrumental: null,
      drums: null,
      bass: null,
      original_filename: null,
    });
    localStorage.removeItem('separatedFiles');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gradient-to-b from-gray-900 to-gray-800">
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
            <Music2 className="h-6 w-6 text-blue-400" />
            Audio Separator
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload an audio file and extract vocals from instrumentals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-12">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping"></div>
                <div className="relative bg-blue-400/10 rounded-full p-6">
                  <Music2 className="h-12 w-12 text-blue-400 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-medium text-gray-100">Processing Audio</h3>
                <p className="text-sm text-gray-400">Separating vocals from instrumentals...</p>
                <p className="text-xs text-gray-500">{processingFile}</p>
              </div>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          ) : separatedFiles.vocals || separatedFiles.instrumental || separatedFiles.drums || separatedFiles.bass ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <h3 className="text-lg font-medium text-gray-100">Your separated tracks are ready!</h3>
              <div className="grid grid-cols-1 gap-4 w-full">
                <DraggableAudioTracks separatedFiles={separatedFiles as any} />
              </div>
              <Button 
                variant="outline" 
                onClick={handleProcessAnother}
                className="bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600"
              >
                Process Another File
              </Button>
            </div>
          ) : (
            <div className="py-4">
              <AudioSeparator
                onProcessingComplete={handleProcessingComplete}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
