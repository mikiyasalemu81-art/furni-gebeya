"use client";

import * as React from "react";
import { Mic, Square, Play, Pause, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onAudioReady: (audioBlob: Blob, durationSeconds: number) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onAudioReady, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordSeconds, setRecordSeconds] = React.useState(0);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = React.useState<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Audio recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        onAudioReady(audioBlob, recordSeconds || 1);
        setIsRecording(false);
        setRecordSeconds(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      setRecordSeconds(0);

      // Max 2 minutes (120 seconds) limit
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 119) {
            stopRecording(recorder);
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Microphone error:", err);
      alert("Please allow microphone access to record voice messages.");
    }
  };

  const stopRecording = (recorderInstance?: MediaRecorder | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const rec = recorderInstance || mediaRecorder;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-2xl animate-pulse">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
        <span className="text-xs font-mono font-bold text-red-600">
          {formatTime(recordSeconds)} (max 2:00)
        </span>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => stopRecording()}
          className="h-8 px-2.5 rounded-xl gap-1 text-xs"
        >
          <Square className="w-3.5 h-3.5 fill-current" /> Done
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={cancelRecording}
          className="h-8 px-2 rounded-xl text-muted-foreground hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={disabled}
      onClick={startRecording}
      title="Record Voice Note (max 2 mins)"
      className="rounded-xl shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
    >
      <Mic className="w-4 h-4" />
    </Button>
  );
}

export function VoicePlayer({
  audioUrl,
  durationSeconds,
}: {
  audioUrl: string;
  durationSeconds?: number | null;
}) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<1 | 1.5 | 2>(1);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(durationSeconds || 0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    audioRef.current.playbackRate = nextSpeed;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !duration) {
        setDuration(Math.round(audioRef.current.duration));
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[200px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs hover:scale-105 transition-transform"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Simulated Waveform Bar */}
      <div className="flex-1 flex items-center gap-0.5 h-6">
        {[40, 70, 30, 90, 60, 45, 85, 35, 75, 55, 95, 65, 40].map((h, i) => {
          const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
          const barPercent = (i / 13) * 100;
          const isActive = barPercent <= progressPercent;

          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isActive ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>

      <span className="text-[11px] font-mono font-medium text-muted-foreground">
        {formatSeconds(isPlaying ? currentTime : duration)}
      </span>

      <button
        type="button"
        onClick={toggleSpeed}
        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
      >
        {speed}x
      </button>
    </div>
  );
}
