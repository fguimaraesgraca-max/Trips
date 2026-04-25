import { Activity, ActivityType, Day, PendingItem, PendingPriority } from '../types'

function uid() { return Math.random().toString(36).slice(2, 9) }

const MONTHS: Record<string, number> = {
  janeiro:1, fevereiro:2, março:3, marco:3, abril:4, maio:5, junho:6,
  julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12,
  jan:1, fev:2, mar:3, abr:4, mai:5, jun:6, jul:7, ago:8, set:9, out:10, nov:11, dez:12,
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
}

type CityEntry = [RegExp, string, string]
const CITIES: CityEntry[] = [
  [/\bamsterdam\b|\bams\b(?!\w)/i, 'Amsterdam', 'Países Baixos'],
  [/\bbruges?\b|\bbrugge\b/i, 'Bruges', 'Bélgica'],
  [/\bbrussel[s]?\b|\bbruxelas\b/i, 'Brussels', 'Bélgica'],
  [/\bcharleroi\b|\bcrl\b(?!\w)/i, 'Charleroi', 'Bélgica'],
  [/\bbudapest\b|\bbud\b(?!\w)/i, 'Budapest', 'Hungria'],
  [/\bzagreb\b/i, 'Zagreb', 'Croácia'],
  [/\bplitvice\b/i, 'Plitvice', 'Croácia'],
  [/\bzadar\b/i, 'Zadar', 'Croácia'],
  [/\bsplit\b(?!\s+pea|\s+decision)/i, 'Split', 'Croácia'],
  [/\bdubrovnik\b|\bdbv\b(?!\w)/i, 'Dubrovnik', 'Croácia'],
  [/\bs[ãa]o paulo\b|\bgru\b(?!\w)/i, 'São Paulo', 'Brasil'],
  [/\brio de janeiro\b|\bgig\b(?!\w)/i, 'Rio de Janeiro', 'Brasil'],
  [/\bparis\b|\bcdg\b(?!\w)/i, 'Paris', 'França'],
  [/\blondres\b|\blondon\b|\blhr\b(?!\w)/i, 'Londres', 'Reino Unido'],
  [/\broma\b|\brome\b|\bfco\b(?!\w)/i, 'Roma', 'Itália'],
  [/\blisboa\b|\blisbon\b|\blis\b(?!\w)/i, 'Lisboa', 'Portugal'],
  [/\bbarcelona\b|\bbcn\b(?!\w)/i, 'Barcelona', 'Espanha'],
  [/\bmadrid\b|\bmad\b(?!\w)/i, 'Madrid', 'Espanha'],
  [/\bnova york\b|\bnew york\b|\bjfk\b(?!\w)|\bewr\b(?!\w)/i, 'Nova York', 'EUA'],
  [/\bt[oó]quio\b|\btokyo\b|\bnrt\b(?!\w)/i, 'Tóquio', 'Japão'],
  [/\bviena\b|\bvienna\b|\bvie\b(?!\w)/i, 'Viena', 'Áustria'],
  [/\bpraga\b|\bprague\b|\bprg\b(?!\w)/i, 'Praga', 'Rep. Tcheca'],
  [/\bberlim\b|\bberlin\b|\bber\b(?!\w)/i, 'Berlim', 'Alemanha'],
  [/\bveneza\b|\bvenice\b|\bvce\b(?!\w)/i, 'Veneza', 'Itália'],
  [/\bmil[aã]o\b|\bmilan\b|\bmxp\b(?!\w)/i, 'Milão', 'Itália'],
  [/\bhvar\b/i, 'Hvar', 'Croácia'],
  [/\bmakarska\b/i, 'Makarska', 'Croácia'],
]

function detectCity(line: string): [string, string] | null {
  for (const [re, city, country] of CITIES) {
    if (re.test(line)) return [city, country]
  }
  return null
}

