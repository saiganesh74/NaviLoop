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
      {/* 5-Minute Warning Alert - Mobile Optimized */}
      <AlertDialog open={fiveMinuteAlert} onOpenChange={onFiveMinuteAlertClose}>
        <AlertDialogContent className="max-w-[85vw] w-full mx-2 sm:mx-4 sm:max-w-md z-[9999] border-2 border-orange-500 p-4 sm:p-6">
          <AlertDialogHeader className="space-y-2 sm:space-y-3">
            <div className="flex justify-center mb-1 sm:mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-orange-600 dark:text-orange-400 animate-pulse" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-base sm:text-lg md:text-xl font-bold leading-tight">
              🚌 Bus Approaching!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-2 sm:space-y-3 px-1 sm:px-2">
                <div className="text-xs sm:text-sm md:text-base">
                  <span className="font-semibold">Bus {busId}</span> is approximately{' '}
                  <span className="font-bold text-orange-600 dark:text-orange-400 text-sm sm:text-base md:text-lg">
                    {Math.round(eta)} minutes away
                  </span>{' '}
                  from your location.
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground p-1.5 sm:p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Get ready at your pickup point!</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-3 sm:mt-4">
            <AlertDialogAction 
              onClick={onFiveMinuteAlertClose}
              className="w-full bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11"
            >
              Got it! I'm Ready 🚶‍♂️
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* College Exit Alert - Mobile Optimized */}
      <AlertDialog open={collegeExitAlert} onOpenChange={onCollegeExitAlertClose}>
        <AlertDialogContent className="max-w-[85vw] w-full mx-2 sm:mx-4 sm:max-w-md z-[9999] border-2 border-blue-500 p-4 sm:p-6">
          <AlertDialogHeader className="space-y-2 sm:space-y-3">
            <div className="flex justify-center mb-1 sm:mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <School className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-base sm:text-lg md:text-xl font-bold leading-tight">
              🏦 Bus Departed from College
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-2 sm:space-y-3 px-1 sm:px-2">
                <div className="text-xs sm:text-sm md:text-base">
                  <span className="font-semibold">Bus {busId}</span> has left{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    St. Peter's Engineering College
                  </span>{' '}
                  and is now on route.
                </div>
                <div className="p-1.5 sm:p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm">
                    <Bus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium text-center">
                      Bus is now heading towards pickup locations
                    </span>
                  </div>
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground px-1 sm:px-2">
                  You'll receive another alert when it's close to your location.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-3 sm:mt-4">
            <AlertDialogAction 
              onClick={onCollegeExitAlertClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11"
            >
              Track My Bus 📍
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
