export const runtime = "nodejs";

type TranslateRequestBody = {
  transcript?: string;
  targetLanguage?: string;
  contextMode?: string;
  tone?: string;
};

type OpenAIResponsesResponse = {
  output_text?: string;
  error?: {
    message?: string;
  };
};

const TARGET_LANGUAGE_LABELS: Record<string, string> = {
  ja: "Japanese",
  zh: "Chinese",
  en: "English",
};

function normalizeTargetLanguage(targetLanguage: string | undefined): string {
  if (!targetLanguage) return "";
  return TARGET_LANGUAGE_LABELS[targetLanguage] ?? targetLanguage;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as TranslateRequestBody;
  const transcript = body.transcript?.trim();
  const targetLanguage = normalizeTargetLanguage(body.targetLanguage);
  const contextMode = body.contextMode || "general";
  const tone = body.tone || "natural";

  if (!transcript) {
    return Response.json({ error: "Transcript is required." }, { status: 400 });
  }

  if (!targetLanguage) {
    return Response.json(
      { error: "Target language is required." },
      { status: 400 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You are an expert interpreter for real-life conversations in Japan. Translate meaning, intent, and context naturally. Do not add explanations. Return only the translated sentence or phrase.",
        },
        {
          role: "user",
          content: [
            `Target language: ${targetLanguage}`,
            `Context mode: ${contextMode}`,
            `Tone: ${tone}`,
            "",
            "Translate the transcript below naturally for this context. Avoid stiff literal translation.",
            "",
            transcript,
          ].join("\n"),
        },
      ],
    }),
  });

  const data = (await response.json()) as OpenAIResponsesResponse;

  if (!response.ok) {
    return Response.json(
      { error: data.error?.message ?? "Context translation request failed." },
      { status: response.status },
    );
  }

  if (!data.output_text) {
    return Response.json(
      { error: "Translation completed but no text was returned." },
      { status: 502 },
    );
  }

  return Response.json({ translation: data.output_text.trim() });
}
