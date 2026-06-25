import type { Metadata } from "next";
import { TranslateApp } from "../components/translate-app";

export const metadata: Metadata = {
  title: "AI Translator — CHJ",
  description: "AI リアルタイム翻訳",
};

export default function TranslatePage() {
  return <TranslateApp />;
}
