export const runtime = "nodejs";

const DIRECTIONS = {
  "zh-to-ja": {
    sourceLanguage: "Chinese",
    targetLanguage: "Japanese",
    sourceLabel: "中国語",
    targetLabel: "日本語",
  },
  "ja-to-zh": {
    sourceLanguage: "Japanese",
    targetLanguage: "Chinese",
    sourceLabel: "日本語",
    targetLabel: "中国語",
  },
} as const;

type Direction = keyof typeof DIRECTIONS;

type TranslateRequestBody = {
  text?: string;
  direction?: Direction;
};

type TranslateResponseBody = {
  sourceText: string;
  translatedText: string;
  kanaText?: string;
};

type OpenAIResponseOutputContent = {
  text?: string;
  json?: unknown;
};

type OpenAIResponseOutputItem = {
  content?: OpenAIResponseOutputContent[];
};

type OpenAIResponsesResponse = {
  output_text?: string;
  output?: OpenAIResponseOutputItem[];
  error?: {
    message?: string;
  };
};

function isDirection(value: unknown): value is Direction {
  return typeof value === "string" && value in DIRECTIONS;
}

async function readRequestBody(request: Request): Promise<TranslateRequestBody | null> {
  try {
    return (await request.json()) as TranslateRequestBody;
  } catch {
    return null;
  }
}

function extractResponseText(data: OpenAIResponsesResponse): string | null {
  const outputText = data.output_text?.trim();

  if (outputText) {
    return outputText;
  }

  const contentTexts =
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => {
        if (typeof content.text === "string" && content.text.trim()) {
          return content.text.trim();
        }

        if (content.json !== undefined) {
          return JSON.stringify(content.json);
        }

        return "";
      })
      .filter(Boolean) ?? [];

  if (contentTexts.length > 0) {
    return contentTexts.join("\n");
  }

  return null;
}

function parseTranslateResponse(raw: string): TranslateResponseBody | null {
  try {
    const parsed = JSON.parse(raw) as Partial<TranslateResponseBody>;

    if (
      typeof parsed.sourceText === "string" &&
      typeof parsed.translatedText === "string"
    ) {
      return {
        sourceText: parsed.sourceText.trim(),
        translatedText: parsed.translatedText.trim(),
        kanaText:
          typeof parsed.kanaText === "string" ? parsed.kanaText.trim() : "",
      };
    }
  } catch {
    const translatedText = raw.trim();

    if (translatedText) {
      return {
        sourceText: "",
        translatedText,
      };
    }
  }

  return null;
}

export async function POST(request: Request) {
  const body = await readRequestBody(request);

  if (!body) {
    return Response.json(
      { error: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }

  const text = body.text?.trim();

  if (!text) {
    return Response.json(
      { error: "翻訳するテキストを入力してください。" },
      { status: 400 },
    );
  }

  if (!isDirection(body.direction)) {
    return Response.json(
      { error: "翻訳方向を選択してください。" },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      { error: "サーバーに OPENAI_API_KEY が設定されていません。" },
      { status: 500 },
    );
  }

  const direction = DIRECTIONS[body.direction];

  try {
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
            content: [
              "You are a careful Chinese-Japanese translator for daily communication.",
              "Translate naturally and conversationally, suitable for everyday messages.",
              "Keep the meaning faithful, but choose phrases that sound normal to native speakers.",
              "Do not add explanations, notes, honorific analysis, or alternatives.",
              "When translating from Chinese to Japanese, include kanaText with the Japanese reading in natural hiragana. When translating from Japanese to Chinese, kanaText must be an empty string.",
              "Return only valid JSON that matches the provided schema.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Translate from ${direction.sourceLanguage} to ${direction.targetLanguage}.`,
              `Source label: ${direction.sourceLabel}`,
              `Target label: ${direction.targetLabel}`,
              "",
              "Text:",
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
                sourceText: { type: "string" },
                translatedText: { type: "string" },
                kanaText: { type: "string" },
              },
              required: ["sourceText", "translatedText", "kanaText"],
            },
            strict: true,
          },
        },
      }),
    });

    const data = (await response.json()) as OpenAIResponsesResponse;

    if (process.env.NODE_ENV !== "production") {
      console.log("OpenAI translate full response:", JSON.stringify(data, null, 2));
    }

    if (!response.ok) {
      console.error("OpenAI translate error:", data.error?.message ?? response.status);
      return Response.json(
        { error: "翻訳サービスに接続できませんでした。API設定を確認してください。" },
        { status: response.status },
      );
    }

    const responseText = extractResponseText(data);

    if (!responseText) {
      return Response.json(
        { error: "翻訳結果が返ってきませんでした。もう一度お試しください。" },
        { status: 502 },
      );
    }

    const parsed = parseTranslateResponse(responseText);

    if (!parsed?.translatedText) {
      return Response.json(
        { error: "翻訳結果の形式が正しくありませんでした。もう一度お試しください。" },
        { status: 502 },
      );
    }

    return Response.json({
      sourceText: parsed.sourceText || text,
      translatedText: parsed.translatedText,
      kanaText: parsed.kanaText ?? "",
    });
  } catch (error) {
    console.error("Translate route failed:", error);
    return Response.json(
      { error: "ネットワークエラーが発生しました。少し時間をおいて再度お試しください。" },
      { status: 502 },
    );
  }
}
