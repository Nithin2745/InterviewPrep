import type { Pattern } from '../types';
import patternsData from './patterns.json';

export const PATTERNS: Record<string, Pattern> = patternsData as Record<string, Pattern>;