function parseDate(line: string, year = 2026): string | null {
  const l = line.toLowerCase()

  // DD/MM or DD/MM/YYYY (numeric months only)
  let m = l.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/)
  if (m) {
    const d = +m[1], mo = +m[2]
    const yr = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : year
    if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
      return `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    }
  }

  // DD/Mês or DD-Mês (e.g., 14/Mai, 28/maio, 22/jun)
  m = l.match(/\b(\d{1,2})[\/\-]([a-zà-ÿ]{2,9})\b/)
  if (m) {
    const d = +m[1], mo = MONTHS[m[2]]
    if (mo && d >= 1 && d <= 31) {
      return `${year}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    }
  }

  // DD de Mês (de YYYY)
  m = l.match(/\b(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?\b/)
  if (m) {
    const d = +m[1], mo = MONTHS[m[2]], yr = m[3] ? +m[3] : year
    if (mo && d >= 1 && d <= 31) {
      return `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    }
  }

  // Month DD or Month DD, YYYY (EN)
  m = l.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/)
  if (m) {
    const mo = MONTHS[m[1]], d = +m[2], yr = m[3] ? +m[3] : year
    if (mo) return `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }

  return null
}

function parseTime(line: string): string {
  let m = line.match(/\b(\d{1,2}):(\d{2})\b/)
  if (m) return `${m[1].padStart(2,'0')}:${m[2]}`
  m = line.match(/\b(\d{1,2})h(\d{2})?\b/i)
  if (m) return `${m[1].padStart(2,'0')}:${m[2] || '00'}`
  return ''
}

function detectType(text: string): ActivityType {
  const l = text.toLowerCase()
  if (/\bvoo\b|flight|✈|latam|klm|tap\b|gol\b|azul\b|ryanair|easyjet|wizz|embarque|decolagem|boarding|\b[a-z]{3}\s*[→>]\s*[a-z]{3}\b/i.test(l)) return 'flight'
  if (/\bhotel\b|check.?in|check.?out|pousada|hostel|acomodaç|hospedagem/i.test(l)) return 'hotel'
  if (/jantar|almoço|almoco|café|restaurante|dinner|lunch|breakfast|lanche|comer|waffles|ostras/i.test(l)) return 'food'
  if (/ônibus|onibus|\bbus\b|trem|\btrain\b|t[aá]xi|talixo|metro|metrô|transfer|ferry|barco|funicular|teleférico|cable car|\bsncb\b|\btec\b|\bflibco\b/i.test(l)) return 'transport'
  if (/museu|parque|\blago\b|praia|beach|\btour\b|passeio|visita|castelo|palácio|catedral|bastião|torre|muralha|fortaleza|jardim|canal|cachoeira|belfort|rijks|keukenhof|sea organ/i.test(l)) return 'attraction'
  if (/compras|shopping|\bloja\b|souvenir|mercado/i.test(l)) return 'shopping'
  return 'other'
}

function isDateLine(line: string): boolean {
  if (!parseDate(line)) return false

  // Strip leading markdown/bullet chars to get the effective start
  const clean = line.toLowerCase().trim().replace(/^[*\-•>#\s]+/, '')

  // Weekday-led: "Quinta 14/05", "Seg, 14/Mai", "Segunda-feira, 14 de maio"
  if (/^(segunda|terça|quarta|quinta|sexta|sábado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday|seg|ter|qua|qui|sex|s[aá]b|dom)\b/.test(clean)) return true

  // "Dia N" / "Chegada N" prefixes
  if (/^(dia|chegada)\s+\d/.test(clean)) return true

  // Line STARTS with a date: "14/05", "14/Mai", "14-05"
  if (/^\d{1,2}[\/\-](\d{1,2}|[a-z]{2,9})\b/.test(clean) && line.trim().length <= 60) return true

  // "14 de maio" at the very start
  if (/^\d{1,2}\s+de\s+[a-z]/.test(clean)) return true

  return false
}

export function parseItineraryText(rawText: string, year = 2026): Day[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const days: Day[] = []

  let city = ''
  let country = ''
  let currentDay: Day | null = null

  function flush() {
    if (currentDay) days.push(currentDay)
    currentDay = null
  }

  function newDay(date: string) {
    flush()
    currentDay = { id: uid(), date, city: city || 'A definir', country: country || '', activities: [] }
  }

  function lastAct(): Activity | null {
    const acts = currentDay?.activities
    return acts && acts.length > 0 ? acts[acts.length - 1] : null
  }

  function addAct(line: string, forceTime?: string) {
    if (!currentDay) return
    const time = forceTime ?? parseTime(line)
    const type = detectType(line)
    const title = line
      .replace(/\b\d{1,2}:\d{2}\b/g, '')
      .replace(/\b\d{1,2}h\d{0,2}\b/ig, '')
      .replace(/^[\s\-\:·•\*—]+/, '')
      .replace(/[\s\-\:]+$/, '')
      .trim() || line.trim()

    currentDay.activities.push({
      id: uid(),
      time: time || '09:00',
      title: title.slice(0, 90),
      description: '',
      location: '',
      done: false,
      type,
      notes: '',
    })
  }

  for (const line of lines) {
    // Update city context from any mention in the line
    const cityHit = detectCity(line)
    if (cityHit) {
      city = cityHit[0]
      country = cityHit[1]
      const cd = currentDay as Day | null
      if (cd) { cd.city = city; cd.country = country }
    }

    // Date header → start new day
    if (isDateLine(line)) {
      const date = parseDate(line, year)!
      newDay(date)
      continue
    }

    if (!currentDay) continue

    // Skip pure separator/comment lines
    if (/^[\*\—\-]{2,}/.test(line)) {
      if (lastAct()) lastAct()!.notes += (lastAct()!.notes ? ' | ' : '') + line.replace(/^[\*\—\-\s]+/, '')
      continue
    }

    // Line with explicit time → new activity
    if (parseTime(line)) {
      addAct(line)
      continue
    }

    // Keyword-led activity lines (no time)
    if (/^(voo|flight|hotel|check.?in|check.?out|trem|ônibus|bus|taxi|talixo|ferry|chegada|partida|embarque|reserva|check)/i.test(line)) {
      addAct(line)
      continue
    }

    // Otherwise append to last activity
    const last = lastAct()
    if (last) {
      if (!last.description) last.description = line
      else last.notes = (last.notes ? last.notes + ' · ' : '') + line
    } else {
      addAct(line)
    }
  }

  flush()
  return days
}

// ─── Pending items extraction ─────────────────────────────────────────────────

function pendingPriority(text: string): PendingPriority {
  const l = text.toLowerCase()
  if (/passagem|voo\b|flight|visto\b|seguro\s+viagem|transfer\b|táxi.*aero|taxi.*aero|crítico/i.test(l)) return 'critico'
  if (/hotel|hostel|pousada|reservar|alugar|carro\b|museu|anne frank|plitvice|restaurante|importante/i.test(l)) return 'importante'
  return 'normal'
}

function extractDateNeeded(text: string): string {
  // Trailing (28/Mai) or (22/05)
  const paren = text.match(/\(([^)]{2,20})\)\s*$/)
  if (paren) return paren[1]
  // "para DD/MM" or "até DD/MM" at end
  const prep = text.match(/(?:para|até|by)\s+(\d{1,2}[\/\-](?:\d{1,2}|\w+))\s*$/i)
  if (prep) return prep[1]
  return ''
}

function parsePendingBlock(blockText: string): PendingItem[] {
  const items: PendingItem[] = []
  for (const line of blockText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    // Accept numbered items ("1.", "1)") or bullet items ("-", "•", "*")
    if (!/^(?:\d+[\.\)]|[-•*])\s+/.test(trimmed)) continue
    const raw = trimmed.replace(/^(?:\d+[\.\)]|[-•*])\s+/, '').trim()
    if (!raw) continue
    const dateNeeded = extractDateNeeded(raw)
    const title = dateNeeded
      ? raw.replace(/\s*\([^)]+\)\s*$/, '').replace(/\s+(?:para|até)\s+\d{1,2}[\/\-]\S+\s*$/i, '').trim()
      : raw
    items.push({
      id: uid(),
      title: title || raw,
      dateNeeded,
      howTo: '',
      responsible: '',
      status: 'pendente',
      priority: pendingPriority(raw),
      notes: '',
    })
  }
  return items
}

