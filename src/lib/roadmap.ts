import type { Roadmap, RoadmapPhase } from './types';
import { TOPICS } from './data/topics';

export function generateRoadmap(score: number, total: number): Roadmap {
  const pct = (score / total) * 100;

  let level: Roadmap['level'];
  let summary: string;
  let strengths: string[] = [];
  let weaknesses: string[] = [];

  if (pct < 40) {
    level = 'beginner';
    summary = `You scored ${score}/${total} (${Math.round(pct)}%). You're at the beginning of your DSA journey. Don't worry — everyone starts here! This roadmap will build your foundations step by step. Focus on consistency: solve 1-2 problems daily and review solutions even when you get them right.`;
    strengths = ['Willingness to learn'];
    weaknesses = ['Core DSA patterns', 'Data structure fundamentals', 'Complexity analysis'];
  } else if (pct < 70) {
    level = 'intermediate';
    summary = `You scored ${score}/${total} (${Math.round(pct)}%). You have a solid foundation! You understand the basics but need to deepen your pattern recognition and tackle harder problems. This roadmap focuses on intermediate patterns (sliding window, BFS/DFS, DP) and company-specific prep.`;
    strengths = ['Basic data structures', 'Common patterns', 'Complexity intuition'];
    weaknesses = ['Advanced DP', 'Graph algorithms', 'System design thinking'];
  } else {
    level = 'advanced';
    summary = `Excellent! You scored ${score}/${total} (${Math.round(pct)}%). You're interview-ready for most companies. This roadmap focuses on hard problems, edge cases, and company-specific preparation. Consider simulating real interviews and studying system design for senior roles.`;
    strengths = ['Strong pattern recognition', 'Multiple approaches per problem', 'Solid fundamentals'];
    weaknesses = ['Hard problem consistency', 'Time pressure performance', 'System design depth'];
  }

  const phases = generatePhases(level);

  return { level, score, total, summary, strengths, weaknesses, phases };
}

