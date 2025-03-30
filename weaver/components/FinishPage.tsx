import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface FinishPageProps {
  vocals: string;
  instrumental: string;
}

export function FinishPage({ vocals, instrumental }: FinishPageProps) {
  const [vocalsPlaying, setVocalsPlaying] = useState(false);
  const [instrumentalPlaying, setInstrumentalPlaying] = useState(false);

  const vocalsRef = useRef<any>(null);
  const instrumentalRef = useRef<any>(null);
  const wavesurferVocals = useRef<any>(null);
  const wavesurferInstrumental = useRef<any>(null);

  useEffect(() => {
    // Create WaveSurfer instance for vocals
    wavesurferVocals.current = WaveSurfer.create({
      container: vocalsRef.current,
      waveColor: "#ff0000",
      progressColor: "#00ff00",
      cursorColor: "#f00",
      height: 150,
      barWidth: 2,
    });
    wavesurferVocals.current.load(vocals);

    // Create WaveSurfer instance for instrumental
    wavesurferInstrumental.current = WaveSurfer.create({
      container: instrumentalRef.current,
      waveColor: "#00ff00",
      progressColor: "#ff0000",
      cursorColor: "#f00",
      height: 150,
      barWidth: 2,
    });
    wavesurferInstrumental.current.load(instrumental);

    return () => {
      wavesurferVocals.current.destroy();
      wavesurferInstrumental.current.destroy();
    };
  }, [vocals, instrumental]);

  const toggleVocalsPlayback = () => {
    if (vocalsPlaying) {
      wavesurferVocals.current.pause();
    } else {
      wavesurferVocals.current.play();
    }
    setVocalsPlaying(!vocalsPlaying);
  };

  const toggleInstrumentalPlayback = () => {
    if (instrumentalPlaying) {
      wavesurferInstrumental.current.pause();
    } else {
      wavesurferInstrumental.current.play();
    }
    setInstrumentalPlaying(!instrumentalPlaying);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3>Vocals Track</h3>
        <div ref={vocalsRef} className="waveform-container"></div>
        <button onClick={toggleVocalsPlayback}>
          {vocalsPlaying ? "Pause" : "Play"} Vocals
        </button>
      </div>

      <div>
        <h3>Instrumental Track</h3>
        <div ref={instrumentalRef} className="waveform-container"></div>
        <button onClick={toggleInstrumentalPlayback}>
          {instrumentalPlaying ? "Pause" : "Play"} Instrumental
        </button>
      </div>
    </div>
  );
}
