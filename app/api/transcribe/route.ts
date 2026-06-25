export const runtime = "nodejs";

type OpenAITranscriptionResponse = {
  text?: string;
  error?: {
    message?: string;
  };
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof File)) {
    return Response.json(
      { error: "Missing audio file in FormData field: audio." },
      { status: 400 },
    );
  }

  const openAIFormData = new FormData();
  openAIFormData.append("model", "gpt-4o-mini-transcribe");
  openAIFormData.append("file", audio, audio.name || "recording.mp4");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: openAIFormData,
  });

  const data = (await response.json()) as OpenAITranscriptionResponse;

  if (!response.ok) {
    return Response.json(
      { error: data.error?.message ?? "Transcription request failed." },
      { status: response.status },
    );
  }

  if (!data.text) {
    return Response.json(
      { error: "Transcription completed but no text was returned." },
      { status: 502 },
    );
  }

  return Response.json({ text: data.text });
}
