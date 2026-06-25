# Translate Module

## Overview

The Translate module provides daily-life Chinese-Japanese text translation for `chj.jp`.

## Routes

- Page: `/translate`
- API: `/api/translate`

## Current Capabilities

- Chinese to Japanese translation.
- Japanese to Chinese translation.
- Translation direction selection.
- Scene selection for translation context.
- Text input.
- Kana display for Chinese to Japanese output.
- Copy-to-clipboard for translated text.
- Server-side OpenAI API calls.
- User-facing error handling.
- Production UI without temporary debug output.

## Scenes

Current scene options:

- 日常
- 学校
- 銀行
- 病院
- レストラン
- 電話
- ビジネス

## API Integration

The module uses the OpenAI Responses API from a server-side Next.js API route. `OPENAI_API_KEY` must be configured on the server and must never be exposed to frontend code.

Current JSON contract:

```ts
// Request
{
  text: string;
  direction: "zh-to-ja" | "ja-to-zh";
  scene?: string;
}

// Success response
{
  sourceText: string;
  translatedText: string;
  kanaText?: string;
}

// Error response
{
  error: string;
}
```

## Current Status

The text translation workflow is the current stable feature of the project. The page relies on the stable `/api/translate` JSON contract and includes a backward-compatible optional `kanaText` field for Chinese to Japanese translations.

## Next Steps

- Phrase explanations.
- Read-aloud support.
- Favorites.
- History.
- OCR input.
- Speech input.

## Related Documents

- [Project Vision](../PROJECT.md)
- [Roadmap](../ROADMAP.md)
- [Coding Style](../CODING_STYLE.md)
