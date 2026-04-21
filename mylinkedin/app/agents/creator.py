import anthropic
from typing import Optional


def create_post(
    description: str,
    language: str,
    links: Optional[list[str]] = None,
    image_descriptions: Optional[list[str]] = None,
    extra_context: Optional[str] = None,
) -> str:
    """Agent 1: Generates a LinkedIn post draft from minimal user input."""
    client = anthropic.Anthropic()

    links_text = "\n".join(f"- {l}" for l in links) if links else "Nenhum"
    images_text = "\n".join(f"- {d}" for d in image_descriptions) if image_descriptions else "Nenhuma"

    if language == "pt":
        lang_instruction = (
            "Escreva APENAS em português do Brasil. "
            "O post deve ser profissional, envolvente e adequado para o LinkedIn."
        )
    elif language == "en":
        lang_instruction = (
            "Write ONLY in English. "
            "The post must be professional, engaging, and appropriate for LinkedIn."
        )
    else:  # both
        lang_instruction = (
            "Escreva o post DUAS vezes: primeiro em português do Brasil, depois em inglês. "
            "Separe as duas versões exatamente com a linha '——' (dois travessões). "
            "Cada versão deve ser um post completo, profissional e adequado para o LinkedIn."
        )

    prompt = f"""Você é um especialista em marketing de conteúdo para LinkedIn.
Crie um post de LinkedIn com base nas informações abaixo.

DESCRIÇÃO / CONTEXTO:
{description}

LINKS A INCLUIR:
{links_text}

IMAGENS DISPONÍVEIS:
{images_text}

CONTEXTO EXTRA:
{extra_context or "—"}

INSTRUÇÕES DE IDIOMA:
{lang_instruction}

DIRETRIZES DO POST:
- Tom profissional mas humano e autêntico
- Inclua emojis estratégicos (não excessivos)
- Use parágrafos curtos para facilitar a leitura
- Termine com uma chamada para ação ou pergunta engajante
- Se houver links, mencione-os naturalmente no texto
- Tamanho ideal: 150–300 palavras por versão
- NÃO inclua hashtags (o revisor adicionará)

Retorne SOMENTE o texto do post, sem explicações ou comentários."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text.strip()
