import type { Severity, SignalStatus, SignalType, Species, TropelSort, VitalState } from '../types/api';

export const speciesOptions: Species[] = ['BLOBITO', 'CHISPA', 'GRUNON', 'DORMILON', 'GLITCHY'];
export const vitalStateOptions: VitalState[] = ['ESTABLE', 'HAMBRIENTO', 'AGITADO', 'MUTANDO', 'CRITICO'];
export const signalTypeOptions: SignalType[] = [
  'HAMBRE',
  'ABANDONO',
  'MUTACION',
  'FUGA',
  'CONFLICTO',
  'REPRODUCCION_MASIVA',
  'SENAL_CORRUPTA',
];
export const severityOptions: Severity[] = ['LEVE', 'MODERADO', 'GRAVE', 'CRITICO'];
export const signalStatusOptions: SignalStatus[] = ['RECIBIDA', 'PROCESANDO', 'ATENDIDA'];
export const patchableStatusOptions: SignalStatus[] = ['PROCESANDO', 'ATENDIDA'];
export const tropelSortOptions: TropelSort[] = ['updatedAt,desc', 'name,asc', 'chaosIndex,desc'];
export const tropelPageSizes = [10, 20, 50] as const;
