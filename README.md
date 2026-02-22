# TTB Label Verification Tool

**Live Demo**: [https://ttb-label-verifier-omega.vercel.app](https://ttb-label-verifier-omega.vercel.app)

AI-powered alcohol label compliance checking tool for TTB (Alcohol and Tobacco Tax and Trade Bureau) agents. Upload label images, enter application data, and get instant field-by-field verification results.

## Features

- **AI-Powered Extraction**: Uses Claude Sonnet 4.5 (multimodal vision) to extract text from label photos, handling curved text, glare, and imperfect angles
- **Field-by-Field Comparison**: Compares extracted label data against application data with fuzzy matching (Levenshtein distance) for brand names, numeric comparison for ABV/volume
- **Government Warning Verification**: Checks exact wording, ALL CAPS header, bold formatting, and visual separation per 27 CFR Part 16
- **Batch Processing**: Upload up to 300 labels at once with parallel processing (5 concurrent), progress tracking, and CSV export
- **Simple UI**: Single-page workflow with large click targets, color-coded results (green/yellow/red), designed for non-technical users

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **AI/OCR**: Anthropic Claude Sonnet 4.5 API (vision + structured tool_use output)
- **UI**: Tailwind CSS + shadcn/ui components
- **Fuzzy Matching**: Custom Levenshtein distance (zero dependencies)
- **Deployment**: Vercel

## Setup & Run

### Prerequisites

- Node.js 18+ (install via `nvm install --lts`)
- An Anthropic API key ([get one here](https://console.anthropic.com/))

### Local Development

```bash
# Clone the repo
git clone https://github.com/Pieismath/ttb-label-verifier.git
cd ttb-label-verifier

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Open http://localhost:3000.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (required) |

### Deploy to Vercel

1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Add `ANTHROPIC_API_KEY` as an environment variable
4. Deploy

## How It Works

### Architecture

```
Browser → Upload image + application data
       → Next.js API Route (/api/verify)
       → Claude Sonnet 4.5 Vision (structured extraction)
       → Deterministic comparison engine
       → Field-by-field results with pass/fail status
```

### Extraction

Label images are sent to Claude Sonnet 4.5 with a compliance-expert system prompt. The response is forced into a structured JSON schema via `tool_use`, guaranteeing all fields are returned in a predictable format. This handles:
- Curved bottle text
- Glare and reflections
- Angled/tilted photos
- Bold/caps formatting detection for government warning

### Comparison

Extraction and comparison are separated for auditability. The comparison engine uses field-specific strategies:

| Field | Strategy | Threshold |
|-------|----------|-----------|
| Brand Name | Fuzzy (Levenshtein, case-insensitive) | 85% |
| Class/Type | Fuzzy (Levenshtein) | 80% |
| Alcohol Content | Numeric extraction & comparison | Exact |
| Net Contents | Numeric + unit normalization | Exact |
| Producer | Fuzzy (Levenshtein) | 80% |
| Government Warning | Exact text + formatting checks | Exact |

### Batch Processing

Client-side orchestration sends 5 parallel requests at a time. This avoids serverless function timeouts and provides real-time progress feedback. Results stream in as they complete.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main single-page application
│   ├── layout.tsx            # Root layout
│   └── api/
│       ├── extract/route.ts  # Extraction-only endpoint
│       └── verify/route.ts   # Extract + compare endpoint
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── Header.tsx
│   ├── BeverageTypeSelector.tsx
│   ├── ApplicationDataForm.tsx
│   ├── ImageUploader.tsx
│   ├── VerificationResult.tsx  # Side-by-side view, print, AI details
│   ├── ComparisonDetail.tsx
│   ├── GovernmentWarningCheck.tsx
│   ├── BatchResultsTable.tsx   # CSV export, progress tracking
│   ├── VerificationHistory.tsx # Past verifications with summary stats
│   └── FieldMatchIndicator.tsx
├── lib/
│   ├── types.ts              # All TypeScript interfaces
│   ├── anthropic.ts          # Claude API client
│   ├── extraction-schema.ts  # AI tool definition
│   ├── comparison.ts         # Comparison orchestrator
│   ├── fuzzy-match.ts        # Levenshtein + normalization
│   ├── government-warning.ts # GW statement validation
│   ├── field-requirements.ts # Per-beverage-type configs
│   └── image-utils.ts        # Client-side image handling
└── hooks/
    ├── useVerification.ts      # Single-label hook
    ├── useBatchVerification.ts # Batch processing hook
    └── useVerificationHistory.ts # localStorage history persistence
```

## Assumptions & Trade-offs

1. **Claude Vision over OCR**: Chose multimodal LLM over Tesseract/EasyOCR because traditional OCR cannot assess formatting (bold detection), struggles with curved text, and requires image preprocessing pipelines. The trade-off is API cost (~$0.01-0.03 per label).

2. **Separated extraction & comparison**: Two stages instead of one LLM call. This makes results auditable and debuggable — you can see exactly what the AI extracted vs. what the comparison flagged.

3. **Client-side batch orchestration**: Instead of a single server request for batch processing, the client sends parallel requests. This avoids serverless timeouts, provides streaming progress, and is resilient to individual failures.

4. **No persistent storage**: This is a stateless prototype. Results are displayed immediately and not stored. A production version would add a database for audit trails.

5. **Government Warning formatting via AI judgment**: Bold detection and visual separation are assessed by the LLM's visual understanding rather than pixel analysis. This is imperfect but practical for a prototype.

6. **No COLA system integration**: This is a standalone tool per the project requirements.

## Testing

```bash
# Build check
npm run build

# Lint
npm run lint
```

To test the full flow:
1. Run `npm run dev`
2. Click "Try sample data" to pre-fill the form
3. Upload an alcohol label image (AI-generated test labels work well)
4. Click "Verify Label" and review the results
