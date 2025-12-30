from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, Project, ProjectSecret, Spec, Scenario, Run, RunMetricsTimeseries
from ..schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectAuthConfig,
    SpecResponse, ScenarioCreate, ScenarioUpdate, ScenarioResponse,
    SmartScenariosResponse
)
from ..auth import get_current_user
from ..crypto import encrypt_secret
from ..security import validate_base_url
from ..storage import upload_file, delete_file
from ..openapi_parser import parse_openapi_spec, generate_scenario_from_spec, compute_content_hash
from ..llm_scenarios import generate_smart_scenarios

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse)
def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project."""
    project = Project(
        user_id=current_user.id,
        name=data.name,
        description=data.description
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all projects for current user."""
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    return projects


@router.get("/usage/stats")
def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage statistics for the current user (last 30 days)."""
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Get all user's project IDs
    user_project_ids = [p.id for p in db.query(Project.id).filter(Project.user_id == current_user.id).all()]
    
    if not user_project_ids:
        return {
            "total_runs": 0,
            "completed_runs": 0,
            "total_requests": 0,
            "total_duration_seconds": 0,
            "period_days": 30
        }
    
    # Count total runs
    total_runs = db.query(func.count(Run.id)).filter(
        Run.project_id.in_(user_project_ids),
        Run.created_at >= thirty_days_ago
    ).scalar() or 0
    
    # Count completed runs
    completed_runs = db.query(func.count(Run.id)).filter(
        Run.project_id.in_(user_project_ids),
        Run.created_at >= thirty_days_ago,
        Run.status == "completed"
    ).scalar() or 0
    
    # Sum total requests
    total_requests = db.query(func.sum(Run.actual_requests)).filter(
        Run.project_id.in_(user_project_ids),
        Run.created_at >= thirty_days_ago,
        Run.status == "completed"
    ).scalar() or 0
    
    # Calculate total test duration (in seconds)
    total_duration = db.query(func.sum(
        func.extract('epoch', Run.finished_at - Run.started_at)
    )).filter(
        Run.project_id.in_(user_project_ids),
        Run.created_at >= thirty_days_ago,
        Run.status == "completed",
        Run.started_at.isnot(None),
        Run.finished_at.isnot(None)
    ).scalar() or 0
    
    return {
        "total_runs": total_runs,
        "completed_runs": completed_runs,
        "total_requests": int(total_requests),
        "total_duration_seconds": int(total_duration),
        "period_days": 30
    }


@router.get("/with-stats")
def list_projects_with_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all projects with statistics for dashboard."""
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    
    result = []
    for project in projects:
        # Count total runs for this project
        total_runs = db.query(func.count(Run.id)).filter(
            Run.project_id == project.id
        ).scalar() or 0
        
        # Get latest suite info
        latest_suite = None
        if project.last_suite_id:
            # Get all runs for this suite
            all_runs = db.query(Run).filter(Run.project_id == project.id).all()
            suite_runs = [r for r in all_runs if r.config.get("suite_id") == project.last_suite_id]
            
            if suite_runs:
                # Sort by created_at descending and get the latest
                suite_runs.sort(key=lambda x: x.created_at, reverse=True)
                latest_run = suite_runs[0]
                latest_suite = {
                    "suite_id": project.last_suite_id,
                    "status": latest_run.status,
                    "created_at": latest_run.created_at.isoformat() if latest_run.created_at else None,
                    "commit_message": latest_run.config.get("commit_message", "Latest test run")
                }
        
        # Get latest run (any type)
        latest_run = db.query(Run).filter(
            Run.project_id == project.id
        ).order_by(Run.created_at.desc()).first()
        
        result.append({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "base_url": project.base_url,
            "last_suite_id": project.last_suite_id,
            "created_at": project.created_at.isoformat(),
            "updated_at": project.updated_at.isoformat(),
            "total_runs": total_runs,
            "latest_suite": latest_suite,
            "latest_run_at": latest_run.created_at.isoformat() if latest_run else None
        })
    
    return result


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a project by ID."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Track this as the user's last opened project
    current_user.last_opened_project_id = project_id
    db.commit()
    
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.base_url is not None:
        project.base_url = validate_base_url(data.base_url)
    
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


