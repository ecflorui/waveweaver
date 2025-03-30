"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger 
                value="upload" 
                className="data-[state=active]:bg-gray-600 data-[state=active]:text-gray-100 text-gray-400"
              >
                Upload
              </TabsTrigger>
              <TabsTrigger 
                value="process" 
                className="data-[state=active]:bg-gray-600 data-[state=active]:text-gray-100 text-gray-400"
              >
                Process
              </TabsTrigger>
              <TabsTrigger 
                value="download" 
                className="data-[state=active]:bg-gray-600 data-[state=active]:text-gray-100 text-gray-400"
              >
                Download
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="py-4">
              <AudioSeparator
                onProcessingStart={handleProcessingStart}
                onProcessingComplete={handleProcessingComplete}
              />
            </TabsContent>
            <TabsContent value="process" className="py-4">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Music2 className="h-12 w-12 animate-pulse text-blue-400" />
                <h3 className="text-lg font-medium text-gray-100">Processing Audio</h3>
                <Progress value={66} className="w-full max-w-md bg-gray-700" />
                <p className="text-sm text-gray-400">Please wait while we separate vocals from instrumentals...</p>
              </div>
            </TabsContent>
            <TabsContent value="download" className="py-4">
              <div className="flex flex-col items-center justify-center space-y-6 py-8">
                <h3 className="text-lg font-medium text-gray-100">Your separated tracks are ready!</h3>
                <div className="grid grid-cols-1 gap-4 w-full">
                  {separatedFiles.vocals && separatedFiles.instrumental && (
                    <DraggableAudioTracks separatedFiles={separatedFiles as any} />
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("upload")}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700"
                >
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
