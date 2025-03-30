"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileAudio } from "lucide-react";
import { useRouter } from "next/navigation";

interface AudioSeparatorProps {
  onProcessingStart: () => void;
  onProcessingComplete: (files?: { vocals: string; instrumental: string }) => void;
}

export function AudioSeparator({ onProcessingStart, onProcessingComplete }: AudioSeparatorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      const audioUrl = URL.createObjectURL(e.target.files[0]);
      setAudioSrc(audioUrl);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const separateAudio = async () => {
    if (!file) return;
    onProcessingStart();
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("audioFile", file);

      const response = await fetch("http://localhost:5001/api/separate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process file");
      }

      const data = await response.json();
      console.log("API Response:", data); // Debugging

      if (!data.vocals || !data.instrumental) {
        throw new Error("Invalid API response: missing file paths.");
      }

      router.push(`/finish?vocals=${encodeURIComponent(data.vocals)}&instrumental=${encodeURIComponent(data.instrumental)}`);

      onProcessingComplete({
        vocals: data.vocals,
        instrumental: data.instrumental,
      });
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
      onProcessingComplete();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-primary/10 p-3">
            <FileAudio className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Drag & drop your audio file</h3>
          <Button onClick={handleUploadClick} variant="outline">
            Select File
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
      </div>

      {audioSrc && !isProcessing && (
        <div className="relative mt-4">
          <audio controls src={audioSrc} className="w-full" />
          <Button onClick={separateAudio} className="w-full mt-4">
            Separate Vocals & Instrumental
          </Button>
        </div>
      )}
    </div>
  );
}
