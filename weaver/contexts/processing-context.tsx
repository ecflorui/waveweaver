'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

interface SeparatedFiles {
  vocals: string | null;
  instrumental: string | null;
  drums: string | null;
  bass: string | null;
  original_filename: string | null;
}

interface ProcessingContextType {
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  processingFile: string | null;
  setProcessingFile: (value: string | null) => void;
  separatedFiles: SeparatedFiles;
  setSeparatedFiles: (files: SeparatedFiles) => void;
}

const initialSeparatedFiles: SeparatedFiles = {
  vocals: null,
  instrumental: null,
  drums: null,
  bass: null,
  original_filename: null,
};

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [separatedFiles, setSeparatedFiles] = useState<SeparatedFiles>(initialSeparatedFiles);

  return (
    <ProcessingContext.Provider value={{ 
      isProcessing, 
      setIsProcessing, 
      processingFile, 
      setProcessingFile,
      separatedFiles,
      setSeparatedFiles
    }}>
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
} 