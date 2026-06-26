export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { QUIZ_QUESTIONS } from "@/lib/data/quiz";

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openrouter/owl-alpha";

  // If API key is not configured, fall back immediately to static questions
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is not set, falling back to static quiz.");
    return NextResponse.json({ questions: getRandomStaticQuestions(15) });
  }

  try {
    const prompt = `
Generate exactly 15 unique multiple choice questions for a Data Structures and Algorithms (DSA) onboarding quiz.
The topics should be selected from: Arrays, Strings, Hashing, Linked Lists, Stacks & Queues, Binary Search, Trees, Graphs, Backtracking, Dynamic Programming, Greedy, Heaps.
The difficulty distribution must be: exactly 5 easy, 6 medium, and 4 hard questions.
Provide your response strictly in the following JSON format without any markdown backticks, explanations, or code fencing:
{
  "questions": [
    {
      "id": "q_dynamic_1",
      "lang": "general",
      "topic": "topic name (e.g. Arrays, Trees, DP)",
      "difficulty": "easy | medium | hard",
      "question": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 0, // 0-based index of correct option (0, 1, 2, or 3)
      "explanation": "explanation of why this answer is correct"
    }
  ]
}
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "PlacementPrep Tracker",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter API responded with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response content from OpenRouter");
    }

    // Try parsing the response content as JSON
    const parsedData = JSON.parse(content);
    
    if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
      // Add ids if missing
      const cleanedQuestions = parsedData.questions.map((q: any, i: number) => ({
        id: q.id || `q_dynamic_${Date.now()}_${i}`,
        lang: q.lang || "general",
        topic: q.topic || "General",
        difficulty: q.difficulty || "medium",
        question: q.question,
        options: q.options,
        correct: typeof q.correct === "number" ? q.correct : 0,
        explanation: q.explanation || "Correct answer.",
      }));
      return NextResponse.json({ questions: cleanedQuestions });
    }

    throw new Error("Invalid questions structure in JSON response");
  } catch (error: any) {
    console.error("Failed to generate dynamic quiz via OpenRouter:", error);
    // Graceful fallback to static questions
    return NextResponse.json({ questions: getRandomStaticQuestions(15) });
  }
}

function getRandomStaticQuestions(count: number) {
  const easy = QUIZ_QUESTIONS.filter((q) => q.difficulty === 'easy').sort(() => 0.5 - Math.random());
  const medium = QUIZ_QUESTIONS.filter((q) => q.difficulty === 'medium').sort(() => 0.5 - Math.random());
  const hard = QUIZ_QUESTIONS.filter((q) => q.difficulty === 'hard').sort(() => 0.5 - Math.random());

  // We want 5 easy, 6 medium, 4 hard (total 15)
  const selected = [
    ...easy.slice(0, 5),
    ...medium.slice(0, 6),
    ...hard.slice(0, 4)
  ];

  // Shuffle selected questions
  return selected.sort(() => 0.5 - Math.random());
}
