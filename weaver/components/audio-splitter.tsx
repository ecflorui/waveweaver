"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileAudio } from "lucide-react"

interface AudioSplitterProps {
  onProcessingStart: () => void
  onProcessingComplete: () => void
}

export function AudioSplitter({ onProcessingStart, onProcessingComplete }: AudioSplitterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
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

  const processAudio = async () => {
    if (!file) return

    onProcessingStart()

    try {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Create an audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Get the audio data
      const numberOfChannels = audioBuffer.numberOfChannels
      const length = audioBuffer.length
      const sampleRate = audioBuffer.sampleRate

      // Create two new audio buffers (first half and second half)
      const halfLength = Math.floor(length / 2)
      const firstHalf = audioContext.createBuffer(numberOfChannels, halfLength, sampleRate)
      const secondHalf = audioContext.createBuffer(numberOfChannels, length - halfLength, sampleRate)

      // Copy the data to the new buffers
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const firstHalfData = firstHalf.getChannelData(channel)
        const secondHalfData = secondHalf.getChannelData(channel)
        const originalData = audioBuffer.getChannelData(channel)

        // Copy first half
        for (let i = 0; i < halfLength; i++) {
          firstHalfData[i] = originalData[i]
        }

        // Copy second half
        for (let i = 0; i < length - halfLength; i++) {
          secondHalfData[i] = originalData[i + halfLength]
        }
      }

      // Convert the buffers to WAV files
      const firstHalfWav = bufferToWav(firstHalf)
      const secondHalfWav = bufferToWav(secondHalf)

      // Create download links
      const firstHalfBlob = new Blob([firstHalfWav], { type: "audio/wav" })
      const secondHalfBlob = new Blob([secondHalfWav], { type: "audio/wav" })

      const firstHalfUrl = URL.createObjectURL(firstHalfBlob)
      const secondHalfUrl = URL.createObjectURL(secondHalfBlob)

      // Set up download buttons
      setTimeout(() => {
        const firstDownloadBtn = document.getElementById("download-first")
        const secondDownloadBtn = document.getElementById("download-second")

        if (firstDownloadBtn) {
          firstDownloadBtn.onclick = () => {
            const a = document.createElement("a")
            a.href = firstHalfUrl
            a.download = `${file.name.split(".")[0]}_part1.wav`
            a.click()
          }
        }

        if (secondDownloadBtn) {
          secondDownloadBtn.onclick = () => {
            const a = document.createElement("a")
            a.href = secondHalfUrl
            a.download = `${file.name.split(".")[0]}_part2.wav`
            a.click()
          }
        }
      }, 100)

      onProcessingComplete()
    } catch (error) {
      console.error("Error processing audio:", error)
      alert("Error processing audio file. Please try another file.")
      onProcessingComplete()
    }
  }

  // Function to convert AudioBuffer to WAV format
  const bufferToWav = (buffer: AudioBuffer) => {
    const numOfChannels = buffer.numberOfChannels
    const length = buffer.length * numOfChannels * 2 + 44
    const sampleRate = buffer.sampleRate
    const arrayBuffer = new ArrayBuffer(length)
    const view = new DataView(arrayBuffer)

    // RIFF chunk descriptor
    writeString(view, 0, "RIFF")
    view.setUint32(4, length - 8, true)
    writeString(view, 8, "WAVE")

    // FMT sub-chunk
    writeString(view, 12, "fmt ")
    view.setUint32(16, 16, true) // subchunk1size
    view.setUint16(20, 1, true) // audio format (1 for PCM)
    view.setUint16(22, numOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numOfChannels * 2, true) // byte rate
    view.setUint16(32, numOfChannels * 2, true) // block align
    view.setUint16(34, 16, true) // bits per sample

    // Data sub-chunk
    writeString(view, 36, "data")
    view.setUint32(40, length - 44, true)

    // Write the PCM samples
    const dataOffset = 44
    let offset = dataOffset

    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
        offset += 2
      }
    }

    return arrayBuffer
  }

  // Helper function to write a string to a DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-primary/10 p-3">
            <FileAudio className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Drag & drop your audio file</h3>
            <p className="text-sm text-muted-foreground">Supports MP3, WAV, OGG, and other audio formats</p>
          </div>
          <Button onClick={handleUploadClick} variant="outline" className="mt-2">
            <Upload className="mr-2 h-4 w-4" />
            Select File
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
        </div>
      </div>

      {file && (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center space-x-2">
              <FileAudio className="h-5 w-5 text-primary" />
              <span className="font-medium truncate max-w-[200px] md:max-w-[400px]">{file.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
          <Button onClick={processAudio} className="w-full">
            Split Audio
          </Button>
        </div>
      )}
    </div>
  )
}

