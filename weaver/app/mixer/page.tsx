import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MixerTracks from "@/components/mixer";

export default function MixerPage() {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-900">
              <div className="absolute top-4 left-4">
        <Link href="/">
          <Button className="bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700">
            Back to Separator
          </Button>
        </Link>
      </div>
        <h1 className="text-4xl font-bold text-gray-100">Mixer</h1>
        <MixerTracks />
      </main>
    );
  }