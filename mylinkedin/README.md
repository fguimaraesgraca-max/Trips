# LinkedIn Post Generator

App com equipe de agentes IA para criar, revisar e publicar posts no LinkedIn.

## Funcionalidades

- **Agente Criador** – gera um rascunho profissional a partir de uma descrição curta
- **Agente Revisor** – corrige gramática, melhora o tom e adiciona hashtags
- **Revisão humana** – você edita o post final antes de publicar
- **Agente Publicador** – posta diretamente no LinkedIn via API
- Suporte a upload de fotos (JPEG, PNG, GIF, WebP)
- Inclusão de links no post
- Idioma: Português 🇧🇷, Inglês 🇺🇸 ou Bilíngue 🌐 (separados por `——`)

## Pré-requisitos

- Python 3.11+
- Conta na [Anthropic](https://console.anthropic.com/) com API Key
- App no LinkedIn com permissões `w_member_social` e `r_liteprofile`

## Instalação

```bash
git clone https://github.com/fguimaraesgraca-max/Mylinkedin.git
cd Mylinkedin
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edite .env com suas chaves
```

## Obter o LinkedIn Access Token

1. Crie um app em [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Adicione os produtos **Share on LinkedIn** e **Sign In with LinkedIn**
3. Em OAuth 2.0, adicione o redirect URI: `http://localhost:8000/callback`
4. Use o fluxo OAuth Authorization Code para obter um token com escopo `w_member_social`
5. Cole o `access_token` no `.env`

> **Dica:** O token expira em 60 dias. Para uso contínuo, implemente o refresh token.

## Executar

```bash
python run.py
```

Acesse: [http://localhost:8000](http://localhost:8000)

## Fluxo da aplicação

```
Formulário
  ↓  descrição + imagens + links + idioma
Agente 1 (Criador)  →  rascunho do post
  ↓
Agente 2 (Revisor)  →  post revisado + score + alterações
  ↓
Revisão humana      →  você edita o texto final
  ↓
Agente 3 (Publicador) → LinkedIn API → post publicado 🎉
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `ANTHROPIC_API_KEY` | Chave da API Anthropic |
| `LINKEDIN_ACCESS_TOKEN` | Token OAuth 2.0 do LinkedIn |
| `SESSION_SECRET` | String aleatória para segurança das sessões |

## Estrutura do projeto

```
mylinkedin/
├── app/
│   ├── agents/
│   │   ├── creator.py      # Agente 1 – cria o post
│   │   └── reviewer.py     # Agente 2 – revisa conteúdo e idioma
│   ├── linkedin/
│   │   └── client.py       # Agente 3 – publica via LinkedIn API
│   ├── templates/          # HTML (index, review, success)
│   ├── static/             # CSS e JS
│   └── main.py             # FastAPI app
├── uploads/                # Imagens enviadas (gitignored)
├── requirements.txt
├── run.py
└── .env.example
```
