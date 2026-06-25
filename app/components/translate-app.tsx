"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const SCENARIOS = [
  { id: "日常", label: "日常" },
  { id: "学校", label: "学校" },
  { id: "病院", label: "病院" },
  { id: "銀行", label: "銀行" },
  { id: "役所", label: "役所" },
  { id: "レストラン", label: "レストラン" },
  { id: "電話", label: "電話" },
  { id: "ビジネス", label: "ビジネス" },
] as const;

type ScenarioId = (typeof SCENARIOS)[number]["id"];

type RecordingStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "transcribing"
  | "translating"
  | "finished"
  | "error";

function formatMicError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "マイクの許可が必要です。Safari の設定でマイクを許可してください。";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "この端末でマイクが見つかりません。";
    }
    if (error.name === "NotReadableError") {
      return "マイクは他のアプリで使用中です。";
    }
    if (error.name === "SecurityError") {
      return "マイクの利用には HTTPS 接続が必要です。";
    }
    return error.message || error.name;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "マイクにアクセスできません。";
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

function resolveSpeechLang(detectedLanguage: string): string {
  if (detectedLanguage.includes("日本")) return "zh-CN";
  if (detectedLanguage.includes("中国")) return "ja-JP";
  if (detectedLanguage.includes("英")) return "ja-JP";
  return "ja-JP";
}

export function TranslateApp() {
  const [context, setContext] = useState<ScenarioId>("日常");
  const [inputText, setInputText] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);

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
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [releaseMicrophone]);

  const translateText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setErrorMessage("翻訳するテキストを入力してください。");
        setStatus("error");
        return;
      }

      setErrorMessage("");
      setStatus("translating");

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: trimmed,
            context,
          }),
        });

        if (!response.ok) {
          throw new Error(await readApiError(response));
        }

        const data = (await response.json()) as {
          detectedLanguage?: string;
          translatedText?: string;
        };

        setDetectedLanguage(data.detectedLanguage?.trim() ?? "");
        setTranslatedText(data.translatedText?.trim() ?? "");
        setStatus("finished");
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "翻訳に失敗しました。",
        );
      }
    },
    [context],
  );

  const processAudioBlob = useCallback(
    async (blob: Blob) => {
      try {
        setStatus("transcribing");

        const formData = new FormData();
        formData.append("audio", blob, getAudioFileName(blob));

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await readApiError(response));
        }

        const data = (await response.json()) as { text?: string };
        const nextText = data.text?.trim();

        if (!nextText) {
          throw new Error("音声認識の結果が空でした。");
        }

        setInputText(nextText);
        await translateText(nextText);
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "音声認識に失敗しました。",
        );
      }
    },
    [translateText],
  );

  const startRecording = () => {
    setErrorMessage("");
    setDetectedLanguage("");
    setTranslatedText("");

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage(
        "このブラウザは録音に対応していません。iOS 14.3 以降の Safari と HTTPS をご利用ください。",
      );
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setStatus("error");
      setErrorMessage("このブラウザは MediaRecorder に対応していません。");
      return;
    }

    releaseMicrophone();
    chunksRef.current = [];
    startedAtRef.current = null;
    setStatus("requesting");

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaStreamRef.current = stream;

        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, getRecorderOptions());
        } catch (error) {
          releaseMicrophone();
          setStatus("error");
          setErrorMessage(formatMicError(error));
          return;
        }

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          releaseMicrophone();
          setStatus("error");
          setErrorMessage("録音中にエラーが発生しました。");
        };

        mediaRecorderRef.current = recorder;
        startedAtRef.current = Date.now();
        recorder.start();
        setStatus("recording");
      })
      .catch((error) => {
        releaseMicrophone();
        setStatus("error");
        setErrorMessage(formatMicError(error));
      });
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      releaseMicrophone();
      setStatus("error");
      setErrorMessage("録音セッションが見つかりません。");
      return;
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/mp4",
      });
      releaseMicrophone();
      void processAudioBlob(blob);
    };

    try {
      recorder.stop();
    } catch {
      releaseMicrophone();
      setStatus("error");
      setErrorMessage("録音の停止に失敗しました。");
    }
  };

  const handleSpeak = () => {
    if (!translatedText.trim()) return;

    if (typeof window === "undefined" || !window.speechSynthesis) {
      setErrorMessage("このブラウザは読み上げに対応していません。");
      setStatus("error");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = resolveSpeechLang(detectedLanguage);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const isRecording = status === "recording";
  const isRequesting = status === "requesting";
  const isBusy =
    status === "transcribing" ||
    status === "translating" ||
    isRequesting;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-white px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-lg">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-400">
              CHJ.JP
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
              AI Translator
            </h1>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-[10px] tracking-wide text-neutral-500"
          >
            ホーム
          </Link>
        </div>
      </header>

      <section aria-label="シーン選択">
        <p className="text-[10px] tracking-wide text-neutral-400">シーン</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SCENARIOS.map((scenario) => {
            const active = context === scenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setContext(scenario.id)}
                disabled={isRecording || isBusy}
                className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors disabled:opacity-40 ${
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                {scenario.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <label htmlFor="translate-input" className="text-[10px] tracking-wide text-neutral-400">
          入力テキスト
        </label>
        <textarea
          id="translate-input"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          rows={4}
          disabled={isRecording || isBusy}
          placeholder="翻訳したい文章を入力"
          className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-[14px] leading-relaxed text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50"
        />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => void translateText(inputText)}
          disabled={isRecording || isBusy}
          className="rounded-2xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-[13px] font-medium text-white disabled:opacity-40"
        >
          翻訳する
        </button>
        <button
          type="button"
          onClick={startRecording}
          disabled={isRecording || isBusy}
          className="rounded-2xl border border-neutral-200 px-4 py-3 text-[13px] text-neutral-800 disabled:opacity-40"
        >
          録音開始
        </button>
        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording || isBusy}
          className="rounded-2xl border border-neutral-200 px-4 py-3 text-[13px] text-neutral-800 disabled:opacity-40"
        >
          録音停止
        </button>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[12px] leading-relaxed text-neutral-700"
        >
          {errorMessage}
        </p>
      ) : null}

      {isRecording ? (
        <p className="mt-4 text-[12px] text-red-600">録音中...</p>
      ) : null}

      {isBusy && !isRecording ? (
        <p className="mt-4 text-[12px] text-neutral-500">
          {status === "transcribing" ? "音声を認識しています..." : "翻訳しています..."}
        </p>
      ) : null}

      <section className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[10px] tracking-wide text-neutral-400">翻訳結果</h2>
          {detectedLanguage ? (
            <span className="text-[10px] text-neutral-500">
              検出言語: {detectedLanguage}
            </span>
          ) : null}
        </div>
        <p className="mt-3 min-h-[72px] text-[15px] leading-relaxed text-neutral-900">
          {translatedText || "翻訳結果がここに表示されます"}
        </p>
        <button
          type="button"
          onClick={handleSpeak}
          disabled={!translatedText || isSpeaking}
          className="mt-4 rounded-full border border-neutral-200 bg-white px-4 py-2 text-[12px] text-neutral-700 disabled:opacity-40"
        >
          {isSpeaking ? "読み上げ中..." : "読み上げ"}
        </button>
      </section>

      <footer className="mt-auto pt-10 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}
