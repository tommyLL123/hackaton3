import type { SignalStatus, SignalType, Severity, Species, TropelSort, VitalState } from '../types/api';
import { severityOptions, signalStatusOptions, signalTypeOptions, speciesOptions, tropelPageSizes, tropelSortOptions, vitalStateOptions } from './constants';

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function numberIn<T extends number>(value: string | null, allowed: readonly T[], fallback: T): T {
  const parsed = Number(value);
  return allowed.includes(parsed as T) ? (parsed as T) : fallback;
}

function safePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export interface TropelUrlState {
  page: number;
  size: 10 | 20 | 50;
  species?: Species;
  vitalState?: VitalState;
  sectorId?: string;
  q?: string;
  sort: TropelSort;
}

export function parseTropelUrlState(params: URLSearchParams): TropelUrlState {
  return {
    page: safePage(params.get('page')),
    size: numberIn(params.get('size'), tropelPageSizes, 20),
    species: oneOf(params.get('species'), speciesOptions),
    vitalState: oneOf(params.get('vitalState'), vitalStateOptions),
    sectorId: params.get('sectorId') || undefined,
    q: params.get('q')?.slice(0, 80) || undefined,
    sort: oneOf(params.get('sort'), tropelSortOptions) ?? 'updatedAt,desc',
  };
}

export interface SignalFeedUrlState {
  signalType?: SignalType;
  severity?: Severity;
  status?: SignalStatus;
  q?: string;
}

export function parseSignalFeedUrlState(params: URLSearchParams): SignalFeedUrlState {
  return {
    signalType: oneOf(params.get('signalType'), signalTypeOptions),
    severity: oneOf(params.get('severity'), severityOptions),
    status: oneOf(params.get('status'), signalStatusOptions),
    q: params.get('q')?.slice(0, 80) || undefined,
  };
}

export function setOrDelete(params: URLSearchParams, key: string, value: string | number | undefined): URLSearchParams {
  const next = new URLSearchParams(params);
  if (value === undefined || value === '') next.delete(key);
  else next.set(key, String(value));
  return next;
}
