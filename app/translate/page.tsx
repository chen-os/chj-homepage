import type { Metadata } from "next";
import { TranslateApp } from "../components/translate-app";

export const metadata: Metadata = {
  title: "AI 翻訳 — CHJ",
  description: "中国語と日本語の日常会話翻訳",
};

export default function TranslatePage() {
  return <TranslateApp />;
}