function generatePhases(level: Roadmap['level']): RoadmapPhase[] {
  const getProbs = (topics: string[]) => getProblemsForTopics(topics, level);

  if (level === 'beginner') {
    return [
      {
        week: 'Weeks 1-2',
        title: 'Phase 1: Arrays, Strings & Hashing',
        focus: 'Build solid DSA foundations. Focus on array traversals, basic string operations, and hash map lookups.',
        topics: ['arrays', 'strings', 'hashing'],
        problems: getProbs(['arrays', 'strings', 'hashing']).slice(0, 10),
        goal: 'Solve 6-8 Easy problems. Master Two-Pointer and Frequency Map basics.',
      },
      {
        week: 'Weeks 3-4',
        title: 'Phase 2: Linked Lists, Stacks & Queues',
        focus: 'Understand linear pointer connections and LIFO/FIFO storage principles.',
        topics: ['linkedlist', 'stacks'],
        problems: getProbs(['linkedlist', 'stacks']).slice(0, 10),
        goal: 'Reverse lists, validate parentheses, and get comfortable with stack-based memory.',
      },
      {
        week: 'Weeks 5-6',
        title: 'Phase 3: Binary Search & Greedy Algorithms',
        focus: 'Divide-and-conquer on sorted spaces, and locally optimal greedy selections.',
        topics: ['binarysearch', 'greedy'],
        problems: getProbs(['binarysearch', 'greedy']).slice(0, 10),
        goal: 'Implement standard binary search and solve interval/max-profit greedy tasks.',
      },
      {
        week: 'Weeks 7-8',
        title: 'Phase 4: Trees & Heaps',
        focus: 'Work with tree hierarchies, binary trees, BSTs, and priority queue sorting.',
        topics: ['trees', 'heaps'],
        problems: getProbs(['trees', 'heaps']).slice(0, 10),
        goal: 'Master tree traversals (pre/in/post-order) and heaps for k-th largest element.',
      },
      {
        week: 'Weeks 9-10',
        title: 'Phase 5: Graphs & Backtracking',
        focus: 'Explore graphs via BFS/DFS, and search backtracking paths (permutations/subsets).',
        topics: ['graphs', 'backtracking'],
        problems: getProbs(['graphs', 'backtracking']).slice(0, 8),
        goal: 'Identify components/islands, Course Schedule prerequisites, and word search grids.',
      },
      {
        week: 'Weeks 11-12',
        title: 'Phase 6: Dynamic Programming & Review',
        focus: 'Solve overlapping subproblems using memoization and bottom-up DP tables.',
        topics: ['dp'],
        problems: getProbs(['dp']).slice(0, 8),
        goal: 'Understand 1D DP (Stairs, House Robber) and review all 12 DSA topics.',
      },
    ];
  }

  if (level === 'intermediate') {
    return [
      {
        week: 'Weeks 1-2',
        title: 'Phase 1: Advanced Arrays, Strings & Hashing',
        focus: 'Deepen array manipulation and string parsing with variable sliding windows.',
        topics: ['arrays', 'strings', 'hashing'],
        problems: getProbs(['arrays', 'strings', 'hashing']).slice(0, 12),
        goal: 'Master 3Sum, Sliding Window Maximum, Group Anagrams, and consecutive sequences.',
      },
      {
        week: 'Weeks 3-4',
        title: 'Phase 2: Complex Lists, Stacks & Monotonic Patterns',
        focus: 'Design caches and solve next-greater element queries using monotonic stacks.',
        topics: ['linkedlist', 'stacks'],
        problems: getProbs(['linkedlist', 'stacks']).slice(0, 12),
        goal: 'Implement LRU Cache, detect list cycles, and use daily temperature monotonic stacks.',
      },
      {
        week: 'Weeks 5-6',
        title: 'Phase 3: Binary Search Boundaries & Greedy Scheduling',
        focus: 'Search insertion positions, eating speeds, and schedule meeting rooms greedily.',
        topics: ['binarysearch', 'greedy'],
        problems: getProbs(['binarysearch', 'greedy']).slice(0, 12),
        goal: 'Solve Koko eating bananas, rotated array minimum search, and task schedules.',
      },
      {
        week: 'Weeks 7-8',
        title: 'Phase 4: Advanced Trees & Priority Queues',
        focus: 'Validate BST properties, print right-side views, and merge lists with heaps.',
        topics: ['trees', 'heaps'],
        problems: getProbs(['trees', 'heaps']).slice(0, 12),
        goal: 'Solve BST validation, right side views, and merge K sorted lists.',
      },
      {
        week: 'Weeks 9-10',
        title: 'Phase 5: Connected Graphs & Backtracking State Space',
        focus: 'Model courses, find word loops, and generate recursive puzzle sets.',
        topics: ['graphs', 'backtracking'],
        problems: getProbs(['graphs', 'backtracking']).slice(0, 10),
        goal: 'Master Course Schedule, Word Search, Subsets, and N-Queens setups.',
      },
      {
        week: 'Weeks 11-12',
        title: 'Phase 6: Multi-Dimensional DP & Review',
        focus: 'Formulate 2D DP grids, coin changes, and consolidate DSA topics.',
        topics: ['dp'],
        problems: getProbs(['dp']).slice(0, 10),
        goal: 'Solve Longest Common Subsequence, Edit Distance, and mock interview problems.',
      },
    ];
  }

  // advanced
  return [
    {
      week: 'Weeks 1-2',
      title: 'Phase 1: Hard Arrays, Strings & Hash Schemes',
      focus: 'Optimize edge cases, trapping rain water, and advanced string windows.',
      topics: ['arrays', 'strings', 'hashing'],
      problems: getProbs(['arrays', 'strings', 'hashing']).slice(0, 15),
      goal: 'Solve Trapping Rain Water, Minimum Window Substring, and first missing positives.',
    },
    {
      week: 'Weeks 3-4',
      title: 'Phase 2: Advanced List Management & Monotonic Deques',
      focus: 'Solve advanced cache variants and max-area histogram problems.',
      topics: ['linkedlist', 'stacks'],
      problems: getProbs(['linkedlist', 'stacks']).slice(0, 12),
      goal: 'Master Merge K lists and largest rectangle in histogram.',
    },
    {
      week: 'Weeks 5-6',
      title: 'Phase 3: Binary Search Answers & Optimal Greedy Flows',
      focus: 'Perform binary search on answer spaces and solve flow optimization tasks.',
      topics: ['binarysearch', 'greedy'],
      problems: getProbs(['binarysearch', 'greedy']).slice(0, 12),
      goal: 'Solve Split Array Largest Sum and complex meeting allocations.',
    },
    {
      week: 'Weeks 7-8',
      title: 'Phase 4: Tree Traversal Paths & Streaming Heaps',
      focus: 'Serialize/deserialize complex trees and balance streaming medians.',
      topics: ['trees', 'heaps'],
      problems: getProbs(['trees', 'heaps']).slice(0, 12),
      goal: 'Solve Binary Tree Max Path Sum and Find Median from Data Stream.',
    },
    {
      week: 'Weeks 9-10',
      title: 'Phase 5: Shortest Path Graphs & Pruned Backtracking',
      focus: 'Run Dijkstra delays, topological sorts, and trie word grids.',
      topics: ['graphs', 'backtracking'],
      problems: getProbs(['graphs', 'backtracking']).slice(0, 10),
      goal: 'Solve Word Search II, Alien Dictionary, and Network Delay Time.',
    },
    {
      week: 'Weeks 11-12',
      title: 'Phase 6: Advanced DP & Review',
      focus: 'Solve interval DP partitions and carry out comprehensive simulation.',
      topics: ['dp'],
      problems: getProbs(['dp']).slice(0, 10),
      goal: 'Master Burst Balloons, edit distances, and practice speed mock drills.',
    },
  ];
}

function getProblemsForTopics(topics: string[], level: 'beginner' | 'intermediate' | 'advanced'): string[] {
  const result: string[] = [];
  let preferredDiffs: string[] = [];
  let fallbackDiffs: string[] = [];
  
  if (level === 'beginner') {
    preferredDiffs = ['easy'];
    fallbackDiffs = ['medium', 'hard'];
  } else if (level === 'intermediate') {
    preferredDiffs = ['easy', 'medium'];
    fallbackDiffs = ['hard'];
  } else {
    preferredDiffs = ['medium', 'hard'];
    fallbackDiffs = ['easy'];
  }

  for (const key of topics) {
    const topic = TOPICS[key];
    if (!topic) continue;
    
    let added = 0;
    for (const p of topic.problems) {
      if (preferredDiffs.includes(p.diff)) {
        result.push(p.id);
        added++;
      }
    }
    
    if (added === 0) {
      for (const p of topic.problems) {
        if (fallbackDiffs.includes(p.diff)) {
          result.push(p.id);
        }
      }
    }
  }
  return result;
}
