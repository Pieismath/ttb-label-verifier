import { NextRequest, NextResponse } from "next/server";
import { extractLabelData, ImageMediaType } from "@/lib/anthropic";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType } = await request.json();

    if (!imageBase64 || !mediaType) {
      return NextResponse.json(
        { error: "Missing imageBase64 or mediaType" },
        { status: 400 }
      );
    }

    const validTypes: ImageMediaType[] = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: "Invalid media type. Accepted: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    const startTime = performance.now();
    const extractedData = await extractLabelData(imageBase64, mediaType);
    const processingTimeMs = Math.round(performance.now() - startTime);

    return NextResponse.json({ extractedData, processingTimeMs });
  } catch (error) {
    console.error("Extraction error:", error);
    const message =
      error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
