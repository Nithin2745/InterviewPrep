import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, className, methodName, args } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openrouter/owl-alpha";

    if (!apiKey) {
      console.warn("OPENROUTER_API_KEY is not set. Cannot run AI execution visualizer.");
      return NextResponse.json(
        { error: "AI Visualizer API key is missing. Please check your workspace .env file." },
        { status: 500 }
      );
    }

    const prompt = `
You are a sandboxed Java Virtual Machine execution tracer.
Given the following Java code:
\`\`\`java
${code}
\`\`\`

You need to execute class: "${className}", method: "${methodName}" with parameters matching: ${JSON.stringify(args)}.
Your task is to trace the step-by-step execution. Generate a chronological timeline list of steps.
For each step (whenever a line executes, a variable is assigned, a loop check occurs, or print statement is hit):
Record:
- "line": The 1-indexed line number in the code currently executing.
- "explanation": Plain-English description of what is happening (e.g. "Declared int left = 0", "Condition mid < target is true", "Swapping index 1 and 2").
- "stack": Array of active call stack frames (innermost call at the end of the array). Each frame must contain:
  - "methodName": String matching the method name (e.g. "binarySearch" or "Node.<init>").
  - "variables": Flat key-value dictionary of local variables (including arguments) in this active frame. Reference values must use the format "ref:array:<number>" or "ref:object:<number>".
- "heap": Dictionary mapping reference keys ("ref:array:1", "ref:object:2") to heap objects.
  - Arrays must look like: { "type": "array", "elementType": "int", "value": [elements...] }
  - Objects (like custom nodes) must look like: { "type": "object", "className": "Node", "fields": { "val": 10, "next": "ref:object:2" } }
- "output": String accumulator buffer containing everything printed to standard stdout up to this step.

Provide your response strictly in the following JSON format without any markdown backticks, explanations, or code fencing:
{
  "steps": [
    {
      "line": 5,
      "explanation": "Example step explanation",
      "stack": [
        {
          "methodName": "exampleMethod",
          "variables": {
            "left": 0,
            "arr": "ref:array:1"
          }
        }
      ],
      "heap": {
        "ref:array:1": {
          "type": "array",
          "elementType": "int",
          "value": [2, 4, 6]
        }
      },
      "output": "Console stdout buffer..."
    }
  ]
}
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "PlacementPrep Java Execution Tracer",
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
      throw new Error(`OpenRouter responded with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response content from OpenRouter");
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Failed to trace code execution via AI:", error);
    return NextResponse.json(
      { error: error.message || "Execution trace simulation failed." },
      { status: 500 }
    );
  }
}
