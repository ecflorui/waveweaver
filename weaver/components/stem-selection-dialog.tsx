"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface StemSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedStems: string[]) => void
}

export function StemSelectionDialog({ isOpen, onClose, onConfirm }: StemSelectionDialogProps) {
  const [selectedStems, setSelectedStems] = useState<string[]>(["vocals", "instrumental", "drums", "bass"])

  const handleStemToggle = (stem: string) => {
    setSelectedStems(prev => {
      if (prev.includes(stem)) {
        return prev.filter(s => s !== stem)
      } else {
        return [...prev, stem]
      }
    })
  }

  const handleConfirm = () => {
    onConfirm(selectedStems)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Select Stems to Separate</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose which parts of the audio you want to extract
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="vocals" 
              checked={selectedStems.includes("vocals")}
              onCheckedChange={() => handleStemToggle("vocals")}
              className="border-gray-600 data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="vocals" className="text-gray-100">Vocals</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="instrumental" 
              checked={selectedStems.includes("instrumental")}
              onCheckedChange={() => handleStemToggle("instrumental")}
              className="border-gray-600 data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="instrumental" className="text-gray-100">Instrumental</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="drums" 
              checked={selectedStems.includes("drums")}
              onCheckedChange={() => handleStemToggle("drums")}
              className="border-gray-600 data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="drums" className="text-gray-100">Drums</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="bass" 
              checked={selectedStems.includes("bass")}
              onCheckedChange={() => handleStemToggle("bass")}
              className="border-gray-600 data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="bass" className="text-gray-100">Bass</Label>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Separation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 