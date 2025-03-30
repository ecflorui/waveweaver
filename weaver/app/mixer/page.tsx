'use client'

import AudioMixer from "@/components/audio-mixer";
import MixerHeader from "@/components/mixer-header";
import { useProcessing } from "@/contexts/processing-context";
import { Music2 } from "lucide-react";

export default function MixerPage() {
  const { isProcessing, processingFile } = useProcessing();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-900">
      <MixerHeader />
      <div className="flex flex-col gap-8 w-full max-w-2xl">
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
        ) : (
          <AudioMixer />
        )}
      </div>
    </main>
  );
}