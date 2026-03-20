import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), index=True, default=uuid.UUID("00000000-0000-0000-0000-000000000000"))
    name = Column(String(255), unique=True, nullable=False)
    framework = Column(String(50))
    sdk_version = Column(String(50))
    biz_line = Column(String(100))
    owner = Column(String(100))
    env = Column(String(20), default="prod")
    mode = Column(String(20), default="warn")
    risk_score = Column(Integer, default=0)
    sdk_status = Column(String(20), default="offline")
    last_seen = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    alerts = relationship("Alert", back_populates="agent")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), index=True, default=uuid.UUID("00000000-0000-0000-0000-000000000000"))
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), index=True)
    severity = Column(String(20), index=True) # critical, warning, info
    alert_type = Column(String(50))
    hook_point = Column(String(50))
    title = Column(String(255))
    detail = Column(JSONB)
    confidence = Column(Float)
    session_id = Column(String(100), index=True)
    status = Column(String(20), default="open", index=True) # open, resolved, muted
    resolved_by = Column(String(100))
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    agent = relationship("Agent", back_populates="alerts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    team_id = Column(UUID(as_uuid=True), index=True, default=uuid.UUID("00000000-0000-0000-0000-000000000000"))
    agent_id = Column(UUID(as_uuid=True), index=True)
    session_id = Column(String(100))
    event_type = Column(String(50))
    hook_point = Column(String(50))
    input_hash = Column(String(64)) # SHA-256
    output_hash = Column(String(64))
    metadata_json = Column(JSONB) # Metadata as JSON
    latency_ms = Column(Integer)
    blocked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class Rule(Base):
    __tablename__ = "rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id = Column(String(100), unique=True, index=True)
    layer = Column(String(20)) # input, output
    pattern = Column(Text)
    action = Column(String(20), default="warn")
    enabled = Column(Boolean, default=True)
    hit_count = Column(BigInteger, default=0)
    version = Column(String(20), default="1.0.0")
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), index=True, default=uuid.UUID("00000000-0000-0000-0000-000000000000"))
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255))
    role = Column(String(20), default="admin") # admin, readonly
    created_at = Column(DateTime, default=datetime.utcnow)

class RuleFeedback(Base):
    __tablename__ = "rule_feedbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("alerts.id"), index=True)
    rule_id = Column(String(100))
    feedback = Column(String(20)) # false_positive, true_positive
    operator = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
