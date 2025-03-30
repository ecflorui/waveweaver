"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileAudio } from "lucide-react"
import { StemSelectionDialog } from "./stem-selection-dialog"

interface AudioSeparatorProps {
  onProcessingStart: () => void
  onProcessingComplete: (files?: { vocals: string, instrumental: string, drums: string, bass: string, original_filename: string }) => void
}

export function AudioSeparator({ onProcessingStart, onProcessingComplete }: AudioSeparatorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showStemDialog, setShowStemDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleSeparateClick = () => {
    setShowStemDialog(true)
  }

  const separateAudio = async (selectedStems: string[]) => {
    if (!file) return

    onProcessingStart()

    try {
      const formData = new FormData()
      formData.append('audioFile', file)
      formData.append('stems', JSON.stringify(selectedStems))

      const response = await fetch('http://localhost:5001/api/separate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process file')
      }

      const data = await response.json()
      onProcessingComplete({
        vocals: data.vocals,
        instrumental: data.instrumental,
        drums: data.drums,
        bass: data.bass,
        original_filename: data.original_filename
      })

    } catch (error) {
      console.error("Error separating audio:", error)
      alert(`Error separating audio file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      onProcessingComplete()
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? "border-blue-400 bg-blue-400/10" 
            : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-blue-400/10 p-3">
            <FileAudio className="h-8 w-8 text-blue-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-100">Drag & drop your audio file</h3>
            <p className="text-sm text-gray-400">Supports MP3, MP4, WAV, and more formats</p>
          </div>
          <Button 
            onClick={handleUploadClick} 
            variant="outline" 
            className="bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600"
          >
            <Upload className="mr-2 h-4 w-4" />
            Select File
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="audio/*,video/*" 
            className="hidden" 
          />
        </div>
      </div>

      {file && (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between rounded-md border border-gray-700 p-3 bg-gray-800/50">
            <div className="flex items-center space-x-2">
              <FileAudio className="h-5 w-5 text-blue-400" />
              <span className="font-medium text-gray-100 truncate max-w-[200px] md:max-w-[400px]">{file.name}</span>
            </div>
            <span className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
          <Button 
            onClick={handleSeparateClick} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Separate Audio
          </Button>
        </div>
      )}

      <StemSelectionDialog 
        isOpen={showStemDialog}
        onClose={() => setShowStemDialog(false)}
        onConfirm={separateAudio}
      />
    </div>
  )
}