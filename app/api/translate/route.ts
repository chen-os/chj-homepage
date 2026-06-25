export const runtime = "nodejs";

type TranslateRequestBody = {
  text?: string;
  context?: string;
};

type TranslateResponseBody = {
  detectedLanguage: string;
  translatedText: string;
};

type OpenAIResponsesResponse = {
  output_text?: string;
  error?: {
    message?: string;
  };
};

function parseTranslateResponse(raw: string): TranslateResponseBody | null {
  try {
    const parsed = JSON.parse(raw) as Partial<TranslateResponseBody>;
    if (
      typeof parsed.detectedLanguage === "string" &&
      typeof parsed.translatedText === "string"
    ) {
      return {
        detectedLanguage: parsed.detectedLanguage.trim(),
        translatedText: parsed.translatedText.trim(),
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  console.log(
    "OPENAI_API_KEY loaded:",
    !!apiKey,
    apiKey ? apiKey.slice(-4) : "none",
  );
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as TranslateRequestBody;
  const text = body.text?.trim();
  const context = body.context?.trim() || "日常";

  if (!text) {
    return Response.json({ error: "text is required." }, { status: 400 });
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
            "You are an expert interpreter for daily life in Japan. Detect the source language automatically and translate naturally for the given scenario. Do not add explanations. Return only valid JSON with keys detectedLanguage and translatedText. detectedLanguage must be a short Japanese label such as 日本語, 中国語, or 英語. translatedText must be the final translation only.",
        },
        {
          role: "user",
          content: [
            `Scenario: ${context}`,
            "If the source is Japanese, prefer Chinese for the translation unless English is clearly more natural.",
            "If the source is Chinese, prefer Japanese for the translation unless English is clearly more natural.",
            "If the source is English, prefer Japanese for the translation unless Chinese is clearly more natural.",
            "",
            "Input text:",
            text,
          ].join("\n"),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "translate_result",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              detectedLanguage: { type: "string" },
              translatedText: { type: "string" },
            },
            required: ["detectedLanguage", "translatedText"],
          },
        },
      },
    }),
  });

  const data = (await response.json()) as OpenAIResponsesResponse;

  if (!response.ok) {
    console.error("OpenAI translate error:", data);
    return Response.json(
      {
        error:
          "翻訳サービスに接続できませんでした。API設定を確認してください。",
      },
      { status: response.status },
    );
  }

  if (!data.output_text) {
    return Response.json(
      { error: "Translation completed but no text was returned." },
      { status: 502 },
    );
  }

  const parsed = parseTranslateResponse(data.output_text);
  if (!parsed || !parsed.translatedText) {
    return Response.json(
      { error: "Translation response was invalid." },
      { status: 502 },
    );
  }

  return Response.json(parsed);
}
