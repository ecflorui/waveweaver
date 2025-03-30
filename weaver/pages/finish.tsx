import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FinishPage } from "@/components/FinishPage";

export default function Finish() {
  const router = useRouter();
  const { vocals, instrumental } = router.query;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setLoaded(true);
    }
  }, [router.isReady]);

  if (!loaded) {
    return <div>Loading...</div>;
  }

  if (!vocals || !instrumental) {
    return <div>Error: Missing audio files.</div>;
  }

  return (
    <div>
      <FinishPage vocals={String(vocals)} instrumental={String(instrumental)} />
    </div>
  );
}
