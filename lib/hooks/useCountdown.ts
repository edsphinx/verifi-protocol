import { useEffect, useState } from 'react';

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

/**
 * Hook to calculate and update countdown timer
 * @param targetTimestamp Unix timestamp in seconds (UTC)
 * @returns TimeRemaining object with formatted time components
 */
export function useCountdown(targetTimestamp: number): TimeRemaining {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetTimestamp)
  );

  useEffect(() => {
    // Update immediately
    setTimeRemaining(calculateTimeRemaining(targetTimestamp));

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(targetTimestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp]);

  return timeRemaining;
}

function calculateTimeRemaining(targetTimestamp: number): TimeRemaining {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds (UTC)
  const difference = targetTimestamp - now;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true,
    };
  }

  const days = Math.floor(difference / 86400);
  const hours = Math.floor((difference % 86400) / 3600);
  const minutes = Math.floor((difference % 3600) / 60);
  const seconds = difference % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds: difference,
    isExpired: false,
  };
}
