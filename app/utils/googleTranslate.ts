import translateGoogle from "google-translate-api-x";
import { GoogleTranslator } from "anylang/translators";

export async function translateText(
  text: string,
  locale: string = "en",
): Promise<string> {
  if (typeof text !== "string" || !text.trim()) {
    return text;
  }

  const cleanText = text.trim();
  const target = locale.toLowerCase();

  // If target language is invalid, return original text
  if (!target) {
    return cleanText;
  }

  const isValid = (res: string) =>
    !!res &&
    res.trim().length > 0 &&
    res.trim() !== cleanText;

  const LINGVA_URL = "https://lingva.ml/api/v1";

  // ---------------------------------------------------------------------------
  // 1️⃣ google-translate-api-x (Primary and most reliable)
  // ---------------------------------------------------------------------------
  try {
    const res = await translateGoogle(cleanText, { to: target });
    // @ts-ignore
    if (res?.text && isValid(res.text)) {
      return res.text;
    }
  } catch (_) { }

  // ---------------------------------------------------------------------------
  // 2️⃣ anylang (Google-based fallback)
  // ---------------------------------------------------------------------------
  try {
    const translator = new GoogleTranslator();
    const res = await translator.translate(cleanText, "auto", target);

    if (isValid(res)) {
      return res;
    }
  } catch (_) { }

  // ---------------------------------------------------------------------------
  // 3️⃣ Direct Google Translate API
  // ---------------------------------------------------------------------------
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(
        cleanText,
      )}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      if (response.ok) {
        const data: any = await response.json();
        const translatedText =
          data?.[0]?.map((item: any) => item[0]).join("");

        if (isValid(translatedText)) {
          return translatedText;
        }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (_) { }

  // ---------------------------------------------------------------------------
  // 4️⃣ Lingva Translate (community-hosted Google proxy)
  // ---------------------------------------------------------------------------
  try {
    const lingvaUrl =
      `${LINGVA_URL}/auto/${target}/${encodeURIComponent(cleanText)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(lingvaUrl, {
        signal: controller.signal,
      });

      const rawText = await response.text();

      if (response.ok) {
        let data: any = null;

        try {
          data = JSON.parse(rawText);
        } catch (_) {
          // Ignore JSON parse errors
        }

        const translated = data?.translation;

        if (isValid(translated)) {
          return translated;
        }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (_) { }

  // ---------------------------------------------------------------------------
  // Final fallback: return original text if all providers fail
  // ---------------------------------------------------------------------------
  return cleanText;
}

export async function batchTranslateText(
  texts: string[],
  targetLang: string,
): Promise<Record<string, string>> {
  if (!texts.length || !targetLang) return {};

  const CHUNK_SIZE = 5;

  // ✅ remove empty + deduplicate and trim each text strictly
  const uniqueTexts = [
    ...new Set(
      texts
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
    ),
  ];

  const result: Record<string, string> = {};

  for (let i = 0; i < uniqueTexts.length; i += CHUNK_SIZE) {
    const chunk = uniqueTexts.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunk.map(async (text) => {
        try {
          const translated = await translateText(text, targetLang);
          // If translation is missing or equals the original key/text, keep it blank
          if (!translated || translated.trim() === text) {
            result[text] = "";
          } else {
            result[text] = translated;
          }
        } catch (error) {
          console.error(`Translation error for text "${text}":`, error);
          result[text] = ""; // Keep blank if translation fails
        }
      }),
    );
  }

  return result;
}

