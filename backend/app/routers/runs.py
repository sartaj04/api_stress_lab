from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, Project, Scenario, Run, RunMetricsTimeseries, RunEndpointMetrics
from ..schemas import RunCreate, RunResponse, RunReport, TimeseriesPoint, EndpointMetrics, BottleneckHint, AIAnalysis, CapacityInsights
from ..auth import get_current_user, check_user_credits, get_default_limits
from ..tasks import run_load_test
from ..report_analyzer import analyze_results
from ..llm_analyzer import analyze_results_with_llm

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("", response_model=RunResponse)
def create_run(
    project_id: int,
    data: RunCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create and start a new load test run."""
    # Check email verification for email auth users
    if current_user.auth_provider == "email" and not current_user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email address before running tests. Check your inbox for the verification link."
        )

    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.base_url:
        raise HTTPException(status_code=400, detail="Project base URL not configured")
    
    # Verify scenario
    scenario = db.query(Scenario).filter(
        Scenario.id == data.config.scenario_id,
        Scenario.project_id == project_id
    ).first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    # Get default limits (credit model has no tiers)
    limits = get_default_limits()
    
    # Calculate estimated requests (conservative estimate: 2 requests per VU per second)
    vus = min(data.config.vus, limits["max_vus"])
    duration = min(data.config.duration, limits["max_duration"])
    estimated_requests = vus * duration * 2
    
    # Check credits (minimum 5 for any run)
    check_user_credits(current_user, 5)
    
    # Create run
    run = Run(
        project_id=project_id,
        scenario_id=scenario.id,
        user_id=current_user.id,
        status="pending",
        config=data.config.model_dump(),
        requested_requests=estimated_requests
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Enqueue Celery task
    run_load_test.delay(run.id)

    # Admin notification is sent by worker when task starts
    # (removed from here to prevent blocking the API response)

    return run


@router.get("", response_model=List[RunResponse])
def list_runs(
    project_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List runs for a project or all user's runs."""
    query = db.query(Run).filter(Run.user_id == current_user.id)
    
    if project_id:
        # Verify project ownership
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        query = query.filter(Run.project_id == project_id)
    
    runs = query.order_by(Run.created_at.desc()).limit(100).all()
    return runs


@router.get("/{run_id}", response_model=RunResponse)
def get_run(
    run_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get run details."""
    run = db.query(Run).filter(
        Run.id == run_id,
        Run.user_id == current_user.id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return run


@router.get("/{run_id}/report", response_model=RunReport)
def get_run_report(
    run_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get full report for a completed run."""
    run = db.query(Run).filter(
        Run.id == run_id,
        Run.user_id == current_user.id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if run.status not in ["completed", "failed"]:
        raise HTTPException(status_code=400, detail="Run not yet completed")
    
    # Get timeseries
    timeseries_rows = db.query(RunMetricsTimeseries).filter(
        RunMetricsTimeseries.run_id == run_id
    ).order_by(RunMetricsTimeseries.time_bucket).all()
    
    timeseries = [
        TimeseriesPoint(
            time_bucket=t.time_bucket,
            rps=t.rps,
            error_rate=t.error_rate,
            p50=t.p50,
            p95=t.p95,
            p99=t.p99
        )
        for t in timeseries_rows
    ]
    
    # Get endpoint metrics
    endpoint_rows = db.query(RunEndpointMetrics).filter(
        RunEndpointMetrics.run_id == run_id
    ).all()
    
    endpoint_metrics = [
        EndpointMetrics(
            method=e.method,
            path=e.path,
            count=e.count,
            avg_latency=e.avg_latency,
            p50=e.p50,
            p95=e.p95,
            p99=e.p99,
            error_rate=e.error_rate,
            status_codes=e.status_codes
        )
        for e in endpoint_rows
    ]
    
    # Calculate aggregate stats
    total_requests = sum(e.count for e in endpoint_rows) if endpoint_rows else 0
    total_errors = sum(int(e.count * e.error_rate) for e in endpoint_rows) if endpoint_rows else 0
    successful_requests = total_requests - total_errors
    
    # Calculate weighted averages
    if total_requests > 0:
        avg_latency = sum(e.avg_latency * e.count for e in endpoint_rows) / total_requests
        p50 = sum(e.p50 * e.count for e in endpoint_rows) / total_requests
        p95 = sum(e.p95 * e.count for e in endpoint_rows) / total_requests
        p99 = sum(e.p99 * e.count for e in endpoint_rows) / total_requests
        error_rate = total_errors / total_requests
    else:
        avg_latency = p50 = p95 = p99 = 0
        error_rate = 0
    
    # Calculate duration
    duration_seconds = None
    if run.started_at and run.finished_at:
        duration_seconds = (run.finished_at - run.started_at).total_seconds()
    
    # Status code distribution
    status_codes = {}
    for e in endpoint_rows:
        for code, count in e.status_codes.items():
            status_codes[code] = status_codes.get(code, 0) + count
    
    # Analyze and get hints
    timeseries_dicts = [t.model_dump() for t in timeseries]
    endpoint_dicts = [e.model_dump() for e in endpoint_metrics]
    analysis = analyze_results(timeseries_dicts, endpoint_dicts, run.config)
    
    hints = [
        BottleneckHint(
            type=h["type"],
            message=h["message"],
            recommendation=h["recommendation"]
        )
        for h in analysis["hints"]
    ]
    
    # Generate AI-powered analysis
    ai_analysis_raw = analyze_results_with_llm(
        run_config=run.config,
        total_requests=total_requests,
        successful_requests=successful_requests,
        avg_latency=avg_latency,
        p95=p95,
        p99=p99,
        error_rate=error_rate,
        duration_seconds=duration_seconds or 0,
        endpoint_metrics=endpoint_dicts,
        status_distribution=status_codes,
        max_stable_rps=analysis.get("max_stable_rps")
    )
    
    # Convert to AIAnalysis schema
    try:
        ai_analysis = AIAnalysis(**ai_analysis_raw)
    except Exception as e:
        print(f"Failed to parse AI analysis: {e}")
        ai_analysis = None
    
    # Parse capacity insights
    capacity_insights = None
    if analysis.get("capacity_insights"):
        try:
            capacity_insights = CapacityInsights(**analysis["capacity_insights"])
        except Exception as e:
            print(f"Failed to parse capacity insights: {e}")
    
    return RunReport(
        run_id=run.id,
        status=run.status,
        duration_seconds=duration_seconds,
        total_requests=total_requests,
        successful_requests=successful_requests,
        failed_requests=total_errors,
        max_stable_rps=analysis.get("max_stable_rps"),
        avg_latency=avg_latency,
        p50=p50,
        p95=p95,
        p99=p99,
        error_rate=error_rate,
        timeseries=timeseries,
        endpoint_metrics=endpoint_metrics,
        status_code_distribution=status_codes,
        bottleneck_hints=hints,
        ai_analysis=ai_analysis,
        capacity_insights=capacity_insights
    )


@router.delete("/{run_id}")
def cancel_run(
    run_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a pending or running test."""
    run = db.query(Run).filter(
        Run.id == run_id,
        Run.user_id == current_user.id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if run.status not in ["pending", "running"]:
        raise HTTPException(status_code=400, detail="Run cannot be cancelled")
    
    run.status = "cancelled"
    db.commit()
    
    return {"message": "Run cancelled"}


@router.post("/suite", response_model=dict)
def run_full_suite(
    project_id: int,
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run a full test suite with all profiles (smoke, ramp, spike, chaos)."""
    from ..suite_runner import get_suite_run_configs, SUITE_PROFILES
    import uuid

    # Check email verification for email auth users
    if current_user.auth_provider == "email" and not current_user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email address before running tests. Check your inbox for the verification link."
        )

    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.base_url:
        raise HTTPException(status_code=400, detail="Project base URL not configured")
    
    # Verify scenario
    scenario = db.query(Scenario).filter(
        Scenario.id == scenario_id,
        Scenario.project_id == project_id
    ).first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    # Generate unique suite ID
    suite_id = str(uuid.uuid4())[:8]
    
    # Get default limits (credit model has no tiers)
    limits = get_default_limits()
    
    # Get all profile configs
    profile_configs = get_suite_run_configs(scenario_id)
    
    # Estimate credits for full suite (5 per run minimum)
    estimated_credits = len(profile_configs) * 5
    
    # Check credits for entire suite
    check_user_credits(current_user, estimated_credits)
    
    # Create all runs
    run_ids = []
    for i, config in enumerate(profile_configs):
        vus = min(config["vus"], limits["max_vus"])
        duration = min(config["duration"], limits["max_duration"])
        estimated_requests = vus * duration * 2
        
        # Add suite metadata to config
        config["suite_id"] = suite_id
        config["suite_order"] = i
        config["suite_total"] = len(profile_configs)
        
        run = Run(
            project_id=project_id,
            scenario_id=scenario_id,
            user_id=current_user.id,
            status="pending",
            config=config,
            requested_requests=estimated_requests
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        run_ids.append(run.id)
    
    # Enqueue all tests - they will run sequentially
    for run_id in run_ids:
        run_load_test.delay(run_id)

    # Admin notification is sent by worker when first task starts
    # (removed from here to prevent blocking the API response)

    return {
        "suite_id": suite_id,
        "run_ids": run_ids,
        "profiles": [p.value for p in SUITE_PROFILES.keys()],
        "message": f"Full suite started with {len(run_ids)} tests"
    }


@router.get("/suite/{suite_id}", response_model=dict)
def get_suite_results(
    suite_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get results for a full test suite."""
    from ..suite_runner import generate_suite_comparison_summary
    from ..llm_analyzer import generate_suite_ai_summary
    from ..models import SuiteCache
    
    # Find all runs with this suite_id
    runs = db.query(Run).filter(
        Run.user_id == current_user.id
    ).all()
    
    # Filter by suite_id in config
    suite_runs = [r for r in runs if r.config.get("suite_id") == suite_id]
    
    if not suite_runs:
        raise HTTPException(status_code=404, detail="Suite not found")
    
    # Sort by suite order
    suite_runs.sort(key=lambda x: x.config.get("suite_order", 0))
    
    # Get project_id from first run
    project_id = suite_runs[0].project_id if suite_runs else None
    
    # Build results
    results = []
    all_completed = True
    
    for run in suite_runs:
        if run.status not in ["completed", "failed"]:
            all_completed = False
        
        # Get basic metrics from run
        result = {
            "run_id": run.id,
            "suite_profile": run.config.get("suite_profile", "unknown"),
            "suite_profile_name": run.config.get("suite_profile_name", "Unknown"),
            "suite_profile_description": run.config.get("suite_profile_description", ""),
            "status": run.status,
            "error_rate": 0,
            "avg_latency": 0,
            "p95": 0,
            "max_stable_rps": 0,
            "total_requests": run.actual_requests or 0,
            "timeseries": []
        }
        
        # If completed, try to get detailed metrics
        if run.status == "completed":
            timeseries = db.query(RunMetricsTimeseries).filter(
                RunMetricsTimeseries.run_id == run.id
            ).all()
            
            if timeseries:
                total_rps = sum(t.rps for t in timeseries)
                avg_rps = total_rps / len(timeseries) if timeseries else 0
                result["avg_latency"] = sum(t.p50 for t in timeseries) / len(timeseries)
                result["p95"] = max(t.p95 for t in timeseries)
                result["error_rate"] = sum(t.error_rate for t in timeseries) / len(timeseries)
                result["max_stable_rps"] = avg_rps
                # Include timeseries for charts
                result["timeseries"] = [
                    {"time": i, "rps": t.rps, "p50": t.p50, "p95": t.p95, "error_rate": t.error_rate}
                    for i, t in enumerate(timeseries)
                ]
        
        results.append(result)
    
    # Generate comparison summary (lightweight, always regenerate)
    comparison = generate_suite_comparison_summary(results)
    
    # Check cache for AI summary
    ai_summary = None
    cache = db.query(SuiteCache).filter(SuiteCache.suite_id == suite_id).first()
    
    if cache and cache.ai_summary:
        # Return cached AI summary
        ai_summary = cache.ai_summary
    elif all_completed:
        # Generate and cache AI summary (only when all tests complete)
        try:
            ai_summary = generate_suite_ai_summary(results)
            
            # Store in cache
            if not cache:
                cache = SuiteCache(
                    suite_id=suite_id,
                    project_id=project_id,
                    ai_summary=ai_summary,
                    comparison=comparison
                )
                db.add(cache)
            else:
                cache.ai_summary = ai_summary
                cache.comparison = comparison
            db.commit()
        except Exception as e:
            print(f"Failed to generate AI suite summary: {e}")
    
    return {
        "suite_id": suite_id,
        "status": "completed" if all_completed else "running",
        "total_tests": len(suite_runs),
        "completed_tests": len([r for r in suite_runs if r.status in ["completed", "failed"]]),
        "results": results,
        "comparison": comparison,
        "ai_summary": ai_summary
    }
