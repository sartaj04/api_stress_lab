from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Credit-based billing
    credit_balance = Column(Integer, nullable=False, default=0)
    free_credits_claimed = Column(Boolean, nullable=False, default=False)
    stripe_customer_id = Column(String(255), unique=True, nullable=True, index=True)
    
    last_opened_project_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    runs = relationship("Run", back_populates="user", cascade="all, delete-orphan")
    credit_transactions = relationship("CreditTransaction", back_populates="user", cascade="all, delete-orphan")


class CreditTransaction(Base):
    """Track all credit purchases, usage, and refunds."""
    __tablename__ = "credit_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # Positive for purchases, negative for usage
    balance_after = Column(Integer, nullable=False)  # Balance after this transaction
    transaction_type = Column(String(50), nullable=False)  # purchase, usage, refund, bonus
    
    # For purchases
    stripe_payment_id = Column(String(255), nullable=True)
    package_name = Column(String(100), nullable=True)
    
    # For usage
    run_id = Column(Integer, ForeignKey("runs.id", ondelete="SET NULL"), nullable=True)
    
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="credit_transactions")


class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    key_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    user = relationship("User", back_populates="api_keys")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    base_url = Column(String(2048), nullable=True)
    last_suite_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="projects")
    secrets = relationship("ProjectSecret", back_populates="project", cascade="all, delete-orphan")
    specs = relationship("Spec", back_populates="project", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="project", cascade="all, delete-orphan")
    runs = relationship("Run", back_populates="project", cascade="all, delete-orphan")


class ProjectSecret(Base):
    __tablename__ = "project_secrets"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    auth_type = Column(String(50), nullable=False)
    encrypted_value = Column(Text, nullable=False)
    header_name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    project = relationship("Project", back_populates="secrets")


class Spec(Base):
    __tablename__ = "specs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    minio_key = Column(String(512), nullable=False)
    filename = Column(String(255), nullable=False)
    content_hash = Column(String(64), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="specs")
    scenarios = relationship("Scenario", back_populates="spec")


class Scenario(Base):
    __tablename__ = "scenarios"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    spec_id = Column(Integer, ForeignKey("specs.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    config = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    project = relationship("Project", back_populates="scenarios")
    spec = relationship("Spec", back_populates="scenarios")
    runs = relationship("Run", back_populates="scenario")


class Run(Base):
    __tablename__ = "runs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending")
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    config = Column(JSONB, nullable=False)
    requested_requests = Column(Integer, nullable=False, default=0)
    actual_requests = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Credit tracking
    credits_charged = Column(Integer, nullable=True)  # Credits deducted for this run
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="runs")
    scenario = relationship("Scenario", back_populates="runs")
    user = relationship("User", back_populates="runs")
    timeseries = relationship("RunMetricsTimeseries", back_populates="run", cascade="all, delete-orphan")
    endpoint_metrics = relationship("RunEndpointMetrics", back_populates="run", cascade="all, delete-orphan")
    artifacts = relationship("RunArtifact", back_populates="run", cascade="all, delete-orphan")


class RunMetricsTimeseries(Base):
    __tablename__ = "run_metrics_timeseries"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False, index=True)
    time_bucket = Column(Integer, nullable=False)
    rps = Column(Float, nullable=False)
    error_rate = Column(Float, nullable=False)
    p50 = Column(Float, nullable=False)
    p95 = Column(Float, nullable=False)
    p99 = Column(Float, nullable=False)
    
    run = relationship("Run", back_populates="timeseries")


class RunEndpointMetrics(Base):
    __tablename__ = "run_endpoint_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    path = Column(String(2048), nullable=False)
    count = Column(Integer, nullable=False)
    avg_latency = Column(Float, nullable=False)
    p50 = Column(Float, nullable=False)
    p95 = Column(Float, nullable=False)
    p99 = Column(Float, nullable=False)
    error_rate = Column(Float, nullable=False)
    status_codes = Column(JSONB, nullable=False)
    
    run = relationship("Run", back_populates="endpoint_metrics")


class RunArtifact(Base):
    __tablename__ = "run_artifacts"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    artifact_type = Column(String(50), nullable=False)
    minio_key = Column(String(512), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    run = relationship("Run", back_populates="artifacts")


class SuiteCache(Base):
    """Cache for suite AI summaries."""
    __tablename__ = "suite_caches"
    
    id = Column(Integer, primary_key=True, index=True)
    suite_id = Column(String(36), unique=True, nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    ai_summary = Column(JSONB, nullable=True)
    comparison = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