@router.post("/{project_id}/auth")
def set_project_auth(
    project_id: int,
    data: ProjectAuthConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set authentication credentials for a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate api_key type has header_name
    if data.auth_type == "api_key" and not data.header_name:
        raise HTTPException(status_code=400, detail="header_name required for api_key auth type")
    
    # Delete existing secrets
    db.query(ProjectSecret).filter(ProjectSecret.project_id == project_id).delete()
    
    # Create new secret
    secret = ProjectSecret(
        project_id=project_id,
        auth_type=data.auth_type,
        encrypted_value=encrypt_secret(data.value),
        header_name=data.header_name
    )
    db.add(secret)
    db.commit()
    
    return {"message": "Auth configured successfully"}


@router.post("/{project_id}/spec", response_model=SpecResponse)
async def upload_spec(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload an OpenAPI spec file."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Read file content
    content = await file.read()
    
    # Validate it's a valid OpenAPI spec
    try:
        parse_openapi_spec(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid OpenAPI spec: {str(e)}")
    
    # Compute hash
    content_hash = compute_content_hash(content)
    
    # Upload to MinIO
    minio_key = f"projects/{project_id}/specs/{content_hash}/{file.filename}"
    upload_file("specs", minio_key, content, "application/octet-stream")
    
    # Create spec record
    spec = Spec(
        project_id=project_id,
        minio_key=minio_key,
        filename=file.filename,
        content_hash=content_hash
    )
    db.add(spec)
    db.commit()
    db.refresh(spec)
    
    # Auto-trigger full suite if project has base_url configured
    if project.base_url:
        from ..tasks import auto_run_suite_for_spec
        auto_run_suite_for_spec.delay(project_id, spec.id, current_user.id)
    
    return spec


@router.get("/{project_id}/specs", response_model=List[SpecResponse])
def list_specs(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all specs for a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    specs = db.query(Spec).filter(Spec.project_id == project_id).all()
    return specs


@router.delete("/{project_id}/specs/{spec_id}")
def delete_spec(
    project_id: int,
    spec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an OpenAPI spec and its file from storage."""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get the spec
    spec = db.query(Spec).filter(
        Spec.id == spec_id,
        Spec.project_id == project_id
    ).first()

    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")

    # Delete from MinIO storage
    try:
        delete_file("specs", spec.minio_key)
    except Exception as e:
        # Log error but continue with database deletion
        print(f"Warning: Failed to delete spec file from storage: {str(e)}")

    # Delete from database (scenarios will have their spec_id set to NULL due to ondelete="SET NULL")
    db.delete(spec)
    db.commit()

    return {"message": "Spec deleted successfully"}


@router.post("/{project_id}/scenario/generate", response_model=ScenarioResponse)
def generate_scenario(
    project_id: int,
    spec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Auto-generate a scenario from an OpenAPI spec."""
    from ..storage import download_file
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    spec = db.query(Spec).filter(
        Spec.id == spec_id,
        Spec.project_id == project_id
    ).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")
    
    # Download and parse spec
    content = download_file("specs", spec.minio_key)
    openapi_spec = parse_openapi_spec(content, spec.filename)
    
    # Generate scenario
    scenario_config = generate_scenario_from_spec(openapi_spec)
    
    # Create scenario
    scenario = Scenario(
        project_id=project_id,
        spec_id=spec_id,
        name=f"Auto-generated from {spec.filename}",
        config=scenario_config
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    
    return scenario


@router.post("/{project_id}/scenario/generate-smart", response_model=SmartScenariosResponse)
def generate_smart_scenario(
    project_id: int,
    spec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate smart test scenarios using LLM analysis of the OpenAPI spec."""
    from ..storage import download_file
    from ..config import settings
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    spec = db.query(Spec).filter(
        Spec.id == spec_id,
        Spec.project_id == project_id
    ).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")
    
    # Download and parse spec
    content = download_file("specs", spec.minio_key)
    openapi_spec = parse_openapi_spec(content, spec.filename)
    
    # Generate smart scenarios using LLM
    scenarios = generate_smart_scenarios(openapi_spec, spec.filename)
    
    return SmartScenariosResponse(
        scenarios=scenarios,
        ai_generated=settings.openai_api_key is not None
    )


@router.post("/{project_id}/scenarios", response_model=ScenarioResponse)
def create_scenario(
    project_id: int,
    data: ScenarioCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a custom scenario."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    scenario = Scenario(
        project_id=project_id,
        name=data.name,
        config=data.config.model_dump()
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    
    return scenario


@router.get("/{project_id}/scenarios", response_model=List[ScenarioResponse])
def list_scenarios(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all scenarios for a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    scenarios = db.query(Scenario).filter(Scenario.project_id == project_id).all()
    return scenarios


@router.patch("/{project_id}/scenarios/{scenario_id}", response_model=ScenarioResponse)
def update_scenario(
    project_id: int,
    scenario_id: int,
    data: ScenarioUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a scenario."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    scenario = db.query(Scenario).filter(
        Scenario.id == scenario_id,
        Scenario.project_id == project_id
    ).first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    if data.name is not None:
        scenario.name = data.name
    if data.config is not None:
        scenario.config = data.config.model_dump()
    
    db.commit()
    db.refresh(scenario)
    
    return scenario


@router.delete("/{project_id}/scenarios/{scenario_id}")
def delete_scenario(
    project_id: int,
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a scenario."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    scenario = db.query(Scenario).filter(
        Scenario.id == scenario_id,
        Scenario.project_id == project_id
    ).first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    db.delete(scenario)
    db.commit()
    
    return {"message": "Scenario deleted"}


@router.get("/{project_id}/suites")
def list_project_suites(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all suite runs for a project (grouped by suite_id)."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get all runs that are part of a suite
    runs = db.query(Run).filter(Run.project_id == project_id).all()
    
    # Group by suite_id
    suites = {}
    for run in runs:
        suite_id = run.config.get("suite_id")
        if suite_id:
            if suite_id not in suites:
                suites[suite_id] = {
                    "suite_id": suite_id,
                    "created_at": run.created_at,
                    "status": "running",
                    "total_tests": 0,
                    "completed_tests": 0,
                    "is_auto_generated": run.config.get("auto_generated", False)
                }
            suites[suite_id]["total_tests"] += 1
            if run.status in ["completed", "failed"]:
                suites[suite_id]["completed_tests"] += 1
    
    # Determine overall status
    for suite in suites.values():
        if suite["completed_tests"] == suite["total_tests"]:
            suite["status"] = "completed"
    
    # Sort by created_at descending (newest first)
    sorted_suites = sorted(suites.values(), key=lambda x: x["created_at"], reverse=True)
    
    return sorted_suites


@router.get("/{project_id}/suites/latest")
def get_latest_suite(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the latest suite results for the project dashboard."""
    from ..suite_runner import generate_suite_comparison_summary
    from ..llm_analyzer import generate_suite_ai_summary
    from ..models import RunMetricsTimeseries
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Track as last opened
    current_user.last_opened_project_id = project_id
    db.commit()
    
    if not project.last_suite_id:
        return {"status": "no_suite", "message": "No suite has been run yet"}
    
    # Get all runs for this suite
    runs = db.query(Run).filter(Run.project_id == project_id).all()
    suite_runs = [r for r in runs if r.config.get("suite_id") == project.last_suite_id]
    
    if not suite_runs:
        return {"status": "no_suite", "message": "Suite not found"}
    
    # Sort by suite order
    suite_runs.sort(key=lambda x: x.config.get("suite_order", 0))
    
    # Build results
    results = []
    all_completed = True
    
    for run in suite_runs:
        if run.status not in ["completed", "failed"]:
            all_completed = False
        
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
        
        if run.status == "completed":
            timeseries = db.query(RunMetricsTimeseries).filter(
                RunMetricsTimeseries.run_id == run.id
            ).order_by(RunMetricsTimeseries.time_bucket).all()
            
            if timeseries:
                result["avg_latency"] = sum(t.p50 for t in timeseries) / len(timeseries)
                result["p95"] = max(t.p95 for t in timeseries)
                result["error_rate"] = sum(t.error_rate for t in timeseries) / len(timeseries)
                result["max_stable_rps"] = sum(t.rps for t in timeseries) / len(timeseries)
                result["timeseries"] = [
                    {"time": t.time_bucket, "rps": t.rps, "p50": t.p50, "p95": t.p95, "error_rate": t.error_rate}
                    for t in timeseries
                ]
        
        results.append(result)
    
    comparison = generate_suite_comparison_summary(results)
    
    ai_summary = None
    if all_completed:
        try:
            ai_summary = generate_suite_ai_summary(results)
        except Exception as e:
            print(f"AI summary failed: {e}")
    
    return {
        "suite_id": project.last_suite_id,
        "status": "completed" if all_completed else "running",
        "total_tests": len(suite_runs),
        "completed_tests": len([r for r in suite_runs if r.status in ["completed", "failed"]]),
        "results": results,
        "comparison": comparison,
        "ai_summary": ai_summary
    }

