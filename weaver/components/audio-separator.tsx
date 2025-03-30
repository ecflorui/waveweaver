"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileAudio } from "lucide-react"
import { StemSelectionDialog } from "./stem-selection-dialog"
import { useProcessing } from "@/contexts/processing-context"

interface AudioSeparatorProps {
  onProcessingComplete: (files?: { vocals: string, instrumental: string, drums: string, bass: string, original_filename: string }) => void
}

export function AudioSeparator({ onProcessingComplete }: AudioSeparatorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showStemDialog, setShowStemDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setIsProcessing, setProcessingFile } = useProcessing()

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

    setIsProcessing(true)
    setProcessingFile(file.name)

    const formData = new FormData()
    formData.append('audioFile', file)
    formData.append('stems', JSON.stringify(selectedStems))

    try {
      const response = await fetch('http://localhost:5001/api/separate', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to separate audio')
      }

      onProcessingComplete(data)
    } catch (error: any) {
      console.error('Error separating audio:', error)
      alert(`Failed to separate audio: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setProcessingFile(null)
    }
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        className="hidden"
      />
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-400">
          Drag and drop an audio file here, or click to select
        </p>
      </div>

      {file && (
        <div className="flex flex-col space-y-2 mt-4">
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