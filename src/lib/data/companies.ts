import type { Company, Problem } from '../types';
import companiesRaw from './companies.json';

const COMPANIES_RAW = companiesRaw as Record<string, {
  name: string;
  color: string;
  round: string;
  desc: string;
  tags: string[];
  problems: any[];
}>;

import { SOLUTIONS } from './solutions';

export const COMPANIES: Record<string, Company> = Object.fromEntries(
  Object.entries(COMPANIES_RAW).map(([key, raw]) => {
    const problems: Problem[] = raw.problems.map((p: any) => ({
      id: p.id,
      name: p.name,
      diff: p.diff,
      pattern: p.pattern || '',
      url: p.url,
      hint: p.hint || '',
      pseudocode: p.pseudocode || '',
      solutions: SOLUTIONS[p.id],
    }));
    return [key, {
      name: raw.name,
      color: raw.color,
      round: raw.round,
      desc: raw.desc,
      tags: raw.tags,
      problems,
    }];
  })
);
