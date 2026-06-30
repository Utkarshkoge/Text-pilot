import type { ActionFunctionArgs } from 'react-router';
import { batchTranslateText } from '../utils/googleTranslate';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { words, locale } = await request.json();

    if (!Array.isArray(words) || !locale) {
      return new Response(JSON.stringify({ error: 'Invalid payload. Expected { words: string[], locale: string }' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const translations = await batchTranslateText(words, locale);

    return { translations };
  } catch (error: any) {
    console.error('API Translate Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
