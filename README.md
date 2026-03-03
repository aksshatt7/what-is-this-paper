# Research Paper Analyzer

Upload a research paper PDF. Describe your ML pipeline. Get a structured breakdown of how that paper connects to your work — relevance score, concept mappings, and concrete implementation suggestions.

Built as a portfolio project demonstrating prompt chain design, async API architecture, and clean full-stack integration.

![Demo](https://img.shields.io/badge/status-live-brightgreen) ![Python](https://img.shields.io/badge/Python-3.12-blue) ![React](https://img.shields.io/badge/React-18-61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)

---

## What It Does

Most researchers find papers through keyword search and then manually evaluate whether they're relevant. This tool flips that: you describe your project once, then drop in any paper and immediately get:

- A **relevance score (1–10)** with reasoning specific to your pipeline
- **Concept mappings** — paper terminology translated to your own stack (e.g. "class prototypes → your BERT classification head")
- **3–5 actionable suggestions** with difficulty labels and honest caveats
- **Structured paper summary** — title, methods, key findings, domain

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  ContextPanel          AnalysisPanel         ResultCard         │
│  ┌─────────────┐       ┌──────────────┐      ┌─────────────┐   │
│  │ Demo paper  │       │ Selected     │      │ Score       │   │
│  │ cards       │       │ paper CTA    │      │ Summary     │   │
│  │ (5 papers)  │       │ + PDF drop   │      │ Mappings    │   │
│  │             │       │ zone         │      │ Suggestions │   │
│  │ Context     │       │ Multi-step   │      │             │   │
│  │ textarea    │       │ progress     │      │ [Copy .md]  │   │
│  │ [Set Ctx]   │       │ indicator    │      │             │   │
│  └─────────────┘       └──────────────┘      └─────────────┘   │
│          │                    │                                  │
│          └──── useAnalysis hook (fetch + state management) ─────┘
│                               │
└───────────────────────────────┼─────────────────────────────────┘
                                │ HTTP (proxied via Vite)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                       │
│                                                                 │
│  POST /set-context    POST /analyze-paper   POST /analyze-url  │
│  ┌──────────────┐     ┌──────────────────┐  ┌───────────────┐  │
│  │ SessionStore │     │ 1. Validate PDF   │  │ 1. Fetch PDF  │  │
│  │ (in-memory   │     │ 2. pdf_parser     │  │    via httpx  │  │
│  │  dict)       │     │ 3. analysis chain │  │ 2. pdf_parser │  │
│  └──────────────┘     └──────────────────┘  │ 3. chain      │  │
│                                              └───────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI CHAIN (3 sequential calls)              │
│                                                                 │
│  Paper text (chunked)                                           │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────┐    JSON     ┌──────────────┐    JSON              │
│  │ Step 1  │ ──────────► │   Step 2     │ ──────────►          │
│  │Summarize│             │  Relevance   │                       │
│  │ paper   │             │  assessment  │    ┌──────────────┐  │
│  └─────────┘             └──────────────┘    │   Step 3     │  │
│                                         ───► │  Actionable  │  │
│                                              │  suggestions │  │
│                                              └──────────────┘  │
│                                                     │           │
└─────────────────────────────────────────────────────┼───────────┘
                                                      │
                              { paper_summary, relevance, suggestions }
```

---

## The Prompt Chain

The core engineering is in [`backend/ai_chain.py`](backend/ai_chain.py). Rather than one large prompt, analysis runs as three sequential API calls where each step's output feeds the next.

### Why chain instead of a single prompt?

A single prompt asking for summary + relevance + suggestions produces mediocre results — the model spreads attention across competing objectives. Chaining gives each step full attention and lets each step build on richer context than a mega-prompt allows.

### Step 1 — Summarize

**Input:** Raw chunked paper text (up to 6 chunks × ~1500 chars ≈ 9000 chars of the most important sections)

**System prompt:** Research paper analyst extracting structured fields

**Output:**
```json
{
  "title": "Focal Loss for Dense Object Detection",
  "main_contribution": "...",
  "methods_used": ["Focal Loss", "RetinaNet", "FPN"],
  "key_findings": ["...", "..."],
  "domain": "computer vision"
}
```

### Step 2 — Relevance Assessment

**Input:** User's research context + Step 1 JSON (paper summary)

**System prompt:** Expert at connecting research papers to applied ML pipelines

**Output:**
```json
{
  "relevance_score": 8,
  "relevance_reasoning": "...",
  "applicable_areas": ["Loss function for classification head", "..."],
  "concept_mappings": [
    { "paper_concept": "Focal Loss", "user_pipeline_equivalent": "cross-entropy loss on your classification head" }
  ]
}
```

### Step 3 — Generate Suggestions

**Input:** User's research context + merged Steps 1+2 JSON

**System prompt:** Senior ML researcher giving practical implementation advice

**Output:**
```json
[
  {
    "title": "Replace cross-entropy with Focal Loss",
    "description": "...",
    "difficulty": "easy",
    "caveats": "..."
  }
]
```

### PDF Chunking Strategy

PDFs are split into overlapping chunks to avoid losing context at boundaries:

```
CHUNK_SIZE    = 1500 chars (~375 tokens)
CHUNK_OVERLAP = 200  chars

Full text ──► [Chunk 1]─────────────────────────
                               [Chunk 2]─────────────────────────
                                              [Chunk 3]──────────
```

Only the first 6 chunks (`MAX_CHUNKS`) are sent to the AI — enough to cover abstract, introduction, and methods of most papers while keeping token costs predictable. The chunker prefers to break on paragraph boundaries to preserve sentence coherence.

---

## Features

| Feature | Details |
|---|---|
| **Demo paper picker** | 5 curated classic ML papers (Transformers, LoRA, ResNet, Focal Loss, PPO) — click any to auto-fill a tailored context and analyze it live. |
| **Server-side PDF fetch** | Demo papers are fetched from arXiv by the backend (`/analyze-url`), so no manual download is needed. |
| **Context size guard** | `/set-context` rejects inputs over 12,000 characters with a clear error. Prevents accidental context-length errors from large file uploads. |
| **Multi-step progress** | 4-stage indicator (Fetching paper → Extracting key methods → Mapping to context → Generating suggestions) advances on a timer while the API is in flight. |
| **Export** | Copy as Markdown (clipboard) or Download .md — formatted with headers, method tags, concept mapping table, and suggestion blocks. |
| **Low relevance handling** | Score ≤ 3 triggers an honest banner: *"Low relevance — suggestions below are speculative."* |
| **File context loader** | Upload `.py`, `.ipynb`, or `.txt` files directly as context — the browser reads them locally, no extra upload. |

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast HMR dev loop, component model, minimal setup |
| Styling | Tailwind CSS | Utility-first, no context switching to CSS files |
| API client | Native `fetch` + custom hook | No extra dependency needed; hook encapsulates all loading/error state |
| Backend | FastAPI (Python 3.12) | Async-native, automatic OpenAPI docs, minimal boilerplate |
| AI | OpenAI `gpt-4o-mini` | Cost-efficient for multi-call chains; easily swappable to Claude |
| PDF parsing | PyMuPDF (`fitz`) | Fast, reliable text layer extraction |
| HTTP client | `httpx` | Async PDF fetching from arXiv URLs in `/analyze-url` |
| Session storage | In-memory dict | Appropriate for single-user portfolio; swap for Redis in production |

---

## Project Structure

```
research-analyzer/
├── backend/
│   ├── main.py           # FastAPI app, routes, CORS, context size guard
│   ├── ai_chain.py       # 3-step prompt chain (the core logic)
│   ├── pdf_parser.py     # PDF → text extraction + overlap chunking
│   ├── session_store.py  # In-memory context store (keyed by session_id)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── App.jsx                     # Root layout, session ID, selectedPaper state
│       ├── demo.js                     # 5 curated demo papers with preset contexts
│       ├── hooks/
│       │   └── useAnalysis.js          # All fetch logic, loading state, stage timer
│       └── components/
│           ├── ContextPanel.jsx        # Left column: demo paper cards + context textarea
│           ├── AnalysisPanel.jsx       # Right column: paper CTA + PDF drop zone + results
│           └── ResultCard.jsx          # Results display + markdown export
├── chain_test.py         # Run the AI chain standalone (no server needed)
└── README.md
```

---

## Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- An OpenAI API key ([platform.openai.com](https://platform.openai.com))

### Backend

```bash
cd backend

# Create and populate .env
cp .env.example .env
# Edit .env: OPENAI_API_KEY=sk-proj-...

# Install dependencies (use a venv if you prefer)
pip install -r requirements.txt

# Start the server (auto-reloads on file save)
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Verify: `curl http://localhost:8000/health` → `{"status":"ok"}`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Vite proxies all `/api/*` requests to the FastAPI backend, so no CORS configuration is needed in development.

---

## Testing the Chain Without the Server

`chain_test.py` in the project root lets you iterate on prompts without spinning up FastAPI:

```bash
# From project root
python chain_test.py
```

Edit `USER_CONTEXT` and `PAPER_EXCERPT` at the top of the file to test different inputs. Output is printed as formatted JSON for each of the three chain steps.

---

## API Reference

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check |
| `POST` | `/set-context` | `{ session_id, context }` | Save research context for a session. Returns 400 if context exceeds 12,000 characters. |
| `POST` | `/analyze-paper?session_id=X` | `multipart/form-data` (PDF file) | Upload a PDF and run the full analysis chain. |
| `POST` | `/analyze-url` | `{ session_id, pdf_url }` | Fetch a PDF from a URL (e.g. arXiv) server-side and run the analysis chain. Used by the demo paper picker. |

FastAPI auto-generates interactive docs at `http://localhost:8000/docs`.

---

## Design Decisions

**Why structured JSON output from the AI?**
Each chain step returns strict JSON, validated by `_parse_json()` which strips markdown code fences (Claude and GPT-4 sometimes wrap JSON in ` ```json ``` ` blocks). Structured output lets the frontend render specific fields — relevance score, method tags, difficulty badges — rather than parsing free text.

**Why not stream the response?**
Streaming would improve perceived latency but adds significant complexity: Server-Sent Events on the backend, incremental JSON parsing on the frontend, and partial render states for each chain step. The multi-step progress indicator achieves the same UX goal (signals activity, makes wait feel shorter) with a fraction of the complexity.

**Why a fixed session ID?**
For a single-user portfolio demo, a fixed ID is correct. A multi-user version would generate a UUID in the browser (`crypto.randomUUID()`), store it in `localStorage`, and include it with every request — the backend code already supports this pattern, it just uses a static ID by default.

**Why 6 chunks?**
6 chunks × ~375 tokens ≈ 2,250 tokens of paper text — enough to cover abstract, introduction, and the start of the methods section in most papers. Sending the entire paper would hit context limits on long papers and significantly increase cost per analysis. The most important content is almost always in the first ~9,000 characters.

**Why a 12,000-character context limit?**
Without a limit, uploading a large `.ipynb` or codebase file as context produces a 200k+ token request that immediately hits the model's context window. 12,000 characters (~3,000 tokens) is generous for a pipeline description while leaving ample headroom for paper text and output across three API calls.

**Why fetch demo PDFs server-side instead of pre-baking results?**
Pre-baked results are faster but static — they can't adapt to a user's custom context. Server-side fetching via `/analyze-url` means every demo paper runs real analysis against whatever context the user has set, which demonstrates the product's actual capability rather than canned output.

---

## Extending This Project

**Swap the AI model:**
Change `MODEL` in `backend/ai_chain.py`. The `_call()` function is the only provider-specific code. To revert to Claude, swap the client initialization and `messages.create` call as documented in the git history.

**Add persistent storage:**
Replace `SessionStore` with a Redis client. The interface (`set`, `get`, `delete`) maps directly to Redis string operations.

**Support scanned PDFs:**
`pdf_parser.py` returns an empty list when no text layer is found. Add an OCR fallback using `pytesseract` or `easyocr` before the chunking step.

**Batch analysis:**
The `/analyze-paper` route runs one paper at a time. A `/analyze-batch` route could accept a ZIP of PDFs and run `run_analysis_chain` concurrently with `asyncio.gather`.
