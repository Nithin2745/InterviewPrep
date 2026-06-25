'use client';

export function Resources() {
  const sections = [
    {
      title: '🎯 DSA Practice',
      items: [
        ['NeetCode.io', 'https://neetcode.io', 'Best structured DSA roadmap with video solutions'],
        ["Striver's A2Z Sheet", 'https://takeuforward.org/strivers-a2z-dsa-course', 'Most popular sheet for Indian placements'],
        ['LeetCode Top 150', 'https://leetcode.com/studyplan/top-interview-150/', 'Top interview questions curated by LeetCode'],
        ['Blind 75', 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions', 'Classic 75 must-do problems'],
      ],
    },
    {
      title: '🎓 DSA Learning',
      items: [
        ['GFG DSA Course', 'https://www.geeksforgeeks.org/dsa-tutorial-learn-data-structures-and-algorithms/', 'Free complete DSA tutorial'],
        ['CS50 Harvard (Free)', 'https://cs50.harvard.edu/x/', 'World-class CS fundamentals'],
        ['Abdul Bari (YouTube)', 'https://www.youtube.com/@abdul_bari', 'Best algorithm explanations in Hindi/English'],
        ['Aditya Verma DP', 'https://www.youtube.com/playlist?list=PL_z_8CaSLPWekqhdCPmFohncHwz8TY2Go', 'Best Dynamic Programming playlist'],
      ],
    },
    {
      title: '🏢 Company Prep',
      items: [
        ['GFG Company Prep', 'https://www.geeksforgeeks.org/company-preparation/', 'Company-wise interview experiences'],
        ['Glassdoor Reviews', 'https://www.glassdoor.co.in/', 'Real interview experiences'],
        ['AmbitionBox', 'https://www.ambitionbox.com/', 'Salary + interview insights for Indian companies'],
        ['InterviewBit', 'https://www.interviewbit.com/', 'Structured company-specific interview prep'],
      ],
    },
    {
      title: '🚀 Flutter & Cloud',
      items: [
        ['Flutter Docs', 'https://docs.flutter.dev/', 'Official Flutter documentation'],
        ['AWS Free Tier', 'https://aws.amazon.com/free/', 'Practice with real AWS services free'],
        ['Flutter Riverpod', 'https://riverpod.dev/', 'Advanced Flutter state management'],
        ['AWS Skill Builder', 'https://skillbuilder.aws/', 'Free AWS training and practice exams'],
      ],
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">📚 Study Resources</h1>
        <p className="text-sm text-[var(--muted)]">Best free resources curated for placement preparation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {sections.map((s, i) => (
          <div key={s.title} className="card-in bg-[var(--card)] border border-[var(--border)] rounded-xl p-4" style={{ animationDelay: `${0.05 * i}s` }}>
            <h4 className="text-sm font-bold mb-2.5 text-[var(--accent)]">{s.title}</h4>
            {s.items.map(([n, u, d]) => (
              <a
                key={n}
                href={u}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-2 border-b border-[var(--border)] last:border-b-0 hover:pl-1 transition-all"
              >
                <span className="text-xs font-semibold text-[var(--text)]">{n} ↗</span>
                <span className="block text-[10px] text-[var(--muted)] mt-0.5">{d}</span>
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Daily Schedule */}
      <div className="rounded-2xl p-5 border" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}>
        <h3 className="text-sm font-bold text-[var(--accent)] mb-2.5">📅 Recommended Daily Schedule</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {[
            ['🌅 Morning (30 min)', '1 LeetCode problem (Easy or Medium). Fresh brain = best for problem solving'],
            ['🌆 Evening (20 min)', "Review yesterday's solution. Read top discussion. Understand better approach"],
            ['🎯 Weekend (1 hour)', 'Attempt 1 mock aptitude test + 1 LeetCode contest to simulate real pressure'],
          ].map(([t, d]) => (
            <div key={t} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
              <div className="font-bold mb-1.5 text-[var(--text)]">{t}</div>
              <div className="text-[var(--muted)] leading-relaxed">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
