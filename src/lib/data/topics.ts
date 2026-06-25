import type { Topic, Problem } from '../types';
import type { Language } from '../types';

// Import raw topic data from JSON
import topicsRaw from './topics.json';

const TOPICS_RAW = topicsRaw as Record<string, {
  name: string;
  color: string;
  problems: any[];
}>;

// Topic icons and blurbs
const TOPIC_META: Record<string, { icon: string; blurb: string }> = {
  arrays: { icon: '📊', blurb: 'Foundation of DSA — master indexing, traversal, and in-place manipulation.' },
  strings: { icon: '🔤', blurb: 'Text processing, palindromes, pattern matching, and sliding window.' },
  hashing: { icon: '#️⃣', blurb: 'O(1) lookups for frequency counting, deduplication, and grouping.' },
  linkedlist: { icon: '🔗', blurb: 'Pointer manipulation, cycle detection, and in-place restructuring.' },
  stacks: { icon: '📚', blurb: 'LIFO structures — parentheses matching, monotonic patterns, expression evaluation.' },
  binarysearch: { icon: '🔍', blurb: 'Halve the search space every step. Answer-space search included.' },
  trees: { icon: '🌳', blurb: 'Hierarchical data — DFS, BFS, BST properties, and recursive thinking.' },
  dp: { icon: '🧠', blurb: 'Overlapping subproblems + optimal substructure. Memoize, don\'t recompute.' },
  graphs: { icon: '🕸️', blurb: 'Connectivity, traversal, shortest paths, and topological ordering.' },
  backtracking: { icon: '🔙', blurb: 'Explore all possibilities with pruning. Choose → recurse → undo.' },
  greedy: { icon: '💰', blurb: 'Locally optimal choices that lead to globally optimal solutions.' },
  heaps: { icon: '⛰️', blurb: 'Priority access — K-th elements, scheduling, and streaming medians.' },
};

// Build typed TOPICS with solutions merged in
import { SOLUTIONS } from './solutions';

export const TOPICS: Record<string, Topic> = Object.fromEntries(
  Object.entries(TOPICS_RAW).map(([key, raw]) => {
    const meta = TOPIC_META[key] || { icon: '📌', blurb: '' };
    const problems: Problem[] = raw.problems.map((p: any) => ({
      id: p.id,
      name: p.name,
      diff: p.diff,
      pattern: p.pattern,
      url: p.url,
      hint: p.hint,
      pseudocode: p.pseudocode,
      solutions: SOLUTIONS[p.id],
    }));
    return [key, {
      name: raw.name,
      color: raw.color,
      icon: meta.icon,
      blurb: meta.blurb,
      problems,
    }];
  })
);

export function getProblemById(id: string): Problem | null {
  for (const topic of Object.values(TOPICS)) {
    const p = topic.problems.find((p) => p.id === id);
    if (p) return p;
  }
  return null;
}

export function getTopicByProblemId(id: string): string | null {
  for (const [key, topic] of Object.entries(TOPICS)) {
    if (topic.problems.find((p) => p.id === id)) return key;
  }
  return null;
}

export function getAllProblems(): Problem[] {
  return Object.values(TOPICS).flatMap((t) => t.problems);
}
