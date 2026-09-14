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
from graphiti_core.nodes import EpisodeType
from pydantic import BaseModel, Field

TENANT_PATTERN = re.compile(r"^[A-Za-z0-9_.:-]{1,128}$")


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def validate_tenant_id(value: str) -> str:
    if not TENANT_PATTERN.fullmatch(value):
        raise HTTPException(status_code=400, detail="Invalid tenant_id")
    return value


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

    graphiti = Graphiti(
        required_env("NEO4J_URI"),
        required_env("NEO4J_USER"),
        required_env("NEO4J_PASSWORD"),
    )
    await graphiti.build_indices_and_constraints()
    app.state.graphiti = graphiti
    app.state.brain_token = brain_token
    yield
    await graphiti.close()


app = FastAPI(
    title="AGESOMA Company Brain",
    version="0.1.0",
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
