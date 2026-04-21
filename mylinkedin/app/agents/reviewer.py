import anthropic


def review_post(draft: str, language: str) -> dict:
    """Agent 2: Reviews grammar, tone, and LinkedIn best practices. Returns revised post + notes."""
    client = anthropic.Anthropic()

    if language == "pt":
        review_instruction = (
            "Revise o post em português do Brasil. "
            "Corrija gramática, ortografia, pontuação e melhore o estilo conforme necessário."
        )
    elif language == "en":
        review_instruction = (
            "Review the English post. "
            "Correct grammar, spelling, punctuation, and improve the style as needed."
        )
    else:  # both
        review_instruction = (
            "O post contém duas versões separadas por '——': uma em português e outra em inglês. "
            "Revise CADA versão no seu respectivo idioma. "
            "Corrija gramática, ortografia, pontuação e melhore o estilo. "
            "Mantenha o separador '——' entre as versões no texto final."
        )

    prompt = f"""Você é um revisor especialista em conteúdo para LinkedIn, fluente em português do Brasil e inglês.

RASCUNHO DO POST:
---
{draft}
---

INSTRUÇÕES DE REVISÃO:
{review_instruction}

CRITÉRIOS DE REVISÃO:
1. Correção gramatical e ortográfica
2. Tom profissional e autêntico para LinkedIn
3. Clareza e fluidez da leitura
4. Uso adequado de emojis
5. Estrutura e parágrafos
6. Adicione 3–5 hashtags relevantes ao final (no idioma correspondente, ou em cada seção se bilíngue)

Responda em JSON com o seguinte formato (sem markdown, JSON puro):
{{
  "revised_post": "<texto revisado completo>",
  "changes": ["<mudança 1>", "<mudança 2>", ...],
  "quality_score": <número de 1 a 10>,
  "ready_to_post": <true ou false>
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    import json, re
    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: return draft unchanged with error note
        result = {
            "revised_post": draft,
            "changes": ["Erro ao processar revisão — post original mantido."],
            "quality_score": 7,
            "ready_to_post": True,
        }

    return result
