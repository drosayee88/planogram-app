/**
 * LLM Service — Phase 2 stub
 *
 * When you're ready to integrate an LLM:
 *  1. Fill in API_URL and API_KEY.
 *  2. Implement generatePlanogram() to call your chosen provider
 *     (OpenAI chat/completions with vision, Anthropic Claude, etc.).
 *  3. The response must conform to LLMPlanogramResponse in types/planogram.ts.
 *
 * Prompt strategy:
 *  - System: "You are a retail planogram expert. Respond ONLY with valid JSON."
 *  - User:   layout description (shelves × slots) + base64 product images
 *  - Expect: { layout: {...}, placements: [{productId, shelf, slot, facings}] }
 */

import type { LLMPlanogramResponse, Product, ShelfLayout } from '../types/planogram';

// TODO: replace with real values when integrating
const API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_LLM_API_KEY ?? '';

export async function generatePlanogram(
  products: Product[],
  layout: ShelfLayout,
): Promise<LLMPlanogramResponse> {
  if (!API_KEY) {
    throw new Error('VITE_LLM_API_KEY is not set. See llmService.ts for instructions.');
  }

  // Build the user message content array (text + images)
  const imageContent = await Promise.all(
    products.map(async (p) => {
      // Convert object URL → base64 if needed
      const base64 = await urlToBase64(p.imageUrl);
      return {
        type: 'image_url' as const,
        image_url: { url: base64, detail: 'low' as const },
      };
    }),
  );

  const productList = products.map((p) => `id="${p.id}" name="${p.name}"`).join(', ');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a retail planogram expert. Given product images and a store fixture layout, ' +
            'return a JSON planogram placement plan. Respond ONLY with valid JSON matching the schema: ' +
            '{ layout: { shelves, slotsPerShelf, label }, placements: [{ productId, shelf, slot, facings }] }',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `Layout: ${layout.shelves} shelves × ${layout.slotsPerShelf} slots each. ` +
                `Products: ${productList}. ` +
                `Place all products optimally on the fixture.`,
            },
            ...imageContent,
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');

  return JSON.parse(content) as LLMPlanogramResponse;
}

async function urlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
