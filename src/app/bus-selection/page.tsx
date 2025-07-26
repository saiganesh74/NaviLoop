'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BusIcon } from 'lucide-react';

export default function BusSelectionPage() {
  const router = useRouter();
  const buses = Array.from({ length: 9 }, (_, i) => i + 1);

  const handleBusSelect = (busId: number) => {
    router.push(`/?busId=${busId}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">
            Select a Bus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {buses.map((busId) => (
              <Button
                key={busId}
                variant="outline"
                className="h-24 flex-col gap-2 text-lg"
                onClick={() => handleBusSelect(busId)}
              >
                <BusIcon className="h-8 w-8" />
                <span>Bus {busId}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
