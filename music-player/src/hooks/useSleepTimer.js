// src/hooks/useSleepTimer.js
import { useState, useEffect, useRef, useCallback } from "react";

const useSleepTimer = (onStop) => {
  const [timerActive,    setTimerActive]    = useState(false);
  const [timerMinutes,   setTimerMinutes]   = useState(30);
  const [timeRemaining,  setTimeRemaining]  = useState(0);
  const [showTimerPanel, setShowTimerPanel] = useState(false);

  const intervalRef = useRef(null);
  const endTimeRef  = useRef(null);
  const onStopRef   = useRef(onStop); 
  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  const formatRemaining = (seconds) => {
    if (seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    endTimeRef.current  = null;
    setTimerActive(false);
    setTimeRemaining(0);
  }, []);

  const startTimer = useCallback((minutes) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const totalSeconds = minutes * 60;
    endTimeRef.current = Date.now() + totalSeconds * 1000;

    setTimerActive(true);
    setTimeRemaining(totalSeconds);
    setShowTimerPanel(false);

    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setTimerActive(false);
        setTimeRemaining(0);
        onStopRef.current?.();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    timerActive,
    timerMinutes,
    timeRemaining,
    showTimerPanel,
    formatRemaining,
    setTimerMinutes,
    setShowTimerPanel,
    startTimer,
    stopTimer,
  };
};

export default useSleepTimer;