import { useState, useEffect } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import { Sparkles, RefreshCw, Check, ArrowLeft } from 'lucide-react'
import { Activity, ActivityType, Day, PendingItem } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

declare const __VIATICUM_KEY__: string

const AI_KEY_STORAGE = 'viaticum-ai-key'
const BUILT_IN_KEY: string = __VIATICUM_KEY__ || ''

const PT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const TRAVEL_STYLES = [
  { id: 'cultural', label: 'Cultural', emoji: '🏛️' },
  { id: 'natureza', label: 'Natureza', emoji: '🌿' },
  { id: 'praia', label: 'Praia', emoji: '🏖️' },
  { id: 'aventura', label: 'Aventura', emoji: '🧗' },
  { id: 'gastronomia', label: 'Gastronomia', emoji: '🍽️' },
  { id: 'relax', label: 'Relaxamento', emoji: '🧘' },
  { id: 'urbano', label: 'Urbano', emoji: '🏙️' },
  { id: 'historico', label: 'Histórico', emoji: '🏰' },
]

const COMPANIONS = [
  { id: 'casal', label: 'Casal', emoji: '💑' },
  { id: 'familia', label: 'Família c/ crianças', emoji: '👨‍👩‍👧' },
  { id: 'pet', label: 'Pet-friendly', emoji: '🐾' },
  { id: 'solo', label: 'Solo', emoji: '🧭' },
  { id: 'amigos', label: 'Grupo de amigos', emoji: '👯' },
]

const BUDGETS = [
  { id: 'economico', label: 'Econômico', hint: 'R$ 150–300/dia', emoji: '💰' },
  { id: 'moderado', label: 'Moderado', hint: 'R$ 300–600/dia', emoji: '💳' },
  { id: 'confortavel', label: 'Confortável', hint: 'R$ 600–1.200/dia', emoji: '🥂' },
  { id: 'luxo', label: 'Luxo', hint: 'R$ 1.200+/dia', emoji: '💎' },
]

const LOADING_MSGS = [
  'Pesquisando os melhores pontos turísticos...',
  'Selecionando restaurantes imperdíveis...',
  'Planejando trajetos e transportes...',
  'Verificando atividades para o período...',
  'Ajustando ao seu orçamento e perfil...',
  'Finalizando o roteiro personalizado...',
]

const TYPE_EMOJI: Record<string, string> = {
  attraction: '🏛️', food: '🍽️', flight: '✈️',
  hotel: '🏨', transport: '🚌', shopping: '🛍️', other: '📌',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nanoid() { return Math.random().toString(36).slice(2, 10) }

function mapType(t: string): ActivityType {
  const valid: ActivityType[] = ['attraction', 'food', 'flight', 'hotel', 'transport', 'shopping', 'other']
  return valid.includes(t as ActivityType) ? (t as ActivityType) : 'attraction'
}

function extractJSON(text: string): string {
  const md = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (md) return md[1].trim()
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s !== -1 && e !== -1) return text.slice(s, e + 1)
  throw new Error('Não foi possível extrair o roteiro da resposta da IA')
}

function getStartDate(month: number): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), month, 1)
  if (d <= now) d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

async function callClaude(
  apiKey: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages,
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : ''
  } catch (e: any) {
    const status = e.status ?? 0
    if (status === 401) throw new Error('Chave de API inválida')
    if (status === 429) throw new Error('Muitas requisições — aguarde e tente novamente')
    throw new Error(e.message ?? `Erro na API (${status})`)
  }
}

