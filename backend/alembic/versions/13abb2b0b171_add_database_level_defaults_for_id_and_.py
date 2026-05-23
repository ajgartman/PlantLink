"""add database level defaults for id and timestamps

Revision ID: 13abb2b0b171
Revises: bb64de7f1169
Create Date: 2026-05-19 19:33:53.237941

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '13abb2b0b171'
down_revision: Union[str, Sequence[str], None] = 'bb64de7f1169'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add database-level defaults for UUID primary keys and timestamps."""

    # Every table that has id (UUID), created_at, updated_at
    tables = ['users', 'companies', 'projects', 'issues', 'comments']

    for table in tables:
        # UUID default — Postgres generates the ID if none is provided
        op.alter_column(table, 'id',
            server_default=sa.text('gen_random_uuid()'))

        # Timestamp defaults — Postgres sets these on insert
        op.alter_column(table, 'created_at',
            server_default=sa.text('now()'))

        op.alter_column(table, 'updated_at',
            server_default=sa.text('now()'))


def downgrade() -> None:
    """Remove database-level defaults."""

    tables = ['users', 'companies', 'projects', 'issues', 'comments']

    for table in tables:
        op.alter_column(table, 'id', server_default=None)
        op.alter_column(table, 'created_at', server_default=None)
        op.alter_column(table, 'updated_at', server_default=None)