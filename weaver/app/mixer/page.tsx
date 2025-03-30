import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MixerPage() {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
              <div className="absolute top-4 left-4">
        <Link href="/">
          <Button>Back to Separator</Button>
        </Link>
      </div>
        <h1 className="text-4xl font-bold">Mixer</h1>
        {/* Add your mixer components and content here */}
      </main>
    );
  }