function buildPrompt(p: {
  destination: string; departureCity: string; numDays: number; month: number
  styles: string[]; companions: string[]; budget: string; startDate: string; notes: string
}): string {
  const budgetLabel = BUDGETS.find(b => b.id === p.budget)?.label ?? p.budget
  const styleLabels = p.styles.map(s => TRAVEL_STYLES.find(x => x.id === s)?.label ?? s).join(', ') || 'geral'
  const companionLabels = p.companions.map(c => COMPANIONS.find(x => x.id === c)?.label ?? c).join(', ') || 'adultos'
  const hasKids = p.companions.includes('familia')
  const hasPet = p.companions.includes('pet')
  const isLuxury = p.budget === 'luxo'
  const isBudget = p.budget === 'economico'

  return `Você é um planejador de viagens especialista. Crie um roteiro de viagem completo e detalhado.

INFORMAÇÕES DA VIAGEM:
- Destino: ${p.destination || 'A ESCOLHER — sugira o destino ideal com base no perfil e preferências abaixo'}${p.departureCity ? `\n- Cidade de partida: ${p.departureCity}` : ''}
- Duração: ${p.numDays} dias (início: ${p.startDate})
- Período: ${PT_MONTHS[p.month]}
- Estilo: ${styleLabels}
- Perfil do viajante: ${companionLabels}
- Orçamento: ${budgetLabel}${p.notes ? `\n- Observações: ${p.notes}` : ''}

Retorne APENAS um JSON válido, sem texto adicional, no formato:

{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "city": "Nome da cidade",
      "country": "País",
      "activities": [
        {
          "time": "HH:MM",
          "title": "Nome da atividade",
          "description": "Detalhes concisos (1-2 frases)",
          "location": "Local específico ou endereço",
          "type": "attraction",
          "notes": "Dicas práticas: preço, reserva, horário de funcionamento"
        }
      ]
    }
  ]
}

TIPOS DISPONÍVEIS (use exatamente esses): "attraction", "food", "flight", "hotel", "transport", "shopping", "other"

REGRAS OBRIGATÓRIAS:
- Exatamente ${p.numDays} dias a partir de ${p.startDate}
- 4-6 atividades por dia com horários realistas e sequenciais
- Dia 1: chegada e check-in como primeiras atividades (tipo "hotel" e "flight" se aplicável)
- Último dia: check-out e partida no final do dia
- Pelo menos 1 atividade tipo "food" por dia com nome real do restaurante
- Use locais REAIS e conhecidos — museus, restaurantes, pontos turísticos com nomes verdadeiros
- Horários devem ser sequenciais e realistas (sem sobreposição)
- Notas: preços aproximados, se precisa reservar, horário de funcionamento${!p.destination ? '\n- SUGIRA o melhor destino para o perfil informado e justifique brevemente na descrição do primeiro dia' : ''}${p.departureCity ? `\n- Inclua voo de ${p.departureCity} como primeira atividade do dia 1 (tipo "flight")` : ''}${hasKids ? '\n- Priorize atividades adequadas para crianças, indicando faixa etária quando relevante' : ''}${hasPet ? '\n- Indique locais pet-friendly e parques que aceitam animais' : ''}${isBudget ? '\n- Priorize opções gratuitas ou de baixo custo, hostels, restaurantes populares' : ''}${isLuxury ? '\n- Inclua hotéis 5 estrelas, restaurantes premiados e experiências exclusivas' : ''}
- Considere clima e eventos típicos de ${PT_MONTHS[p.month]}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = 'form' | 'suggesting' | 'suggestions' | 'loading' | 'preview'

interface Suggestion {
  name: string
  country: string
  emoji: string
  tagline: string
  highlight: string
  transport: string[]   // e.g. ["✈️ Voo direto", "🚗 Carro"]
  travelTime: string    // e.g. "1h45 de SP" or "6h de carro de SP"
}

interface RawDay {
  date: string; city: string; country: string
  activities: Array<{ time: string; title: string; description: string; location: string; type: string; notes: string }>
}

interface Props {
  onImport: (title: string, days: Day[], pendingItems: PendingItem[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AITripPlanner({ onImport }: Props) {
  // Avoid localStorage calls during render — they can fail silently in private mode
  const [apiKey, setApiKey] = useState(BUILT_IN_KEY || '')
  const [showKeyOverride, setShowKeyOverride] = useState(!BUILT_IN_KEY)
  const [keyDraft, setKeyDraft] = useState('')

  // Sync with localStorage after mount (non-blocking)
  useEffect(() => {
    if (BUILT_IN_KEY) {
      try { localStorage.removeItem(AI_KEY_STORAGE) } catch {}
      return
    }
    try {
      const stored = localStorage.getItem(AI_KEY_STORAGE)
      if (stored) {
        setApiKey(stored)
        setShowKeyOverride(false)
      }
    } catch {}
  }, [])

  const [tripName, setTripName] = useState('')
  const [destination, setDestination] = useState('')
  const [departureCity, setDepartureCity] = useState('')
  const [numDays, setNumDays] = useState(5)
  const [month, setMonth] = useState(new Date().getMonth())
  const [styles, setStyles] = useState<string[]>([])
  const [companions, setCompanions] = useState<string[]>([])
  const [budget, setBudget] = useState('moderado')
  const [notes, setNotes] = useState('')

  const [stage, setStage] = useState<Stage>('form')
  const [loadingIdx, setLoadingIdx] = useState(0)
  const [error, setError] = useState('')
  const [generatedDays, setGeneratedDays] = useState<RawDay[]>([])
  const [lastPrompt, setLastPrompt] = useState('')
  const [lastJSON, setLastJSON] = useState('')
  const [refinement, setRefinement] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    if (stage !== 'loading') return
    const iv = setInterval(() => setLoadingIdx(i => (i + 1) % LOADING_MSGS.length), 2500)
    return () => clearInterval(iv)
  }, [stage])

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  }

  async function fetchSuggestions() {
    if (!apiKey || !tripName.trim()) return
    setStage('suggesting')
    setError('')

    try {
      const budgetLabel = BUDGETS.find(b => b.id === budget)?.label ?? budget
      const styleLabels = styles.map(s => TRAVEL_STYLES.find(x => x.id === s)?.label ?? s).join(', ') || 'geral'
      const companionLabels = companions.map(c => COMPANIONS.find(x => x.id === c)?.label ?? c).join(', ') || 'adultos'

      const prompt = `Você é um especialista em viagens. Sugira 4 destinos ideais para esta viagem.

PERFIL:
- Duração: ${numDays} dias em ${PT_MONTHS[month]}
- Estilo: ${styleLabels}
- Perfil: ${companionLabels}
- Orçamento: ${budgetLabel}${departureCity ? `\n- Partindo de: ${departureCity}` : ''}${notes ? `\n- Observações: ${notes}` : ''}

Retorne APENAS este JSON, sem texto adicional:
{
  "suggestions": [
    {
      "name": "Nome da cidade ou região",
      "country": "País",
      "emoji": "🏖️",
      "tagline": "Frase curta e atraente (máx 8 palavras)",
      "highlight": "Por que é ideal para este perfil em ${PT_MONTHS[month]} (1 frase)",
      "transport": ["✈️ Voo direto", "🚗 Carro"],
      "travelTime": "2h de voo de SP"
    }
  ]
}

REGRAS:
- 4 sugestões variadas, destinos reais e específicos, emojis representativos do lugar
- "transport": lista dos modais mais práticos para chegar (✈️ Voo, 🚗 Carro, 🚌 Ônibus, 🚢 Barco, 🚆 Trem)${departureCity ? `\n- "travelTime": tempo estimado partindo de ${departureCity} pelo modal mais rápido/comum` : '\n- "travelTime": tempo estimado de viagem pelo modal principal indicado'}
- Se houver voo, indicar se é direto ou com conexão`

      const text = await callClaude(apiKey, [{ role: 'user', content: prompt }])
      const json = extractJSON(text)
      const data = JSON.parse(json)
      if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) throw new Error('Nenhuma sugestão retornada')

      setSuggestions(data.suggestions.slice(0, 4))
      setStage('suggestions')
    } catch (e: any) {
      handleError(e)
    }
  }

  function applyKey(key: string) {
    const k = key.trim()
    setApiKey(k)
    if (k) localStorage.setItem(AI_KEY_STORAGE, k)
    else localStorage.removeItem(AI_KEY_STORAGE)
    setKeyDraft('')
    setShowKeyOverride(false)
  }

  function handleError(e: any) {
    const msg: string = e.message ?? 'Erro desconhecido'
    const isAuth = msg.toLowerCase().includes('inválida') || msg.toLowerCase().includes('invalid') || e.status === 401
    setError(msg)
    setStage('form')
    if (isAuth) {
      setApiKey('')
      localStorage.removeItem(AI_KEY_STORAGE)
      setShowKeyOverride(true)
    }
  }

  async function generate(chosenDestination?: string, refineText?: string) {
    if (!apiKey || !tripName.trim()) return
    const dest = chosenDestination ?? destination
    setStage('loading')
    setError('')

    try {
      const startDate = getStartDate(month)
      const prompt = buildPrompt({ destination: dest, departureCity, numDays, month, styles, companions, budget, startDate, notes })
      setLastPrompt(prompt)

      let messages: Array<{ role: 'user' | 'assistant'; content: string }>
      if (refineText && lastJSON) {
        messages = [
          { role: 'user', content: lastPrompt },
          { role: 'assistant', content: lastJSON },
          {
            role: 'user',
            content: `Refine o roteiro acima com as seguintes alterações: ${refineText}\n\nRetorne o JSON completo atualizado, mesmo formato, APENAS o JSON.`,
          },
        ]
      } else {
        messages = [{ role: 'user', content: prompt }]
      }

      const text = await callClaude(apiKey, messages)
      const json = extractJSON(text)
      const data = JSON.parse(json)
      if (!Array.isArray(data.days) || data.days.length === 0) throw new Error('Roteiro vazio. Tente novamente.')

      setGeneratedDays(data.days)
      setLastJSON(json)
      setRefinement('')
      setStage('preview')
    } catch (e: any) {
      handleError(e)
    }
  }

  function handleGenerate() {
    if (!destination.trim()) {
      fetchSuggestions()
    } else {
      generate()
    }
  }

  function handleImport() {
    const days: Day[] = generatedDays.map(gd => ({
      id: nanoid(),
      date: gd.date,
      city: gd.city,
      country: gd.country,
      activities: gd.activities.map((a): Activity => ({
        id: nanoid(),
        time: a.time ?? '09:00',
        title: a.title,
        description: a.description ?? '',
        location: a.location ?? '',
        done: false,
        type: mapType(a.type),
        notes: a.notes ?? '',
      })).sort((a, b) => a.time.localeCompare(b.time)),
    }))
    onImport(tripName, days, [])
  }

  const totalActs = generatedDays.reduce((s, d) => s + d.activities.length, 0)
  const canGenerate = !!apiKey && !!tripName.trim()

  const cls = {
    label: 'text-xs font-semibold text-gray-500 uppercase tracking-wide',
    input: 'mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72] bg-white',
  }

  // ── Suggesting (spinner while fetching suggestions) ─────────────────────────
  if (stage === 'suggesting') {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[#EAF2F8] flex items-center justify-center">
          <Sparkles size={30} className="text-[#1B4F72] animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-gray-800 mb-1">Buscando destinos para você...</p>
          <p className="text-sm text-gray-400">Analisando seu perfil e preferências</p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#1B4F72] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Suggestions ──────────────────────────────────────────────────────────────
  if (stage === 'suggestions') {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-base font-bold text-gray-900">Escolha um destino</p>
          <p className="text-xs text-gray-400 mt-0.5">A IA vai criar o roteiro completo após sua escolha</p>
        </div>

        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => generate(`${s.name}, ${s.country}`)}
              className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 active:bg-[#EAF2F8] active:border-[#A8C4D8] transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0 leading-none mt-0.5">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.country}</p>
                  </div>
                  <p className="text-sm text-[#1B4F72] font-medium mt-0.5">{s.tagline}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.highlight}</p>

                  {/* Transport + travel time */}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {s.transport?.map((t, j) => (
                      <span key={j} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {t}
                      </span>
                    ))}
                    {s.travelTime && (
                      <span className="text-[11px] text-gray-400 font-medium">
                        · {s.travelTime}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-gray-300 flex-shrink-0 mt-1">›</span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={fetchSuggestions}
          className="w-full flex items-center justify-center gap-2 border border-[#1B4F72] text-[#1B4F72] py-3 rounded-2xl text-sm font-bold active:bg-[#EAF2F8]"
        >
          <RefreshCw size={15} /> Gerar outras sugestões
        </button>

        <button
          onClick={() => setStage('form')}
          className="w-full text-center text-sm text-gray-400 py-2 active:text-gray-600"
        >
          ← Voltar e digitar destino manualmente
        </button>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[#EAF2F8] flex items-center justify-center">
          <Sparkles size={30} className="text-[#1B4F72] animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-gray-800 mb-1">Criando seu roteiro...</p>
          <p className="text-sm text-gray-400 max-w-[240px]">{LOADING_MSGS[loadingIdx]}</p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#1B4F72] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Preview ─────────────────────────────────────────────────────────────────
  if (stage === 'preview') {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-emerald-800 text-sm font-bold">Roteiro gerado!</p>
            <p className="text-emerald-600 text-xs mt-0.5">{tripName} · {generatedDays.length} dias · {totalActs} atividades</p>
          </div>
        </div>

        {/* Day preview */}
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {generatedDays.map((day, i) => {
            const d = new Date(day.date + 'T12:00:00')
            const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
            return (
              <div key={day.date} className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-[11px] font-bold text-[#1B4F72] uppercase tracking-wide mb-2">
                  Dia {i + 1} · {label} · {day.city}
                </p>
                <div className="space-y-1.5">
                  {day.activities.map((act, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="text-sm leading-none flex-shrink-0 mt-0.5">{TYPE_EMOJI[act.type] ?? '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-mono text-gray-400 mr-1">{act.time}</span>
                        <span className="text-xs font-medium text-gray-800">{act.title}</span>
                        {act.location && <p className="text-[10px] text-gray-400 truncate">{act.location}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Refinement */}
        <div className="bg-[#EAF2F8] rounded-2xl px-4 py-3">
          <p className="text-xs font-bold text-[#1B4F72] mb-2">✨ Refinar com IA</p>
          <div className="flex gap-2">
            <input
              value={refinement}
              onChange={e => setRefinement(e.target.value)}
              placeholder="ex: Troque o dia 3 para praia, adicione mais restaurantes..."
              className="flex-1 border border-[#A8C4D8] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4F72]"
              onKeyDown={e => { if (e.key === 'Enter' && refinement.trim()) generate(refinement) }}
            />
            <button
              onClick={() => { if (refinement.trim()) generate(refinement) }}
              disabled={!refinement.trim()}
              className="px-3 py-2 bg-[#1B4F72] text-white rounded-xl disabled:opacity-40 active:bg-[#0E3252]"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 pb-2">
          <button
            onClick={() => setStage('form')}
            className="flex items-center gap-1.5 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 active:bg-gray-50"
          >
            <ArrowLeft size={15} /> Voltar
          </button>
          <button
            onClick={handleImport}
            className="flex-1 bg-[#1B4F72] text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:bg-[#0E3252]"
          >
            <Check size={17} strokeWidth={3} /> Importar viagem
          </button>
        </div>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-red-700">Erro ao gerar roteiro</p>
          <p className="text-xs text-red-500 mt-0.5">{error}</p>
          {!apiKey && (
            <p className="text-xs text-red-600 font-semibold mt-1.5">👇 Insira sua chave da API abaixo para continuar</p>
          )}
        </div>
      )}

      <div>
        <label className={cls.label}>Nome da viagem *</label>
        <input value={tripName} onChange={e => setTripName(e.target.value)}
          placeholder="ex: Aventura na Bahia 2026" className={cls.input} />
      </div>

      <div>
        <label className={cls.label}>Destino <span className="normal-case font-normal text-gray-400">(deixe vazio para a IA sugerir)</span></label>
        <input value={destination} onChange={e => setDestination(e.target.value)}
          placeholder="ex: Salvador · Japão · Patagônia · Lisboa" className={cls.input} />
      </div>

      <div>
        <label className={cls.label}>Cidade de partida <span className="normal-case font-normal text-gray-400">(opcional)</span></label>
        <input value={departureCity} onChange={e => setDepartureCity(e.target.value)}
          placeholder="ex: São Paulo" className={cls.input} />
      </div>

      {/* Days + Month */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={cls.label}>Duração</label>
          <div className="mt-1.5 flex items-center gap-2">
            <button onClick={() => setNumDays(d => Math.max(1, d - 1))}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 active:bg-gray-200">−</button>
            <span className="text-lg font-bold text-gray-800 w-8 text-center">{numDays}</span>
            <button onClick={() => setNumDays(d => Math.min(20, d + 1))}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 active:bg-gray-200">+</button>
            <span className="text-xs text-gray-400 ml-0.5">dias</span>
          </div>
        </div>
        <div className="flex-1">
          <label className={cls.label}>Mês</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4F72]">
            {PT_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Travel style */}
      <div>
        <label className={cls.label}>Estilo de viagem <span className="normal-case font-normal text-gray-400">(múltipla escolha)</span></label>
        <div className="flex flex-wrap gap-2 mt-2">
          {TRAVEL_STYLES.map(s => (
            <button key={s.id} onClick={() => setStyles(prev => toggle(prev, s.id))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                styles.includes(s.id) ? 'bg-[#1B4F72] text-white border-[#1B4F72]' : 'bg-white text-gray-700 border-gray-200 active:bg-gray-50'
              }`}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Companions */}
      <div>
        <label className={cls.label}>Perfil do viajante</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {COMPANIONS.map(c => (
            <button key={c.id} onClick={() => setCompanions(prev => toggle(prev, c.id))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                companions.includes(c.id) ? 'bg-[#1B4F72] text-white border-[#1B4F72]' : 'bg-white text-gray-700 border-gray-200 active:bg-gray-50'
              }`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className={cls.label}>Orçamento por pessoa</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {BUDGETS.map(b => (
            <button key={b.id} onClick={() => setBudget(b.id)}
              className={`flex flex-col items-start px-3 py-2.5 rounded-xl border transition-colors ${
                budget === b.id ? 'bg-[#1B4F72] text-white border-[#1B4F72]' : 'bg-white text-gray-700 border-gray-200 active:bg-gray-50'
              }`}>
              <span className="text-base mb-0.5">{b.emoji}</span>
              <span className="text-sm font-bold">{b.label}</span>
              <span className={`text-[10px] ${budget === b.id ? 'text-white/70' : 'text-gray-400'}`}>{b.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Extra notes */}
      <div>
        <label className={cls.label}>Observações <span className="normal-case font-normal text-gray-400">(opcional)</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} resize-none
          placeholder="ex: Sem frutos do mar. Interesse em festivais locais. Preferimos lugares menos turísticos."
          className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72] bg-white resize-none" />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full bg-[#1B4F72] text-white py-4 rounded-2xl text-base font-bold disabled:opacity-40 flex items-center justify-center gap-2 active:bg-[#0E3252]"
      >
        <Sparkles size={20} />
        {!apiKey ? 'Configure a chave da API abaixo' : !tripName.trim() ? 'Preencha o nome da viagem' : destination.trim() ? 'Gerar roteiro com IA' : 'Sugerir destinos com IA'}
      </button>

      {/* Key override */}
      {!apiKey ? (
        <div className="border border-amber-200 bg-amber-50 rounded-2xl px-4 py-3.5">
          <p className="text-xs font-bold text-amber-800 mb-0.5">🔑 Chave da API necessária</p>
          <p className="text-[11px] text-amber-600 mb-3">
            Cole sua chave do Anthropic (console.anthropic.com → API Keys)
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && keyDraft.trim()) applyKey(keyDraft) }}
              placeholder="sk-ant-..."
              className="flex-1 border border-amber-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoFocus
            />
            <button
              onClick={() => { if (keyDraft.trim()) applyKey(keyDraft) }}
              disabled={!keyDraft.trim()}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold disabled:opacity-40"
            >
              Usar
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center pb-1">
          <button
            onClick={() => setShowKeyOverride(v => !v)}
            className="text-xs text-gray-300 active:text-gray-500"
          >
            🔑 Trocar chave da API
          </button>
          {showKeyOverride && (
            <div className="mt-2 flex gap-2">
              <input
                type="password"
                value={keyDraft}
                onChange={e => setKeyDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && keyDraft.trim()) applyKey(keyDraft) }}
                placeholder="sk-ant-..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4F72]"
              />
              <button
                onClick={() => { if (keyDraft.trim()) applyKey(keyDraft) }}
                disabled={!keyDraft.trim()}
                className="px-3 py-2 bg-[#1B4F72] text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                Salvar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
