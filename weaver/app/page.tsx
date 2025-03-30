"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SplitSquareVertical, Download, Music2, Mic, Music } from "lucide-react"
import { AudioSeparator } from "@/components/audio-separator" // Changed to the new component
import DraggableAudioTracks from "@/components/download";
import Link from 'next/link'


// Define SeparatedFiles interface here
interface SeparatedFiles {
  vocals: string | null;
  instrumental: string | null;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [separatedFiles, setSeparatedFiles] = useState<SeparatedFiles>({
    vocals: null,
    instrumental: null,
  });

  const handleProcessingStart = () => {
    setIsProcessing(true);
    setActiveTab("process");
  };

  const handleProcessingComplete = (files?: { vocals: string; instrumental: string }) => {
    setIsProcessing(false);
    setActiveTab("download");
    if (files) {
      setSeparatedFiles(files);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="absolute top-4 left-4">
        <Link href="/mixer">
          <Button>Go to Mixer</Button>
        </Link>
      </div>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <SplitSquareVertical className="h-6 w-6" />
            Audio Separator
          </CardTitle>
          <CardDescription>Upload an audio file and extract vocals from instrumentals</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="py-4">
              <AudioSeparator
                onProcessingStart={handleProcessingStart}
                onProcessingComplete={handleProcessingComplete}
              />
            </TabsContent>
            <TabsContent value="process" className="py-4">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Music2 className="h-12 w-12 animate-pulse text-primary" />
                <h3 className="text-lg font-medium">Processing Audio</h3>
                <Progress value={66} className="w-full max-w-md" />
                <p className="text-sm text-muted-foreground">Please wait while we separate vocals from instrumentals...</p>
              </div>
            </TabsContent>
            <TabsContent value="download" className="py-4">
              <div className="flex flex-col items-center justify-center space-y-6 py-8">
                <h3 className="text-lg font-medium">Your separated tracks are ready!</h3>
                <div className="grid grid-cols-1 gap-4 w-full">
                  {separatedFiles.vocals && separatedFiles.instrumental && (
                    <DraggableAudioTracks separatedFiles={separatedFiles as any} />
                  )}
                </div>
                <Button variant="outline" onClick={() => setActiveTab("upload")}>
                  Process Another File
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
