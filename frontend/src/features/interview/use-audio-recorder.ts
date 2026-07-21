"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_MS = 60_000;
export const MIN_MS = 500;

export type AudioRecorderStatus = "idle" | "recording" | "pendingConfirm";

export type AudioRecorderError = {
  kind: "permission" | "unsupported" | "unknown";
  message: string;
};

type UseAudioRecorderResult = {
  status: AudioRecorderStatus;
  blob: Blob | null;
  mimeType: string | null;
  elapsedMs: number;
  error: AudioRecorderError | null;
  isTooShort: boolean;
  start: () => Promise<void>;
  stop: () => void;
  discard: () => void;
};

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function getRecorderMimeType() {
  const preferredMimeType = "audio/webm;codecs=opus";

  return MediaRecorder.isTypeSupported(preferredMimeType)
    ? preferredMimeType
    : undefined;
}

export function useAudioRecorder(): UseAudioRecorderResult {
  const [status, setStatus] = useState<AudioRecorderStatus>("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<AudioRecorderError | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const releaseRecording = useCallback(() => {
    clearTimer();
    stopTracks(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;
  }, [clearTimer]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") return;

    clearTimer();
    recorder.stop();
  }, [clearTimer]);

  const discard = useCallback(() => {
    const recorder = recorderRef.current;

    releaseRecording();
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    if (isMountedRef.current) {
      setStatus("idle");
      setBlob(null);
      setMimeType(null);
      setElapsedMs(0);
      setError(null);
    }
  }, [releaseRecording]);

  const start = useCallback(async () => {
    discard();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError({
        kind: "unsupported",
        message: "Audio recording is not supported by this browser.",
      });
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (caughtError) {
      const isPermissionError =
        caughtError instanceof Error &&
        (caughtError.name === "NotAllowedError" ||
          caughtError.name === "PermissionDeniedError");

      setError({
        kind: isPermissionError ? "permission" : "unknown",
        message: isPermissionError
          ? "Microphone permission was denied."
          : "Unable to access the microphone.",
      });
      return;
    }

    if (!isMountedRef.current) {
      stopTracks(stream);
      return;
    }

    let recorder: MediaRecorder;
    try {
      const preferredMimeType = getRecorderMimeType();
      recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);
    } catch {
      stopTracks(stream);
      setError({
        kind: "unsupported",
        message: "Audio recording is not supported by this browser.",
      });
      return;
    }

    const chunks: BlobPart[] = [];
    const startedAt = Date.now();
    streamRef.current = stream;
    recorderRef.current = recorder;
    setStatus("recording");
    setElapsedMs(0);
    setMimeType(recorder.mimeType || null);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = () => {
      if (recorderRef.current !== recorder) return;

      const recordedElapsedMs = Math.min(MAX_MS, Date.now() - startedAt);
      const recordedMimeType = recorder.mimeType || "audio/webm";
      const recordedBlob = new Blob(chunks, { type: recordedMimeType });

      releaseRecording();
      if (!isMountedRef.current) return;

      setBlob(recordedBlob);
      setMimeType(recordedMimeType);
      setElapsedMs(recordedElapsedMs);
      setStatus("pendingConfirm");
    };

    try {
      recorder.start();
    } catch {
      releaseRecording();
      setStatus("idle");
      setMimeType(null);
      setError({
        kind: "unsupported",
        message: "Audio recording is not supported by this browser.",
      });
      return;
    }

    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      setElapsedMs(Math.min(MAX_MS, Date.now() - startedAt));
    }, 100);
    timeoutRef.current = setTimeout(stop, MAX_MS);
  }, [discard, releaseRecording, stop]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      const recorder = recorderRef.current;
      releaseRecording();
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    };
  }, [releaseRecording]);

  return {
    status,
    blob,
    mimeType,
    elapsedMs,
    error,
    isTooShort: blob === null || elapsedMs < MIN_MS,
    start,
    stop,
    discard,
  };
}
