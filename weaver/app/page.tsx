"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SplitSquareVertical, Download, Music2 } from "lucide-react"
import { AudioSplitter } from "@/components/audio-splitter"

export default function Home() {
  const [activeTab, setActiveTab] = useState("upload")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <SplitSquareVertical className="h-6 w-6" />
            Audio Splitter
          </CardTitle>
          <CardDescription>Upload an audio file and split it into two separate files</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="py-4">
              <AudioSplitter
                onProcessingStart={() => setActiveTab("process")}
                onProcessingComplete={() => setActiveTab("download")}
              />
            </TabsContent>
            <TabsContent value="process" className="py-4">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Music2 className="h-12 w-12 animate-pulse text-primary" />
                <h3 className="text-lg font-medium">Processing Audio</h3>
                <Progress value={66} className="w-full max-w-md" />
                <p className="text-sm text-muted-foreground">Please wait while we split your audio file...</p>
              </div>
            </TabsContent>
            <TabsContent value="download" className="py-4">
              <div className="flex flex-col items-center justify-center space-y-6 py-8">
                <h3 className="text-lg font-medium">Your files are ready!</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">First Half</CardTitle>
                    </CardHeader>
                    <CardFooter>
                      <Button className="w-full" id="download-first">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Second Half</CardTitle>
                    </CardHeader>
                    <CardFooter>
                      <Button className="w-full" id="download-second">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
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
  )
}

