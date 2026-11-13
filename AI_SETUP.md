# AI features — setup and how they work

The chatbot works fully **without** AI. These features are optional and OFF by default.

## What the AI does (and doesn't)

| Feature | Who sees it | What happens |
|---|---|---|
| **AI fallback answers** | Students | The NLP matcher always goes first. Only if it finds **no confident match**, the FAQ entries and the question are sent to an AI model, which may answer **only from those FAQ entries**. |
| **Suggest keywords with AI** | Admins | In the Add/Edit FAQ form, one click suggests search keywords from the question and answer. |

Safety rules built into the code (each one has an automated test):
- The AI answers **only** from your FAQ entries. It must name which FAQ it used; if it names one that doesn't exist, or says nothing fits, the student gets the normal "no suitable answer" message instead.
- AI answers are **labelled "AI-assisted"** and show the FAQ they came from, with the original official text one click away.
- A confident NLP match **never** calls the AI.
- If the AI is slow, down, out of credit or misconfigured, the chatbot silently falls back to the normal behaviour. It never breaks.
- Student questions are sent to the model as delimited data, with instructions to ignore any commands inside them.
- Per-IP rate limit (default 10 AI calls/minute) protects your API credit.
- The API key lives only in `backend/.env`. It is never sent to the browser.

## Turn it on (3 steps)

1. Get an API key from a provider (see below).
2. Add to `backend/.env` (never commit this file):
   ```
   AI_ENABLED=true
   AI_PROVIDER=anthropic
   AI_API_KEY=your-key-here
   ```
3. Restart the backend (`uvicorn app.main:app --reload`). Log in as admin: the **Overview** page shows "AI assistant: On" with the model name.

### Providers

**Anthropic (Claude)** — `AI_PROVIDER=anthropic`. Default model is `claude-haiku-5-5` (small and fast). Override with `AI_MODEL=...`.

**OpenAI or any OpenAI-compatible service** — `AI_PROVIDER=openai`. Set the base URL and model yourself, for example:
```
AI_PROVIDER=openai
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```
Other services that speak this format (e.g. Google Gemini's OpenAI-compatible endpoint, Groq) work by changing `AI_BASE_URL` and `AI_MODEL`. Some have free tiers. Model names and URLs change, so check the provider's current documentation.

Other settings (all optional): `AI_TIMEOUT_SECONDS=15`, `AI_MAX_CALLS_PER_MINUTE=10`, `AI_CONTEXT_FAQS=25`.

## Troubleshooting
- **Overview says "AI assistant: Off"** — `AI_ENABLED` isn't `true`, or `AI_API_KEY` is empty, or the backend wasn't restarted.
- **Overview shows "Last AI error: ..."** — the provider rejected the call. `HTTP 401` = wrong key; `HTTP 404`/`400` = wrong model name or base URL.
- **No "Suggest with AI" button in the FAQ form** — AI is off (see above).

## Privacy and cost — say this to your faculty
- When AI is on, the student's question and the FAQ entries are sent to the AI provider's servers. Don't put confidential information in FAQs.
- Usage is billed by the provider. Prompts are short and only no-match questions are sent, but check your provider's pricing and set a spending limit in their dashboard.

## How to describe this in your viva
> "It's a hybrid system. A transparent NLP matcher answers first. Only when it isn't confident, a language model is allowed to answer, and only using FAQ entries — a retrieval-grounded approach — so it can't invent fees or dates. AI answers are labelled and traceable to their source FAQ, and the system degrades gracefully if the AI is unavailable."

## Known limitation
The keyword matcher compares exact words (no stemming), so "exams" doesn't match the keyword "exam". That is precisely the case the AI fallback helps with.