export interface ParseResult {
  days: Day[]
  pendingItems: PendingItem[]
}

export function parseItineraryFull(rawText: string, year = 2026): ParseResult {
  // Split on a PENDENCIAS / PENDÊNCIAS section header
  const headerRe = /^[ \t]*PEND[EÊ]NCIAS?\b[^\n]*/im
  const match = rawText.match(headerRe)

  let itineraryText = rawText
  let pendingBlock = ''

  if (match && match.index !== undefined) {
    itineraryText = rawText.slice(0, match.index)
    pendingBlock = rawText.slice(match.index + match[0].length)
  }

  const days = parseItineraryText(itineraryText, year)

  // Also collect "PENDENTE" / "A RESERVAR" activities from the day activities
  const autoItems: PendingItem[] = []
  for (const day of days) {
    for (const act of day.activities) {
      const combined = [act.title, act.description, act.notes].join(' ')
      if (/\bpendente\b|a\s+reservar\b|a\s+comprar\b/i.test(combined)) {
        autoItems.push({
          id: uid(),
          title: act.title,
          dateNeeded: '',
          howTo: '',
          responsible: '',
          status: 'pendente',
          priority: pendingPriority(combined),
          notes: `${day.city} · ${day.date}`,
        })
      }
    }
  }

  const pendingItems = [...parsePendingBlock(pendingBlock), ...autoItems]
  return { days, pendingItems }
}

export interface ParseDebug {
  totalLines: number
  dateLines: { line: string; date: string }[]
  firstLine: string
}

export function debugParseItinerary(rawText: string, year = 2026): ParseDebug {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const dateLines = lines
    .filter(l => isDateLine(l))
    .map(l => ({ line: l, date: parseDate(l, year)! }))
  return { totalLines: lines.length, dateLines, firstLine: lines[0] ?? '' }
}
