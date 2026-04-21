// WordDepth — AI judge via Claude (Supabase Edge Function)
// Deploy: supabase functions deploy judge-word
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JudgeResult {
  related: boolean;
  uniqueness: number;
  reasoning: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { promptWord, playerWord } = await req.json();

    if (!promptWord || !playerWord) {
      const result: JudgeResult = { related: false, uniqueness: 0, reasoning: 'Missing input.' };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `Word association game judge. Be concise and strict.

Prompt word: "${promptWord}"
Player response: "${playerWord}"

Evaluate:
1. Is "${playerWord}" meaningfully related to "${promptWord}"? (yes/no — slang, metaphor, cultural references are fine)
2. Uniqueness 0-100 (only if related):
   0-20  → very obvious  (horse→stable, fire→hot)
   21-50 → common        (horse→racing, fire→smoke)
   51-80 → creative      (horse→stirrup, fire→salamander)
   81-100→ brilliant     (horse→conquistador, fire→Prometheus)
3. One-sentence reason for the uniqueness score.

Reply ONLY with valid JSON: {"related":true,"uniqueness":72,"reasoning":"..."}`
        },
      ],
    });

    const raw = (message.content[0] as { text: string }).text.trim();
    const result: JudgeResult = JSON.parse(raw);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('judge-word error:', err);
    // Fallback so the game never crashes
    const fallback: JudgeResult = { related: true, uniqueness: 50, reasoning: 'Judge error — fallback score.' };
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
