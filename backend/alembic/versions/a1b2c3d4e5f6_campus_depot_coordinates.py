"""campus depot coordinates

Revision ID: a1b2c3d4e5f6
Revises: c86d091645cc
Create Date: 2026-10-10 19:35:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "c86d091645cc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("campuses", sa.Column("lat", sa.Float(), nullable=True))
    op.add_column("campuses", sa.Column("lng", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("campuses", "lng")
    op.drop_column("campuses", "lat")
