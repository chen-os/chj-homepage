"use client";

import Link from "next/link";
import { useState } from "react";

const DIRECTIONS = [
  {
    id: "zh-to-ja",
    label: "中国語 → 日本語",
    sourceLabel: "中国語",
    targetLabel: "日本語",
    placeholder: "例：明天下午你有一点时间吗？",
  },
  {
    id: "ja-to-zh",
    label: "日本語 → 中国語",
    sourceLabel: "日本語",
    targetLabel: "中国語",
    placeholder: "例：明日の午後、少し時間ありますか？",
  },
] as const;

const TRANSLATE_ENDPOINT = "/api/translate";

type Direction = (typeof DIRECTIONS)[number]["id"];
type TranslateStatus = "idle" | "translating" | "finished" | "error";

type TranslateResponse = {
  translatedText?: string;
  sourceText?: string;
  error?: string;
};

async function readTranslateResponse(response: Response): Promise<TranslateResponse> {
  try {
    return (await response.json()) as TranslateResponse;
  } catch {
    return {};
  }
}

export function TranslateApp() {
  const [direction, setDirection] = useState<Direction>("zh-to-ja");
  const [inputText, setInputText] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [status, setStatus] = useState<TranslateStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [debugResponse, setDebugResponse] = useState<TranslateResponse | null>(
    null,
  );

  const currentDirection =
    DIRECTIONS.find((item) => item.id === direction) ?? DIRECTIONS[0];
  const isTranslating = status === "translating";

  const clearAll = () => {
    setInputText("");
    setSourceText("");
    setTranslatedText("");
    setErrorMessage("");
    setDebugResponse(null);
    setStatus("idle");
  };

  const handleTranslate = async () => {
    const trimmed = inputText.trim();

    if (!trimmed) {
      setErrorMessage("翻訳するテキストを入力してください。");
      setStatus("error");
      return;
    }

    setErrorMessage("");
    setSourceText("");
    setTranslatedText("");
    setDebugResponse(null);
    setStatus("translating");

    try {
      const response = await fetch(TRANSLATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmed,
          direction,
        }),
      });

      const data = await readTranslateResponse(response);
      setDebugResponse(data);

      if (!response.ok) {
        throw new Error(
          data.error || "翻訳に失敗しました。少し時間をおいて再度お試しください。",
        );
      }

      if (!data.translatedText?.trim()) {
        throw new Error("翻訳結果が空でした。もう一度お試しください。");
      }

      setSourceText(data.sourceText?.trim() || trimmed);
      setTranslatedText(data.translatedText.trim());
      setStatus("finished");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "ネットワークエラーが発生しました。",
      );
    }
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col bg-white px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-neutral-950 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-neutral-400">CHJ.JP</p>
          <h1 className="mt-2 text-2xl font-semibold">AI 翻訳</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            日常会話向けに、自然で伝わりやすい表現へ翻訳します。
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600"
        >
          ホーム
        </Link>
      </header>

      <section className="mt-6" aria-label="翻訳方向">
        <p className="text-sm font-medium text-neutral-700">翻訳方向</p>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-neutral-100 p-1">
          {DIRECTIONS.map((item) => {
            const active = item.id === direction;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDirection(item.id);
                  setErrorMessage("");
                }}
                disabled={isTranslating}
                className={`min-h-11 rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                  active
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="translate-input"
            className="text-sm font-medium text-neutral-700"
          >
            {currentDirection.sourceLabel}のテキスト
          </label>
          <span className="text-xs text-neutral-400">{inputText.length} 文字</span>
        </div>
        <textarea
          id="translate-input"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          rows={7}
          disabled={isTranslating}
          placeholder={currentDirection.placeholder}
          className="mt-3 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-3 text-base leading-7 text-neutral-950 outline-none transition placeholder:text-neutral-300 focus:border-neutral-500 disabled:opacity-60"
        />
      </section>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={isTranslating}
          className="min-h-12 rounded-lg bg-neutral-950 px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
        >
          {isTranslating ? "翻訳中..." : "翻訳する"}
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={isTranslating || (!inputText && !translatedText && !errorMessage)}
          className="min-h-12 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-600 disabled:opacity-40"
        >
          クリア
        </button>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm leading-6 text-red-700"
        >
          {errorMessage}
        </p>
      ) : null}

      <section className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-800">翻訳結果</h2>
          <span className="text-xs text-neutral-400">
            {currentDirection.targetLabel}
          </span>
        </div>

        <div className="mt-4 border-b border-neutral-200 pb-4">
          <p className="text-xs font-medium text-neutral-400">原文</p>
          <p className="mt-2 min-h-10 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
            {sourceText || "翻訳後に原文が表示されます。"}
          </p>
        </div>

        <div className="pt-4">
          <p className="text-xs font-medium text-neutral-400">訳文</p>
          <p className="mt-2 min-h-20 whitespace-pre-wrap text-base leading-7 text-neutral-950">
            {translatedText || "翻訳結果がここに表示されます。"}
          </p>
        </div>
      </section>

      <p className="mt-5 text-xs leading-5 text-neutral-400">
        音声入力は準備中です。まずはテキスト翻訳を安定版として提供しています。
      </p>

      <details className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
        <summary className="cursor-pointer font-medium text-neutral-600">
          Debug
        </summary>
        <div className="mt-2 space-y-2">
          <p>Endpoint: {TRANSLATE_ENDPOINT}</p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-white p-2 text-[11px] leading-5 text-neutral-700">
            {debugResponse
              ? JSON.stringify(debugResponse, null, 2)
              : "No response yet."}
          </pre>
        </div>
      </details>
    </main>
  );
}
