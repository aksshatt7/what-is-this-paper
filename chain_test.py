"""
chain_test.py — Run the AI chain without starting the full server.

Use this to iterate on your prompts quickly. The three steps are called
sequentially so you can see exactly what each one returns before wiring
everything into FastAPI.

Usage:
    cd research-analyzer
    cp backend/.env.example backend/.env   # add your key
    python chain_test.py
"""

import sys
import os

# Allow importing from the backend folder without installing it as a package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from dotenv import load_dotenv
load_dotenv('backend/.env')

import asyncio
from ai_chain import run_analysis_chain

# ── Paste your own context and paper excerpt here ─────────────────────────────

USER_CONTEXT = """
I'm building a transformer-based text classifier for medical notes.
I use a BERT backbone with a classification head, fine-tuned on labeled EHR data.
My current challenge is handling class imbalance — rare diagnoses are underrepresented.
I'm also experimenting with data augmentation strategies.
"""

PAPER_EXCERPT = """
Abstract:
We present a novel approach to few-shot learning using prototypical networks combined
with attention mechanisms. Our method achieves state-of-the-art performance on
standard benchmarks by learning class prototypes in an embedding space.

Introduction:
Few-shot learning addresses the challenge of learning from limited labeled examples,
a common scenario in medical and scientific domains where annotation is expensive.

Methods:
We use an episodic training procedure where each episode contains a support set
and a query set. A convolutional encoder maps inputs to an embedding space.
Class prototypes are computed as the mean of support set embeddings.
Classification is performed by measuring distance from query embeddings to prototypes.
"""

# ─────────────────────────────────────────────────────────────────────────────

async def main():
    print("Running analysis chain...\n")
    result = await run_analysis_chain(USER_CONTEXT, [PAPER_EXCERPT])

    import json
    print("=== PAPER SUMMARY ===")
    print(json.dumps(result["paper_summary"], indent=2))

    print("\n=== RELEVANCE ===")
    print(json.dumps(result["relevance"], indent=2))

    print("\n=== SUGGESTIONS ===")
    print(json.dumps(result["suggestions"], indent=2))


if __name__ == "__main__":
    asyncio.run(main())
