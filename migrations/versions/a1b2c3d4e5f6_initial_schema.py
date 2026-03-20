"""Initial schema

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2026-03-19 13:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create Agents Table
    op.create_table(
        'agents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('framework', sa.String(length=50), nullable=True),
        sa.Column('sdk_version', sa.String(length=50), nullable=True),
        sa.Column('biz_line', sa.String(length=100), nullable=True),
        sa.Column('owner', sa.String(length=100), nullable=True),
        sa.Column('env', sa.String(length=20), server_default='prod', nullable=True),
        sa.Column('mode', sa.String(length=20), server_default='warn', nullable=True),
        sa.Column('risk_score', sa.Integer(), server_default='0', nullable=True),
        sa.Column('sdk_status', sa.String(length=20), server_default='offline', nullable=True),
        sa.Column('last_seen', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('idx_agents_team_id'), 'agents', ['team_id'], unique=False)

    # 2. Create Alerts Table
    op.create_table(
        'alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('alert_type', sa.String(length=50), nullable=True),
        sa.Column('hook_point', sa.String(length=50), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('detail', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('session_id', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='open', nullable=True),
        sa.Column('resolved_by', sa.String(length=100), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('idx_alerts_agent_id'), 'alerts', ['agent_id'], unique=False)
    op.create_index(op.f('idx_alerts_session_id'), 'alerts', ['session_id'], unique=False)
    op.create_index(op.f('idx_alerts_status'), 'alerts', ['status'], unique=False)
    op.create_index(op.f('idx_alerts_severity'), 'alerts', ['severity'], unique=False)
    # 复合索引：(agent_id, created_at DESC)
    op.create_index('idx_alerts_agent_time', 'alerts', ['agent_id', sa.text('created_at DESC')], unique=False)
    # 复合索引：(severity, status)
    op.create_index('idx_alerts_severity_status', 'alerts', ['severity', 'status'], unique=False)

    # 3. Create Audit Logs Table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('session_id', sa.String(length=100), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=True),
        sa.Column('hook_point', sa.String(length=50), nullable=True),
        sa.Column('input_hash', sa.String(length=64), nullable=True),
        sa.Column('output_hash', sa.String(length=64), nullable=True),
        sa.Column('metadata_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('blocked', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('idx_audit_logs_agent_id'), 'audit_logs', ['agent_id'], unique=False)
    op.create_index(op.f('idx_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    # 物理层禁写约束 (假定数据库用户为 agentsec_user，此命令在实际生产环境中需根据具体用户调整)
    op.execute("REVOKE UPDATE, DELETE ON audit_logs FROM public;")

    # 4. Create Rules Table
    op.create_table(
        'rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rule_id', sa.String(length=100), nullable=True),
        sa.Column('layer', sa.String(length=20), nullable=True),
        sa.Column('pattern', sa.Text(), nullable=True),
        sa.Column('action', sa.String(length=20), server_default='warn', nullable=True),
        sa.Column('enabled', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('hit_count', sa.BigInteger(), server_default='0', nullable=True),
        sa.Column('version', sa.String(length=20), server_default='1.0.0', nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('idx_rules_rule_id'), 'rules', ['rule_id'], unique=True)

    # 5. Create Users Table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=True),
        sa.Column('role', sa.String(length=20), server_default='admin', nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )

def downgrade() -> None:
    op.drop_table('users')
    op.drop_index(op.f('idx_rules_rule_id'), table_name='rules')
    op.drop_table('rules')
    op.drop_index(op.f('idx_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('idx_audit_logs_agent_id'), table_name='audit_logs')
    op.drop_table('audit_logs')
    op.drop_index('idx_alerts_severity_status', table_name='alerts')
    op.drop_index('idx_alerts_agent_time', table_name='alerts')
    op.drop_index(op.f('idx_alerts_severity'), table_name='alerts')
    op.drop_index(op.f('idx_alerts_status'), table_name='alerts')
    op.drop_index(op.f('idx_alerts_session_id'), table_name='alerts')
    op.drop_index(op.f('idx_alerts_agent_id'), table_name='alerts')
    op.drop_table('alerts')
    op.drop_index(op.f('idx_agents_team_id'), table_name='agents')
    op.drop_table('agents')
