import { TranslateApp } from "../components/translate-app";

type TranslatePageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function TranslatePage({ searchParams }: TranslatePageProps) {
  const { mode } = await searchParams;
  return <TranslateApp mode={mode} />;
}
