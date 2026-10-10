"""Aggregate /api/v1 routes."""

from fastapi import APIRouter

from app.api.v1 import (
    auth,
    buses,
    colleges,
    drivers,
    health,
    operator,
    planning,
    students,
    trips,
)

api_router = APIRouter(prefix='/api/v1')
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(operator.router)
api_router.include_router(colleges.router)
api_router.include_router(buses.router)
api_router.include_router(drivers.router)
api_router.include_router(students.router)
api_router.include_router(planning.router)
api_router.include_router(trips.router)
