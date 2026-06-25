import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, activeCode, activeLanguage, currentProblem, profile, terminalLogs } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openrouter/owl-alpha";

    if (!apiKey) {
      console.warn("OPENROUTER_API_KEY is not set.");
      return NextResponse.json({
        content: "Hello! I am PrepBot, your programming and DSA tutor. Currently, my API key is not configured, but I can see you are working on the platform. Let me know if you need anything!"
      });
    }

    const systemPrompt = `You are "PrepBot", an intelligent programming tutor, DSA coach, and navigation guide integrated into the PlacementPrep Tracker platform.

Your primary mission is to help the user learn Data Structures and Algorithms (DSA), computer programming, and guide them in navigating or using this PlacementPrep website. You have full visibility into their current workspace, editor code, profile, and execution console outputs.

CRITICAL BEHAVIORAL RESTRICTIONS:
1. STRICT CONSTRAINT: You MUST ONLY answer questions, explain concepts, write/debug code, or discuss topics directly related to computer programming, software engineering, Data Structures & Algorithms (DSA), or the PlacementPrep website itself.
2. REFUSAL POLICY: If the user asks you about ANY other topic (for example: general knowledge, history, geography, sports, pop culture, movies, music, politics, weather, translations of general text, jokes not related to programming, recipes, creative writing, general conversations not related to technical learning, etc.), you MUST politely but firmly refuse to answer. You should reply with a short refusal response explaining your limitations and guiding them back to programming, DSA, or website help.
   Example refusal: "I'm sorry, but I can only answer questions related to programming, Data Structures & Algorithms (DSA), or this website. Please ask me a question about these topics!"
3. TUTORING STYLE: When the user asks about code mistakes, do not simply output the final solution code. Instead, analyze their code, explain the conceptual bug (e.g. infinite loop, edge case, index off-by-one, wrong return type, syntax error), suggest how they should rethink the logic, and guide them to correct it. Provide full code blocks only when they explicitly ask for it or when it is essential for explaining a pattern.
4. BE PRECISE AND CONCISE: Keep your explanations clear, structured, and easy to read.

REAL-TIME USER CONTEXT:
- Active Problem: ${currentProblem ? `${currentProblem.name} (${currentProblem.diff}) - Pattern: ${currentProblem.pattern || 'None'}` : 'None selected'}
- Selected Coding Language: ${activeLanguage || 'Unknown'}
- Current Code in Editor:
\`\`\`${activeLanguage || ''}
${activeCode || '(No code written yet)'}
\`\`\`
- Recent Terminal/Console Output:
${terminalLogs && terminalLogs.length > 0 ? terminalLogs.join('\n') : '(Console is empty/No code executed yet)'}
- User Profile:
  * Logged In: ${profile?.isLoggedIn ? 'Yes' : 'No'}
  * Email: ${profile?.userEmail || 'Anonymous'}
  * Streak: ${profile?.streak || 0} days
  * Solved problems count: ${profile?.completed ? profile.completed.length : 0}

Please respond to the user's latest query directly in text. Remember: ONLY answer coding, DSA, or PlacementPrep questions, and refuse everything else.
`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "PlacementPrep PrepBot Chatbot",
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter responded with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response content from OpenRouter");
    }

    return NextResponse.json({ content });

  } catch (error: any) {
    console.error("PrepBot chatbot failed:", error);
    return NextResponse.json({
      content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a few moments."
    });
  }
}
