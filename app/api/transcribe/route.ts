export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

type OpenAITranscriptionResponse = {
  text?: string;
  error?: {
    message?: string;
  };
};

async function readFormData(request: Request): Promise<FormData | null> {
  try {
    return await request.formData();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const formData = await readFormData(request);

  if (!formData) {
    return Response.json(
      { error: "音声データの形式が正しくありません。" },
      { status: 400 },
    );
  }

  const audio = formData.get("audio");

  if (!(audio instanceof File)) {
    return Response.json(
      { error: "audio フィールドに音声ファイルを指定してください。" },
      { status: 400 },
    );
  }

  if (audio.size <= 0) {
    return Response.json(
      { error: "音声ファイルが空です。" },
      { status: 400 },
    );
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return Response.json(
      { error: "音声ファイルが大きすぎます。20MB 以下にしてください。" },
      { status: 413 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      { error: "サーバーに OPENAI_API_KEY が設定されていません。" },
      { status: 500 },
    );
  }

  const openAIFormData = new FormData();
  openAIFormData.append("model", "gpt-4o-mini-transcribe");
  openAIFormData.append("file", audio, audio.name || "recording.mp4");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openAIFormData,
    });

    const data = (await response.json()) as OpenAITranscriptionResponse;

    if (!response.ok) {
      console.error("OpenAI transcribe error:", data.error?.message ?? response.status);
      return Response.json(
        { error: "音声認識サービスに接続できませんでした。API設定を確認してください。" },
        { status: response.status },
      );
    }

    const text = data.text?.trim();

    if (!text) {
      return Response.json(
        { error: "音声認識の結果が空でした。もう一度お試しください。" },
        { status: 502 },
      );
    }

    return Response.json({ text });
  } catch (error) {
    console.error("Transcribe route failed:", error);
    return Response.json(
      { error: "ネットワークエラーが発生しました。少し時間をおいて再度お試しください。" },
      { status: 502 },
    );
  }
}
