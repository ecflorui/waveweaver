"use client";

import { useSearchParams } from "next/navigation";
import { FinishPage as FinishComponent } from "@/components/FinishPage"; // Rename import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Finish() { // Change function name from `FinishPage` to `Finish`
  const searchParams = useSearchParams();
  const router = useRouter();

  const vocalsPath = searchParams.get('vocals');
  const instrumentalPath = searchParams.get('instrumental');

  if (!vocalsPath || !instrumentalPath) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Missing audio files. Please try again.</p>
            <Button onClick={() => router.push('/')}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Your Separated Tracks</CardTitle>
        </CardHeader>
        <CardContent>
          <FinishComponent vocals={vocalsPath} instrumental={instrumentalPath} /> {/* Use renamed import */}
          <div className="mt-6">
            <Button onClick={() => router.push('/')}>Process Another File</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
