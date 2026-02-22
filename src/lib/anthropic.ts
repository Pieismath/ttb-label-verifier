import Anthropic from "@anthropic-ai/sdk";
import { ExtractedLabelData } from "./types";
import { EXTRACTION_SYSTEM_PROMPT, extractionTool } from "./extraction-schema";

async function getApiKey(): Promise<string> {
  // Read directly from .env.local since system env may have an empty
  // ANTHROPIC_API_KEY (e.g. set by Claude Desktop), which prevents
  // Next.js from loading the .env.local value.
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) return envKey;

  try {
    const fs = await import("fs");
    const path = await import("path");
    const envPath = path.resolve(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf8") as string;
    const match = content.match(/ANTHROPIC_API_KEY=["']?([^\s"']+)["']?/);
    if (match?.[1]) return match[1];
  } catch {
    // ignore
  }

  throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local");
}

async function getClient(): Promise<Anthropic> {
  return new Anthropic({ apiKey: await getApiKey() });
}

export type ImageMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

export async function extractLabelData(
  imageBase64: string,
  mediaType: ImageMediaType
): Promise<ExtractedLabelData> {
  const anthropic = await getClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM_PROMPT,
    tools: [extractionTool],
    tool_choice: { type: "tool", name: "record_label_data" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Extract all label data from this alcohol beverage label image. Be thorough and accurate.",
          },
        ],
      },
    ],
  });

  const toolUseBlock = response.content.find(
    (block) => block.type === "tool_use"
  );

  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("No structured extraction returned from AI model");
  }

  return toolUseBlock.input as ExtractedLabelData;
}
