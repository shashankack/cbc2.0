"""Aggregate /api/v1 routes."""

from fastapi import APIRouter

from app.api.v1 import auth, colleges, health, operator

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(operator.router)
api_router.include_router(colleges.router)
