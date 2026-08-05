/*
  engine.js — a thin, client-side wrapper around the existing Amadeus GDS
  simulator modules. It initializes every sub-system once and exposes a single
  runCommand(input) that mirrors the original main.js dispatch, returning
  structured output lines the React terminal can render.
*/

import { initParser, normalizeInput, parseCommand } from './parser.js'
import { initPricing } from './pricing.js'
import { initAncillary } from './ancillary.js'
import { initQueues, isQueueModeActive, handleQueueModeInput } from './queues.js'
import { initSeatmaps } from './seatmaps.js'
import { initErrors, handleErrorFlow } from './errors.js'

import airports from './data/airports.json'
import airlines from './data/airlines.json'
import rbd from './data/rbd.json'
import flights from './data/flights.json'
import fares from './data/fares.json'
import hotels from './data/hotels.json'
import cars from './data/cars.json'
import ssr from './data/ssr.json'
import timatic from './data/timatic.json'
import queues from './data/queues.json'
import seatmaps from './data/seatmabs.json'
import errors from './data/errors.json'

let initialized = false

export function initEngine() {
  if (initialized) return
  initParser({ airports, airlines, rbd, flights })
  initPricing(fares)
  initAncillary({ hotels, cars, ssr, timatic })
  initQueues(queues)
  initSeatmaps(seatmaps)
  initErrors(errors)
  initialized = true
}

/**
 * Runs a raw command string and returns an array of output line objects:
 *   { text: string, kind: 'command' | 'response' | 'error' | 'hint' }
 */
export function runCommand(raw) {
  if (!initialized) initEngine()

  const lines = []
  if (!raw || !raw.trim()) return lines

  const normalized = normalizeInput(raw)

  let response
  let isRegularCommand = false

  if (isQueueModeActive()) {
    response = handleQueueModeInput(normalized)
  } else {
    response = parseCommand(normalized)
    isRegularCommand = true
  }

  const isErrorResponse = looksLikeError(response)
  String(response)
    .split('\n')
    .forEach((line) => lines.push({ text: line, kind: isErrorResponse ? 'error' : 'response' }))

  if (isRegularCommand) {
    const errorFlow = handleErrorFlow(response, normalized)
    if (errorFlow && errorFlow.length) {
      errorFlow.forEach((line) => lines.push({ text: line, kind: 'hint' }))
    }
  }

  return lines
}

const KNOWN_ERROR_TOKENS = [
  'FORMAT',
  'UNKNOWN COMMAND',
  'UNKNOWN CITY',
  'NO FLIGHTS',
  'NO FARES',
  'INVALID',
  'NOT AVAILABLE',
  'NOT ENOUGH',
  'NEED AVAILABILITY',
  'CHECK RESTRICTIONS',
  'ERROR',
]

function looksLikeError(response) {
  const first = String(response).split('\n')[0].toUpperCase()
  return KNOWN_ERROR_TOKENS.some((t) => first.includes(t))
}
