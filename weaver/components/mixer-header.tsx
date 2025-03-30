'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MixerHeader() {
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all tracks?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/mixer-tracks', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tracks');
      }

      // Refresh the page to show updated state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing tracks:', error);
      alert('Failed to clear tracks');
    }
  };

  return (
    <>
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button className="bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700">
            Back to Separator
          </Button>
        </Link>
      </div>
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold text-gray-100">Mixer</h1>
        <Button 
          onClick={handleClearAll}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Clear All Tracks
        </Button>
      </div>
    </>
  );
} 