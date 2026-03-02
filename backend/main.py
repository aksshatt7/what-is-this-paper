from dotenv import load_dotenv
load_dotenv()

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


@app.post("/set-context")
def set_context(body: ContextRequest):
    store.set(body.session_id, body.context)
    return {"message": "Context saved"}


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
