import MixerTracks from "@/components/mixer";
import MixerHeader from "@/components/mixer-header";
import MixerBlock from "@/components/mixer-block";

export default function MixerPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-900">
      <MixerHeader />
      <div className="flex flex-col gap-8 w-full max-w-2xl">
        <MixerBlock />
        <MixerTracks />
      </div>
    </main>
  );
}