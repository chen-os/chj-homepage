"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LangCode = "en" | "ja" | "zh";

const TARGET_LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "en", label: "English" },
];

type RecordingStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "processing-speech"
  | "translating"
  | "finished"
  | "error";

type TranslateAppProps = {
  mode?: string;
};

const SCENARIO_LABELS: Record<string, string> = {
  car: "Car Dealer",
  school: "School",
  restaurant: "Restaurant",
  travel: "Travel",
  business: "Business",
  default: "General",
};

function formatMicError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Microphone permission was denied. Allow microphone access in Safari Settings.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No microphone was found on this device.";
    }
    if (error.name === "NotReadableError") {
      return "Microphone is in use by another app.";
    }
    if (error.name === "SecurityError") {
      return "Microphone access requires a secure connection (HTTPS).";
    }
    return error.message || error.name;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to access the microphone.";
}

function getRecorderOptions(): MediaRecorderOptions | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return { mimeType: "audio/mp4" };
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return { mimeType: "audio/webm" };
  }
  return undefined;
}

function getAudioFileName(blob: Blob): string {
  if (blob.type.includes("mp4")) return "recording.mp4";
  if (blob.type.includes("webm")) return "recording.webm";
  if (blob.type.includes("mpeg")) return "recording.mp3";
  return "recording.audio";
}

async function readApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

