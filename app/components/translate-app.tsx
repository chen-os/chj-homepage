"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getMockForMode,
  LANG_LABELS,
  type LangCode,
  type MockTranslation,
} from "../data/translate-mock";

const TARGET_LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "en", label: "English" },
];

type RecordingStatus = "idle" | "requesting" | "recording" | "error";

type TranslateAppProps = {
  mode?: string;
};

function applyTranslation(
  mock: MockTranslation,
  detected: LangCode,
  target: LangCode,
): { translation: string; mismatch: boolean } {
  if (detected === target) {
    return { translation: "", mismatch: true };
  }
  return { translation: mock.translations[target], mismatch: false };
}

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

export function TranslateApp({ mode }: TranslateAppProps) {
  const mock = useMemo(() => getMockForMode(mode), [mode]);

  const [toLang, setToLang] = useState<LangCode>("ja");
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [detectedLang, setDetectedLang] = useState<LangCode | null>(null);
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [languageMismatch, setLanguageMismatch] = useState(false);
  const [readAloud, setReadAloud] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
      releaseMicrophone();
    };
  }, [releaseMicrophone]);

  const startRecording = () => {
    console.log("start button clicked");

    setErrorMessage("");
    setLanguageMismatch(false);
    setReadAloud(false);
    setDetectedLang(null);
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
    chunksRef.current = [];
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
          }
        };

        recorder.onerror = (event) => {
          console.log("recording error", event);
          releaseMicrophone();
          setStatus("error");
          setErrorMessage("Recording failed. Please try again.");
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        console.log("recording started");
        setStatus("recording");
      })
      .catch((err) => {
        console.log("recording error", err);
        releaseMicrophone();
        setStatus("error");
        setErrorMessage(formatMicError(err));
      });
  };

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    const finishWithMock = () => {
      releaseMicrophone();
      setStatus("idle");

      const detected = mock.detectedLang;
      setDetectedLang(detected);
      setTranscript(mock.transcript);

      const result = applyTranslation(mock, detected, toLang);
      setLanguageMismatch(result.mismatch);
      setTranslation(result.translation);
    };

    if (!recorder || recorder.state === "inactive") {
      finishWithMock();
      return;
    }

    recorder.onstop = () => {
      finishWithMock();
    };

    try {
      recorder.stop();
    } catch (err) {
      console.log("recording error", err);
      finishWithMock();
    }
  }, [mock, toLang, releaseMicrophone]);

  const handleToLangChange = useCallback(
    (next: LangCode) => {
      setToLang(next);
      if (!detectedLang || !transcript) return;

      const result = applyTranslation(mock, detectedLang, next);
      setLanguageMismatch(result.mismatch);
      setTranslation(result.translation);
    },
    [detectedLang, transcript, mock],
  );

  const handleReadAloud = useCallback(() => {
    if (!translation) return;
    setReadAloud(true);
    window.setTimeout(() => setReadAloud(false), 1800);
  }, [translation]);

  const isRecording = status === "recording";
  const isRequesting = status === "requesting";
  const statusLabel =
    status === "idle"
      ? "Idle"
      : status === "requesting"
        ? "Requesting microphone"
        : status === "recording"
          ? "Recording"
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
        <p className="text-[11px] text-neutral-400">{mock.scenarioLabel}</p>
      </header>

      <div className="mt-6 space-y-5">
        <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2">
          <span className="text-[10px] tracking-wide text-neutral-400">Status</span>
          <span className="text-[12px] font-medium text-neutral-800">{statusLabel}</span>
        </div>

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
              {detectedLang ? (
                <span className="text-neutral-900">
                  {" "}
                  · {LANG_LABELS[detectedLang]}
                </span>
              ) : null}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[10px] tracking-wide text-neutral-400">
              To
            </span>
            <select
              value={toLang}
              onChange={(e) => handleToLangChange(e.target.value as LangCode)}
              disabled={isRecording || isRequesting}
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

        {languageMismatch && detectedLang ? (
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[11px] leading-relaxed text-neutral-600">
            Input was detected as {LANG_LABELS[detectedLang]}, same as your
            target language. Please choose a different target language.
          </p>
        ) : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording || isRequesting}
            className="flex-1 rounded-lg border border-neutral-900 bg-neutral-900 py-2.5 text-[12px] font-medium tracking-wide text-white disabled:opacity-40"
          >
            Start Recording
          </button>
          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording}
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

        <button
          type="button"
          onClick={handleReadAloud}
          disabled={!translation}
          className="w-full rounded-lg border border-neutral-200 py-2.5 text-[12px] tracking-wide text-neutral-700 disabled:opacity-40"
        >
          {readAloud ? "Playing…" : "Read Aloud"}
        </button>
      </div>

      <footer className="mt-auto pt-10 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}
