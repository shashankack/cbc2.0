"""College admin domain and campus services."""

from __future__ import annotations

import re
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import AppError
from app.core.security import generate_dns_txt_token
from app.models.campus import Campus, CampusSettings
from app.models.college import College, CollegeDomain
from app.models.enums import DomainStatus
from app.models.mixins import utcnow
from app.services.dns_verify import dns_txt_contains

_DOMAIN_RE = re.compile(
    r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$"
)


def get_college_or_404(db: Session, college_id: uuid.UUID) -> College:
    college = db.get(College, college_id)
    if college is None:
        raise AppError("NOT_FOUND", "College not found.", status_code=404)
    return college


def request_domain(
    db: Session, college_id: uuid.UUID, domain: str
) -> CollegeDomain:
    get_college_or_404(db, college_id)
    cleaned = domain.strip().lower()
    if cleaned.startswith("@"):
        cleaned = cleaned[1:]
    if not _DOMAIN_RE.match(cleaned):
        raise AppError("VALIDATION_ERROR", "Invalid domain format.", status_code=422)

    active = db.scalar(
        select(CollegeDomain).where(
            CollegeDomain.domain == cleaned,
            CollegeDomain.status == DomainStatus.ACTIVE,
        )
    )
    if active is not None:
        raise AppError(
            "CONFLICT",
            "Domain is already active for a college.",
            status_code=409,
        )

    pending = db.scalar(
        select(CollegeDomain).where(
            CollegeDomain.college_id == college_id,
            CollegeDomain.domain == cleaned,
            CollegeDomain.status == DomainStatus.PENDING,
        )
    )
    if pending is not None:
        return pending

    row = CollegeDomain(
        college_id=college_id,
        domain=cleaned,
        dns_txt_token=generate_dns_txt_token(),
        status=DomainStatus.PENDING,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_domains(
    db: Session, *, status: str | None = None
) -> list[CollegeDomain]:
    stmt = select(CollegeDomain).order_by(CollegeDomain.created_at.desc())
    if status:
        stmt = stmt.where(CollegeDomain.status == status)
    return list(db.scalars(stmt).all())


def serialize_domain(db: Session, domain: CollegeDomain) -> dict:
    college = db.get(College, domain.college_id)
    return {
        "id": domain.id,
        "college_id": domain.college_id,
        "college_name": college.name if college else None,
        "domain": domain.domain,
        "status": domain.status,
        "dns_txt_token": domain.dns_txt_token,
        "dns_verified_at": domain.dns_verified_at,
        "created_at": domain.created_at,
    }


def approve_domain(db: Session, domain_id: uuid.UUID) -> CollegeDomain:
    domain = db.get(CollegeDomain, domain_id)
    if domain is None:
        raise AppError("NOT_FOUND", "Domain request not found.", status_code=404)
    if domain.status != DomainStatus.PENDING:
        raise AppError(
            "CONFLICT",
            "Only pending domains can be approved.",
            status_code=409,
        )

    if not dns_txt_contains(domain.domain, domain.dns_txt_token):
        raise AppError(
            "CONFLICT",
            "DNS TXT record not found for this domain.",
            status_code=409,
        )

    active = db.scalar(
        select(CollegeDomain).where(
            CollegeDomain.domain == domain.domain,
            CollegeDomain.status == DomainStatus.ACTIVE,
        )
    )
    if active is not None:
        raise AppError(
            "CONFLICT",
            "Domain is already active for a college.",
            status_code=409,
        )

    domain.status = DomainStatus.ACTIVE
    domain.dns_verified_at = utcnow()
    db.commit()
    db.refresh(domain)
    return domain


def reject_domain(
    db: Session, domain_id: uuid.UUID, *, notes: str | None = None
) -> CollegeDomain:
    domain = db.get(CollegeDomain, domain_id)
    if domain is None:
        raise AppError("NOT_FOUND", "Domain request not found.", status_code=404)
    if domain.status != DomainStatus.PENDING:
        raise AppError(
            "CONFLICT",
            "Only pending domains can be rejected.",
            status_code=409,
        )
    domain.status = DomainStatus.REJECTED
    # notes not persisted on domain model — ignore or log
    _ = notes
    db.commit()
    db.refresh(domain)
    return domain


def list_campuses(db: Session, college_id: uuid.UUID) -> list[Campus]:
    get_college_or_404(db, college_id)
    return list(
        db.scalars(
            select(Campus)
            .where(Campus.college_id == college_id)
            .options(selectinload(Campus.settings))
            .order_by(Campus.code)
        ).all()
    )


def _validate_coords(lat: float | None, lng: float | None) -> None:
    if (lat is None) != (lng is None):
        raise AppError(
            "VALIDATION_ERROR",
            "Campus lat and lng must be set together.",
            status_code=422,
        )
    if lat is not None and not (-90 <= lat <= 90):
        raise AppError("VALIDATION_ERROR", "lat out of range.", status_code=422)
    if lng is not None and not (-180 <= lng <= 180):
        raise AppError("VALIDATION_ERROR", "lng out of range.", status_code=422)


def create_campus(
    db: Session,
    college_id: uuid.UUID,
    *,
    name: str,
    code: str,
    lat: float | None = None,
    lng: float | None = None,
) -> Campus:
    get_college_or_404(db, college_id)
    cleaned_code = code.strip().upper()
    if not cleaned_code:
        raise AppError("VALIDATION_ERROR", "Campus code is required.", status_code=422)
    _validate_coords(lat, lng)

    exists = db.scalar(
        select(Campus).where(
            Campus.college_id == college_id,
            Campus.code == cleaned_code,
        )
    )
    if exists is not None:
        raise AppError(
            "CONFLICT",
            "Campus code already exists for this college.",
            status_code=409,
        )

    campus = Campus(
        college_id=college_id,
        name=name.strip(),
        code=cleaned_code,
        lat=lat,
        lng=lng,
    )
    db.add(campus)
    db.commit()
    db.refresh(campus)
    return campus


def update_campus(
    db: Session,
    college_id: uuid.UUID,
    campus_id: uuid.UUID,
    *,
    name: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
    set_coords: bool = False,
) -> Campus:
    campus = db.scalar(
        select(Campus)
        .where(Campus.id == campus_id, Campus.college_id == college_id)
        .options(selectinload(Campus.settings))
    )
    if campus is None:
        raise AppError("NOT_FOUND", "Campus not found.", status_code=404)

    if name is not None:
        cleaned = name.strip()
        if not cleaned:
            raise AppError("VALIDATION_ERROR", "Campus name is required.", status_code=422)
        campus.name = cleaned

    if set_coords:
        _validate_coords(lat, lng)
        campus.lat = lat
        campus.lng = lng

    db.commit()
    db.refresh(campus)
    return campus


def upsert_campus_settings(
    db: Session,
    college_id: uuid.UUID,
    campus_id: uuid.UUID,
    *,
    max_walk_to_stop_m: int,
    cluster_eps_m: int,
    cluster_min_samples: int,
    min_students_per_route: int,
) -> CampusSettings:
    campus = db.scalar(
        select(Campus).where(
            Campus.id == campus_id,
            Campus.college_id == college_id,
        )
    )
    if campus is None:
        raise AppError("NOT_FOUND", "Campus not found.", status_code=404)

    for label, value in (
        ("max_walk_to_stop_m", max_walk_to_stop_m),
        ("cluster_eps_m", cluster_eps_m),
        ("cluster_min_samples", cluster_min_samples),
        ("min_students_per_route", min_students_per_route),
    ):
        if value < 1:
            raise AppError(
                "VALIDATION_ERROR",
                f"{label} must be >= 1.",
                status_code=422,
            )

    settings_row = db.scalar(
        select(CampusSettings).where(
            CampusSettings.college_id == college_id,
            CampusSettings.campus_id == campus_id,
        )
    )
    if settings_row is None:
        settings_row = CampusSettings(
            college_id=college_id,
            campus_id=campus_id,
            max_walk_to_stop_m=max_walk_to_stop_m,
            cluster_eps_m=cluster_eps_m,
            cluster_min_samples=cluster_min_samples,
            min_students_per_route=min_students_per_route,
        )
        db.add(settings_row)
    else:
        settings_row.max_walk_to_stop_m = max_walk_to_stop_m
        settings_row.cluster_eps_m = cluster_eps_m
        settings_row.cluster_min_samples = cluster_min_samples
        settings_row.min_students_per_route = min_students_per_route

    db.commit()
    db.refresh(settings_row)
    return settings_row
