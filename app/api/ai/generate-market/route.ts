import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, history } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Get current UTC time
    const now = new Date();
    const currentUTC = now.toISOString();

    // Build messages array with history
    const messages: any[] = [
      {
        role: "system",
        content: `You are a helpful assistant that generates prediction market data for VeriFi Protocol.

CURRENT UTC TIME: ${currentUTC}

IMPORTANT: Only use these available oracles:
- "aptos-balance": Track APT balance of a specific wallet address
- "usdc-total-supply": Monitor total USDC circulating supply on Aptos

Return ONLY valid JSON with this exact structure:
{
  "title": "string (max 100 chars)",
  "description": "string (max 500 chars, explain YES/NO outcomes)",
  "oracleId": "aptos-balance" | "usdc-total-supply",
  "targetAddress": "string (0x... for aptos-balance, empty for usdc-total-supply)",
  "targetValue": "number (in smallest units: octas for APT, base units for USDC)",
  "operator": 0 | 1,
  "resolutionDate": "string (ISO 8601 format: YYYY-MM-DDTHH:MM:SS)"
}

ORACLE RULES:
- aptos-balance: needs targetAddress, targetValue in octas (1 APT = 100000000 octas)
- usdc-total-supply: targetAddress = "", targetValue in units (1 USDC = 1000000 units)

OPERATORS:
- 0 = GREATER_THAN
- 1 = LESS_THAN

DATE FORMAT RULES - CRITICAL:
- The CURRENT UTC TIME is provided above in ISO format (e.g., "2025-10-02T21:53:45.123Z")
- Parse the UTC time, add the requested duration, and return in format: "YYYY-MM-DDTHH:mm:00"
- Example: If current UTC is "2025-10-02T21:53:45.123Z" and user says "in 1 hour":
  1. Extract: 2025-10-02 21:53
  2. Add 1 hour: 2025-10-02 22:53
  3. Return: "2025-10-02T22:53:00"
- IMPORTANT: Return the UTC time directly, DO NOT convert to any other timezone

CONVERSATION CONTEXT RULES:
- If user says "the date/time is wrong" or similar, regenerate the SAME market but recalculate the resolution time from current UTC
- If user says "that's not what I asked", regenerate the ORIGINAL market request from the conversation history
- NEVER change the oracle type, target, or condition unless explicitly asked
- Only modify what the user specifically requests to change

RESPONSE FORMAT:
- Return ONLY a valid JSON object
- NO markdown code blocks (no \`\`\`json)
- NO explanatory text before or after the JSON
- The JSON must be parseable directly`,
      },
    ];

    // Add conversation history if provided
    if (history && Array.isArray(history)) {
      // Filter out system messages from history and add user/assistant messages
      const conversationMessages = history
        .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
        .map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }));
      messages.push(...conversationMessages);
    }

    // Add the current user prompt
    messages.push({
      role: "user",
      content: prompt,
    });

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 },
      );
    }

    // Try to parse as JSON
    try {
      // Remove markdown code blocks if present
      let cleanedContent = content.trim();

      // Check if content is wrapped in ```json ... ```
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/, "");
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent
          .replace(/^```\s*/, "")
          .replace(/```\s*$/, "");
      }

      const marketData = JSON.parse(cleanedContent.trim());
      return NextResponse.json({ success: true, data: marketData });
    } catch (parseError) {
      // If not valid JSON, return the text explanation
      return NextResponse.json({
        success: false,
        message: content,
      });
    }
  } catch (error) {
    console.error("Error generating market:", error);
    return NextResponse.json(
      { error: "Failed to generate market data" },
      { status: 500 },
    );
  }
}
