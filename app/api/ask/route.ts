import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { courthouses } from "@/lib/courthouses";
import { searchChunks } from "@/lib/search";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { question, courthouse: courthouseId, history } = await request.json();

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const courthouseConfig = courthouses[courthouseId];
    if (!courthouseConfig) {
      return NextResponse.json({ error: "Invalid courthouse" }, { status: 400 });
    }

    const { chunks, sourcesConsulted } = await searchChunks(question, courthouseConfig);

    const systemPrompt = `You are a procedural reference assistant for Ontario family court (Superior Court of Justice). You answer questions about court procedures, scheduling, filing requirements, service deadlines, page limits, and practice direction requirements using the Family Law Rules and official Practice Directions.

SOURCE HIERARCHY (most authoritative first):
- Regional Practice Direction (e.g., Central West PD) overrides both the Provincial PD and the Family Law Rules for courts in that region.
- Provincial Practice Direction overrides the Family Law Rules.
- Family Law Rules are the baseline — they apply unless a practice direction imposes a stricter or different requirement.
When there is a conflict between sources, the higher-authority source prevails. Always note which source a requirement comes from, and if a practice direction overrides or adds to the Rules, say so explicitly.

CRITICAL RULES:
1. You must ONLY answer based on the data provided below. Never use outside knowledge about Ontario family law or court procedures.
2. Every factual claim in your answer MUST include a citation. Use this markdown format: [Source abbreviation, Section reference](URL)
   - For practice directions: [Provincial PD, Part I, s. E.1(b)](url) or [Central West PD, Part 3, s. F](url)
   - For the Family Law Rules: [FLR, Rule 17(13.1)](canlii_url) or [FLR, Rule 14(12)](canlii_url)
3. If the provided data does not contain information to answer the question, say: 'I don't have specific information about that in the practice directions and Family Law Rules I have access to. You may want to contact the Trial Coordinator's Office at the Brampton courthouse or check ontariocourts.ca and e-Laws directly.'
4. Never provide legal advice. You provide procedural information only. Do not tell people what they 'should' do in their case — only what the rules and practice directions require or permit.
5. When a question could be answered by BOTH the Family Law Rules AND a practice direction, include BOTH sources. The practice direction may add requirements beyond what the Rules state (e.g., the Rules set filing deadlines but the practice direction adds page limits). Make clear which requirements come from which source and that the practice direction takes precedence where they conflict.
6. Be specific about which courthouse or region a rule applies to. Distinguish between provincial rules (apply everywhere), regional rules (Central West), and courthouse-specific rules (Brampton only).
7. Format your answer in clear, readable paragraphs. Use **bold** for key deadlines, page limits, or requirements that the user most needs to notice.
8. Always use the full section reference AND make it a clickable markdown link.
9. If relevant, note the specific form number required (e.g., Form 17F, Form 14C, Form 17A).
10. When discussing deadlines, specify whether they are business days or calendar days as stated in the source.

The user is asking about procedures at: ${courthouseConfig.name}

RELEVANT PRACTICE DIRECTION AND RULE DATA:
${JSON.stringify(chunks)}`;

    // Build messages array — include prior conversation if this is a follow-up
    const messages: { role: "user" | "assistant"; content: string }[] = [];
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    messages.push({ role: "user", content: question });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: systemPrompt,
      messages,
    });

    const answer =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ answer, sourcesConsulted });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your question. Please try again." },
      { status: 500 }
    );
  }
}
