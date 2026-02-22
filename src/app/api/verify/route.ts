import { NextRequest, NextResponse } from "next/server";
import { extractLabelData, ImageMediaType } from "@/lib/anthropic";
import { compareLabels } from "@/lib/comparison";
import { ApplicationData } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mediaType, applicationData } = body as {
      imageBase64: string;
      mediaType: ImageMediaType;
      applicationData: ApplicationData;
    };

    if (!imageBase64 || !mediaType || !applicationData) {
      return NextResponse.json(
        { error: "Missing required fields: imageBase64, mediaType, applicationData" },
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

    if (!applicationData.beverageType || !applicationData.brandName) {
      return NextResponse.json(
        { error: "Application data must include at least beverageType and brandName" },
        { status: 400 }
      );
    }

    const startTime = performance.now();

    // Step 1: Extract label data via AI
    const extractedData = await extractLabelData(imageBase64, mediaType);

    // Step 2: Compare extracted vs application data
    const result = compareLabels(extractedData, applicationData);

    result.processingTimeMs = Math.round(performance.now() - startTime);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Verification error:", error);
    const message =
      error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
