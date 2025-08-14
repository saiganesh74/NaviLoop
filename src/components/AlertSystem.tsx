'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bus, Clock, AlertTriangle, School, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertSystemProps {
  busId: string;
  fiveMinuteAlert: boolean;
  onFiveMinuteAlertClose: () => void;
  collegeExitAlert: boolean;
  onCollegeExitAlertClose: () => void;
  eta?: number;
}

export default function AlertSystem({
  busId,
  fiveMinuteAlert,
  onFiveMinuteAlertClose,
  collegeExitAlert,
  onCollegeExitAlertClose,
  eta = 5,
}: AlertSystemProps) {
  // Debug logging
  React.useEffect(() => {
    console.log('🚨 AlertSystem props:', {
      busId,
      fiveMinuteAlert,
      collegeExitAlert,
      eta
    });
  }, [busId, fiveMinuteAlert, collegeExitAlert, eta]);

  return (
    <>
      {/* 5-Minute Warning Alert */}
      <AlertDialog open={fiveMinuteAlert} onOpenChange={onFiveMinuteAlertClose}>
        <AlertDialogContent className="max-w-md z-[9999] border-2 border-orange-500">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-pulse" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold">
              🚌 Bus Approaching!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-2">
                <div className="text-base">
                  <span className="font-semibold">Bus {busId}</span> is approximately{' '}
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(eta)} minutes away
                  </span>{' '}
                  from your location.
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Get ready at your pickup point!</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={onFiveMinuteAlertClose}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Got it! I'm Ready 🚶‍♂️
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* College Exit Alert */}
      <AlertDialog open={collegeExitAlert} onOpenChange={onCollegeExitAlertClose}>
        <AlertDialogContent className="max-w-md z-[9999] border-2 border-blue-500">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <School className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold">
              🏫 Bus Departed from College
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3">
                <div className="text-base">
                  <span className="font-semibold">Bus {busId}</span> has left{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    St. Peter's Engineering College
                  </span>{' '}
                  and is now on route.
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Bus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                      Bus is now heading towards pickup locations
                    </span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  You'll receive another alert when it's close to your location.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={onCollegeExitAlertClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Track My Bus 📍
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
