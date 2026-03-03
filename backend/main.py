from dotenv import load_dotenv
load_dotenv()

import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from session_store import SessionStore
from pdf_parser import extract_and_chunk
from ai_chain import run_analysis_chain

app = FastAPI(title="Research Paper Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

store = SessionStore()


class ContextRequest(BaseModel):
    session_id: str
    context: str


@app.get("/health")
def health():
    return {"status": "ok"}


MAX_CONTEXT_CHARS = 12_000  # ~3000 tokens — generous for a pipeline description


@app.post("/set-context")
def set_context(body: ContextRequest):
    if len(body.context) > MAX_CONTEXT_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Context is too long ({len(body.context):,} chars). "
                   f"Please keep it under {MAX_CONTEXT_CHARS:,} characters (~3,000 tokens). "
                   "If you uploaded a file, paste only the relevant sections.",
        )
    store.set(body.session_id, body.context)
    return {"message": "Context saved"}


class AnalyzeUrlRequest(BaseModel):
    session_id: str
    pdf_url: str


@app.post("/analyze-url")
async def analyze_url(body: AnalyzeUrlRequest):
    context = store.get(body.session_id)
    if not context:
        raise HTTPException(
            status_code=400,
            detail="No context set for this session. Set your research context first.",
        )

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(body.pdf_url, follow_redirects=True, timeout=20)
        r.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(status_code=422, detail="Could not fetch the PDF from the provided URL.")

    chunks = extract_and_chunk(r.content)
    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this PDF. It may be a scanned image without a text layer.",
        )

    return await run_analysis_chain(context, chunks)


@app.post("/analyze-paper")
async def analyze_paper(session_id: str, file: UploadFile = File(...)):
    context = store.get(session_id)
    if not context:
        raise HTTPException(
            status_code=400,
            detail="No context set for this session. Set your research context first.",
        )

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF.")

    pdf_bytes = await file.read()
    chunks = extract_and_chunk(pdf_bytes)

    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this PDF. It may be a scanned image without a text layer.",
        )

    result = await run_analysis_chain(context, chunks)
    return result
