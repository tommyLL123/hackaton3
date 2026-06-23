export type Species = 'BLOBITO' | 'CHISPA' | 'GRUNON' | 'DORMILON' | 'GLITCHY';
export type VitalState = 'ESTABLE' | 'HAMBRIENTO' | 'AGITADO' | 'MUTANDO' | 'CRITICO';
export type SignalType =
  | 'HAMBRE'
  | 'ABANDONO'
  | 'MUTACION'
  | 'FUGA'
  | 'CONFLICTO'
  | 'REPRODUCCION_MASIVA'
  | 'SENAL_CORRUPTA';
export type Severity = 'LEVE' | 'MODERADO' | 'GRAVE' | 'CRITICO';
export type SignalStatus = 'RECIBIDA' | 'PROCESANDO' | 'ATENDIDA';
export type Climate = 'PIXEL_FOREST' | 'NEON_CAVE' | 'CLOUD_AQUARIUM' | 'RETRO_ARCADE';
export type TropelSort = 'name,asc' | 'updatedAt,desc' | 'chaosIndex,desc';

export interface User {
  id: string;
  displayName: string;
  email: string;
  teamCode: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface DashboardSummary {
  totalTropels: number;
  criticalTropels: number;
  openSignals: number;
  sectorStabilityAvg: number;
  signalsBySeverity: Record<Severity, number>;
  generatedAt: string;
}

export interface SectorLite {
  id: string;
  sectorCode: string;
  name: string;
  climate: Climate;
  capacity: number;
  currentLoad: number;
  stabilityLevel: number;
}

export interface SectorListResponse {
  items: SectorLite[];
}

export interface TropelSectorRef {
  id: string;
  name: string;
  sectorCode: string;
}

export interface Tropel {
  id: string;
  name: string;
  species: Species;
  vitalState: VitalState;
  energyLevel: number;
  chaosIndex: number;
  mutationStage: number;
  guardianName: string;
  sector: TropelSectorRef;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTropelsResponse {
  content: Tropel[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface SignalTropelRef {
  id: string;
  name: string;
  species: Species;
}

export interface Signal {
  id: string;
  signalType: SignalType;
  severity: Severity;
  status: SignalStatus;
  rawContent: string;
  tropel: SignalTropelRef;
  createdAt: string;
  updatedAt: string;
}

export interface SignalFeedResponse {
  items: Signal[];
  nextCursor: string | null;
  hasMore: boolean;
  totalEstimate: number;
}

export interface ApiErrorPayload {
  error: string;
  message: string;
  timestamp: string;
  path: string;
  details: Record<string, unknown>;
}

export interface SectorStoryHeader {
  id: string;
  name: string;
  climate: Climate;
}

export type StoryMetricValue = string | number | boolean | null;

export interface SectorStoryStage {
  id: string;
  order: number;
  title: string;
  narrative: string;
  dominantEvent: SignalType;
  metrics: Record<string, StoryMetricValue>;
  assetKey: string;
  colorToken: string;
  progress: number;
}

export interface SectorStoryResponse {
  sector: SectorStoryHeader;
  stages: SectorStoryStage[];
}