export function TranslateApp({ mode }: TranslateAppProps) {
  const scenarioLabel = useMemo(
    () => SCENARIO_LABELS[mode ?? "default"] ?? SCENARIO_LABELS.default,
    [mode],
  );

  const [toLang, setToLang] = useState<LangCode>("ja");
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [recordingDurationSec, setRecordingDurationSec] = useState<number | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseMicrophone = useCallback(() => {
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      releaseMicrophone();
    };
  }, [clearTimer, releaseMicrophone]);

  const startRecording = () => {
    console.log("start button clicked");

    setErrorMessage("");
    setRecordingDurationSec(null);
    setTranscript("");
    setTranslation("");

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const msg =
        "Microphone API is not available. Use Safari on iOS 14.3+ over HTTPS.";
      console.log("recording error", msg);
      setStatus("error");
      setErrorMessage(msg);
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      const msg = "Recording is not supported on this browser.";
      console.log("recording error", msg);
      setStatus("error");
      setErrorMessage(msg);
      return;
    }

    releaseMicrophone();
    clearTimer();
    chunksRef.current = [];
    startedAtRef.current = null;
    setStatus("requesting");
    console.log("requesting microphone");

    // Must invoke getUserMedia synchronously inside the click handler (Safari).
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        console.log("microphone granted");

        mediaStreamRef.current = stream;

        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, getRecorderOptions());
        } catch (err) {
          console.log("recording error", err);
          releaseMicrophone();
          setStatus("error");
          setErrorMessage(formatMicError(err));
          return;
        }

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
            console.log("audio chunk received", event.data.size);
          }
        };

        recorder.onerror = (event) => {
          console.log("recording error", event);
          clearTimer();
          releaseMicrophone();
          setStatus("error");
          setErrorMessage("Recording failed. Please try again.");
        };

        mediaRecorderRef.current = recorder;
        startedAtRef.current = Date.now();
        recorder.start();
        console.log("media recorder started");
        setStatus("recording");
        timerRef.current = window.setInterval(() => {
          if (!startedAtRef.current) return;
          setRecordingDurationSec((Date.now() - startedAtRef.current) / 1000);
        }, 200);
      })
      .catch((err) => {
        console.log("recording error", err);
        clearTimer();
        releaseMicrophone();
        setStatus("error");
        setErrorMessage(formatMicError(err));
      });
  };

  const processAudioBlob = useCallback(
    async (blob: Blob) => {
      try {
        console.log("audio blob", blob);
        setStatus("processing-speech");

        const speechFormData = new FormData();
        speechFormData.append("audio", blob, getAudioFileName(blob));

        const speechResponse = await fetch("/api/speech-to-text", {
          method: "POST",
          body: speechFormData,
        });

        if (!speechResponse.ok) {
          throw new Error(await readApiError(speechResponse));
        }

        const speechData = (await speechResponse.json()) as {
          transcript?: string;
        };
        const nextTranscript = speechData.transcript?.trim();

        if (!nextTranscript) {
          throw new Error("Speech-to-text returned an empty transcript.");
        }

        setTranscript(nextTranscript);
        setStatus("translating");

        const translateResponse = await fetch("/api/context-translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript: nextTranscript,
            targetLanguage: toLang,
            contextMode: mode ?? "general",
            tone: "natural",
          }),
        });

        if (!translateResponse.ok) {
          throw new Error(await readApiError(translateResponse));
        }

        const translateData = (await translateResponse.json()) as {
          translation?: string;
        };

        setTranslation(translateData.translation?.trim() ?? "");
        setStatus("finished");
      } catch (err) {
        console.log("recording error", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Translation failed.");
      }
    },
    [mode, toLang],
  );

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    setStatus("processing-speech");
    clearTimer();

    const finishWithoutRecorder = () => {
      releaseMicrophone();
      setStatus("error");
      setErrorMessage("No active recording session found.");
    };

    if (!recorder || recorder.state === "inactive") {
      finishWithoutRecorder();
      return;
    }

    recorder.onstop = () => {
      console.log("recording stopped");
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/mp4",
      });
      console.log("blob created", blob);

      const startedAt = startedAtRef.current;
      const durationSec = startedAt ? (Date.now() - startedAt) / 1000 : 0;
      setRecordingDurationSec(durationSec);

      releaseMicrophone();
      setTranslation("");
      void processAudioBlob(blob);
    };

    try {
      recorder.stop();
    } catch (err) {
      console.log("recording error", err);
      releaseMicrophone();
      setStatus("error");
      setErrorMessage("Unable to stop recording cleanly.");
    }
  }, [clearTimer, processAudioBlob, releaseMicrophone]);

  const handleToLangChange = useCallback((next: LangCode) => {
    setToLang(next);
  }, []);

  const isRecording = status === "recording";
  const isRequesting = status === "requesting";
  const isProcessing =
    status === "processing-speech" || status === "translating";
  const statusLabel =
    status === "idle"
      ? "Idle"
      : status === "requesting"
        ? "Requesting microphone"
      : status === "recording"
          ? "Recording"
      : status === "processing-speech"
            ? "Processing speech"
      : status === "translating"
              ? "Translating"
      : status === "finished"
                ? "Finished"
                : "Error";

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-white px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-lg">
      <header className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-neutral-400 hover:text-neutral-700"
        >
          ← Home
        </Link>
        <p className="text-[11px] text-neutral-400">{scenarioLabel}</p>
      </header>

      <div className="mt-6 space-y-5">
        <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2">
          <span className="text-[10px] tracking-wide text-neutral-400">Status</span>
          <div className="flex items-center gap-2">
            {isRecording ? (
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            ) : null}
            <span className="text-[12px] font-medium text-neutral-800">{statusLabel}</span>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500">
          Recording duration:{" "}
          <span className="tabular-nums text-neutral-800">
            {recordingDurationSec ? recordingDurationSec.toFixed(1) : "0.0"}s
          </span>
        </p>

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-[11px] leading-relaxed text-neutral-700"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="space-y-3">
          <div>
            <span className="mb-1.5 block text-[10px] tracking-wide text-neutral-400">
              From
            </span>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 text-[13px] text-neutral-600">
              Auto Detect
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[10px] tracking-wide text-neutral-400">
              To
            </span>
            <select
              value={toLang}
              onChange={(e) => handleToLangChange(e.target.value as LangCode)}
              disabled={isRecording || isRequesting || isProcessing}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50"
            >
              {TARGET_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording || isRequesting || isProcessing}
            className={`flex-1 rounded-lg border py-2.5 text-[12px] font-medium tracking-wide text-white disabled:opacity-40 ${
              isRecording || isRequesting
                ? "border-red-600 bg-red-600"
                : "border-neutral-900 bg-neutral-900"
            }`}
          >
            Start Recording
          </button>
          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording || isProcessing}
            className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-[12px] tracking-wide text-neutral-700 disabled:opacity-40"
          >
            Stop
          </button>
        </div>

        <section>
          <h2 className="text-[10px] tracking-wide text-neutral-400">Transcript</h2>
          <div className="mt-2 min-h-[72px] rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-3 text-[13px] leading-relaxed text-neutral-800">
            {transcript || "—"}
          </div>
        </section>

        <section>
          <h2 className="text-[10px] tracking-wide text-neutral-400">Translation</h2>
          <div className="mt-2 min-h-[72px] rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-3 text-[13px] leading-relaxed text-neutral-800">
            {translation || "—"}
          </div>
        </section>

        <p className="text-center text-[10px] leading-relaxed text-neutral-300">
          Text-to-speech is not enabled yet.
        </p>
      </div>

      <footer className="mt-auto pt-10 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}
