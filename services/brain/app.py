from __future__ import annotations

import json
import os
import re
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from graphiti_core import Graphiti
from graphiti_core.cross_encoder.openai_reranker_client import OpenAIRerankerClient
from graphiti_core.embedder.openai import OpenAIEmbedder, OpenAIEmbedderConfig
from graphiti_core.llm_client.config import LLMConfig
from graphiti_core.llm_client.openai_generic_client import OpenAIGenericClient
from graphiti_core.nodes import EpisodeType
from pydantic import BaseModel, Field

TENANT_PATTERN = re.compile(r"^[A-Za-z0-9_.:-]{1,128}$")


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def first_env(*names: str, default: str | None = None) -> str | None:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return default


def positive_int_env(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer") from exc
    if value <= 0:
        raise RuntimeError(f"{name} must be greater than zero")
    return value


def validate_tenant_id(value: str) -> str:
    if not TENANT_PATTERN.fullmatch(value):
        raise HTTPException(status_code=400, detail="Invalid tenant_id")
    return value


def build_graphiti() -> tuple[Graphiti, dict[str, str]]:
    # Graphiti's generic client targets the OpenAI-compatible protocol, not OpenAI as a
    # required vendor. AGESOMA can therefore route through LiteLLM, vLLM, Ollama,
    # llama.cpp or another compatible endpoint. OPENAI_* remains a compatibility fallback.
    llm_base_url = first_env(
        "AGESOMA_LLM_BASE_URL",
        "LITELLM_BASE_URL",
        "OPENAI_BASE_URL",
        default="https://api.openai.com/v1",
    )
    assert llm_base_url is not None

    explicit_llm_key = first_env("AGESOMA_LLM_API_KEY", "LITELLM_API_KEY", "OPENAI_API_KEY")
    if "api.openai.com" in llm_base_url and not explicit_llm_key:
        raise RuntimeError(
            "An AI API key is required for api.openai.com; configure AGESOMA_LLM_BASE_URL "
            "for an open-source/local OpenAI-compatible endpoint instead"
        )
    llm_api_key = explicit_llm_key or "agesoma-local"
    llm_model = first_env("AGESOMA_LLM_MODEL", default="gpt-4.1-mini") or "gpt-4.1-mini"
    small_model = first_env("AGESOMA_LLM_SMALL_MODEL", default=llm_model) or llm_model
    structured_output_mode = first_env(
        "AGESOMA_LLM_STRUCTURED_OUTPUT_MODE", default="json_schema"
    ) or "json_schema"
    if structured_output_mode not in {"json_schema", "json_object"}:
        raise RuntimeError(
            "AGESOMA_LLM_STRUCTURED_OUTPUT_MODE must be json_schema or json_object"
        )

    max_tokens = positive_int_env("AGESOMA_LLM_MAX_TOKENS", 16384)
    llm_config = LLMConfig(
        api_key=llm_api_key,
        model=llm_model,
        small_model=small_model,
        base_url=llm_base_url,
        max_tokens=max_tokens,
    )
    llm_client = OpenAIGenericClient(
        config=llm_config,
        max_tokens=max_tokens,
        structured_output_mode=structured_output_mode,
    )

    embedding_base_url = first_env("AGESOMA_EMBEDDING_BASE_URL", default=llm_base_url) or llm_base_url
    embedding_api_key = first_env("AGESOMA_EMBEDDING_API_KEY", default=llm_api_key) or llm_api_key
    embedding_model = first_env(
        "AGESOMA_EMBEDDING_MODEL", default="text-embedding-3-small"
    ) or "text-embedding-3-small"
    embedding_dim = positive_int_env("AGESOMA_EMBEDDING_DIM", 1536)
    embedder = OpenAIEmbedder(
        config=OpenAIEmbedderConfig(
            api_key=embedding_api_key,
            base_url=embedding_base_url,
            embedding_model=embedding_model,
            embedding_dim=embedding_dim,
        )
    )

    # The reranker shares the same explicitly configured compatible endpoint. This avoids
    # Graphiti silently constructing a separate direct OpenAI client.
    rerank_model = first_env("AGESOMA_RERANK_MODEL", default=small_model) or small_model
    reranker = OpenAIRerankerClient(
        config=LLMConfig(
            api_key=llm_api_key,
            model=rerank_model,
            small_model=rerank_model,
            base_url=llm_base_url,
        ),
        client=llm_client.client,
    )

    graphiti = Graphiti(
        required_env("NEO4J_URI"),
        required_env("NEO4J_USER"),
        required_env("NEO4J_PASSWORD"),
        llm_client=llm_client,
        embedder=embedder,
        cross_encoder=reranker,
    )
    return graphiti, {
        "protocol": "openai-compatible",
        "llm_model": llm_model,
        "embedding_model": embedding_model,
        "rerank_model": rerank_model,
    }


class EpisodeRequest(BaseModel):
    tenant_id: str
    name: str = Field(min_length=1, max_length=240)
    content: str | dict[str, Any] | list[Any]
    source_description: str = Field(default="AGESOMA operational event", max_length=500)
    reference_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SearchRequest(BaseModel):
    tenant_id: str
    query: str = Field(min_length=2, max_length=4000)
    limit: int = Field(default=10, ge=1, le=30)


class BrainFact(BaseModel):
    uuid: str | None = None
    fact: str
    valid_at: datetime | None = None
    invalid_at: datetime | None = None
    source_node_uuid: str | None = None
    target_node_uuid: str | None = None
    episodes: list[str] = Field(default_factory=list)


class SearchResponse(BaseModel):
    facts: list[BrainFact]


@asynccontextmanager
async def lifespan(app: FastAPI):
    brain_token = required_env("AGESOMA_BRAIN_INTERNAL_API_TOKEN")
    if len(brain_token) < 32:
        raise RuntimeError("AGESOMA_BRAIN_INTERNAL_API_TOKEN must be at least 32 characters")

    graphiti, ai_runtime = build_graphiti()
    await graphiti.build_indices_and_constraints()
    app.state.graphiti = graphiti
    app.state.brain_token = brain_token
    app.state.ai_runtime = ai_runtime
    yield
    await graphiti.close()


app = FastAPI(
    title="AGESOMA Company Brain",
    version="0.2.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)


def require_internal_token(
    request: Request,
    x_agesoma_brain_token: str | None = Header(default=None),
) -> None:
    expected = request.app.state.brain_token
    supplied = x_agesoma_brain_token or ""
    if not supplied or not secrets.compare_digest(supplied, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


@app.get("/health")
async def health(request: Request):
    return {
        "status": "ok",
        "service": "agesoma-company-brain",
        "graphiti": request.app.state.graphiti is not None,
        "ai": request.app.state.ai_runtime,
    }


@app.post("/v1/episodes", dependencies=[Depends(require_internal_token)])
async def add_episode(payload: EpisodeRequest, request: Request):
    tenant_id = validate_tenant_id(payload.tenant_id)
    is_text = isinstance(payload.content, str)
    body = payload.content if is_text else json.dumps(payload.content, ensure_ascii=False, separators=(",", ":"))

    await request.app.state.graphiti.add_episode(
        name=payload.name,
        episode_body=body,
        source_description=payload.source_description,
        reference_time=payload.reference_time,
        source=EpisodeType.text if is_text else EpisodeType.json,
        group_id=tenant_id,
    )

    return {"status": "stored", "tenant_id": tenant_id}


@app.post("/v1/search", response_model=SearchResponse, dependencies=[Depends(require_internal_token)])
async def search(payload: SearchRequest, request: Request):
    tenant_id = validate_tenant_id(payload.tenant_id)
    edges = await request.app.state.graphiti.search(
        query=payload.query,
        group_ids=[tenant_id],
        num_results=payload.limit,
    )

    facts: list[BrainFact] = []
    for edge in edges:
        fact = getattr(edge, "fact", None)
        if not isinstance(fact, str) or not fact.strip():
            continue
        facts.append(
            BrainFact(
                uuid=str(getattr(edge, "uuid", "")) or None,
                fact=fact.strip(),
                valid_at=getattr(edge, "valid_at", None),
                invalid_at=getattr(edge, "invalid_at", None),
                source_node_uuid=getattr(edge, "source_node_uuid", None),
                target_node_uuid=getattr(edge, "target_node_uuid", None),
                episodes=list(getattr(edge, "episodes", None) or []),
            )
        )

    return SearchResponse(facts=facts)
