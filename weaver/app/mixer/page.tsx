import MixerHeader from "@/components/mixer-header";
import MultiTrackPlayer from "@/components/multimixer";

export default function MixerPage() {
  return (
    <main className="flex h-screen flex-col bg-gray-900">
      <MixerHeader />
      <div className="flex-1">
        <MultiTrackPlayer />
      </div>
    </main>
  );
}