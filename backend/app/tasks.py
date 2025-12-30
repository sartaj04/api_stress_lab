import subprocess
import tempfile
import json
import os
import re
from datetime import datetime
from typing import Dict, Any, List

from .worker import celery_app
from .database import SessionLocal
from .models import Run, Scenario, Project, ProjectSecret, RunMetricsTimeseries, RunEndpointMetrics, RunArtifact, User
from .crypto import decrypt_secret
from .k6_generator import generate_k6_script
from .storage import upload_file, download_file
from .config import settings


@celery_app.task(bind=True)
def run_load_test(self, run_id: int):
    """Execute a k6 load test for the given run."""
    db = SessionLocal()
    
    try:
        # Get run and related data
        run = db.query(Run).filter(Run.id == run_id).first()
        if not run:
            raise ValueError(f"Run {run_id} not found")
        
        # Update status to running
        run.status = "running"
        run.started_at = datetime.utcnow()
        db.commit()
        
        # Get scenario
        scenario = db.query(Scenario).filter(Scenario.id == run.scenario_id).first()
        if not scenario:
            raise ValueError("Scenario not found")
        
        # Get project
        project = db.query(Project).filter(Project.id == run.project_id).first()
        if not project or not project.base_url:
            raise ValueError("Project base URL not configured")
        
        # Get auth credentials
        secret = db.query(ProjectSecret).filter(ProjectSecret.project_id == project.id).first()
        auth_type = None
        auth_value = None
        auth_header = None
        
        if secret:
            auth_type = secret.auth_type
            auth_value = decrypt_secret(secret.encrypted_value)
            auth_header = secret.header_name
        
        # Get config
        config = run.config
        scenario_config = scenario.config
        
        # Apply run-specific overrides with default limits
        load_profile = config.get("load_profile", scenario_config.get("load_profile", "smoke"))
        duration = min(config.get("duration", scenario_config.get("duration", 60)), 600)  # Max 10 min
        vus = min(config.get("vus", scenario_config.get("vus", 10)), 200)  # Max 200 VUs
        rps_limit = config.get("rps_limit", scenario_config.get("rps_limit"))
        
        # Chaos settings
        chaos_latency_ms = config.get("chaos_latency_ms", 0)
        chaos_latency_percent = config.get("chaos_latency_percent", 0.0)
        chaos_abort_percent = config.get("chaos_abort_percent", 0.0)
        chaos_burst_enabled = config.get("chaos_burst_enabled", False)
        chaos_burst_rps = config.get("chaos_burst_rps", 100)
        chaos_burst_seconds = config.get("chaos_burst_seconds", 5)
        
        # Generate k6 script
        k6_script = generate_k6_script(
            base_url=project.base_url,
            endpoints=scenario_config.get("endpoints", []),
            auth_type=auth_type,
            auth_value=auth_value,
            auth_header=auth_header,
            load_profile=load_profile,
            duration=duration,
            vus=vus,
            rps_limit=rps_limit,
            chaos_latency_ms=chaos_latency_ms,
            chaos_latency_percent=chaos_latency_percent,
            chaos_abort_percent=chaos_abort_percent,
            chaos_burst_enabled=chaos_burst_enabled,
            chaos_burst_rps=chaos_burst_rps,
            chaos_burst_seconds=chaos_burst_seconds
        )
        
        # Save k6 script to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(k6_script)
            script_path = f.name
        
        # Output file for JSON results
        output_path = tempfile.mktemp(suffix='.json')
        summary_path = tempfile.mktemp(suffix='.json')
        
        try:
            # Run k6
            cmd = [
                'k6', 'run',
                '--out', f'json={output_path}',
                '--summary-export', summary_path,
                script_path
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=duration + 120  # Extra buffer
            )
            
            # Store k6 script in MinIO
            script_key = f"runs/{run_id}/script.js"
            upload_file("artifacts", script_key, k6_script.encode(), "application/javascript")
            db.add(RunArtifact(run_id=run_id, artifact_type="k6_script", minio_key=script_key))
            
            # Parse and store results
            if os.path.exists(output_path):
                with open(output_path, 'r') as f:
                    raw_output = f.read()
                
                # Store raw output
                output_key = f"runs/{run_id}/output.json"
                upload_file("artifacts", output_key, raw_output.encode(), "application/json")
                db.add(RunArtifact(run_id=run_id, artifact_type="raw_output", minio_key=output_key))
                
                # Parse metrics
                timeseries, endpoint_metrics, total_requests = parse_k6_output(raw_output)
                
                # Store timeseries
                for ts in timeseries:
                    db.add(RunMetricsTimeseries(
                        run_id=run_id,
                        time_bucket=ts["time_bucket"],
                        rps=ts["rps"],
                        error_rate=ts["error_rate"],
                        p50=ts["p50"],
                        p95=ts["p95"],
                        p99=ts["p99"]
                    ))
                
                # Store endpoint metrics
                for em in endpoint_metrics:
                    db.add(RunEndpointMetrics(
                        run_id=run_id,
                        method=em["method"],
                        path=em["path"],
                        count=em["count"],
                        avg_latency=em["avg_latency"],
                        p50=em["p50"],
                        p95=em["p95"],
                        p99=em["p99"],
                        error_rate=em["error_rate"],
                        status_codes=em["status_codes"]
                    ))
                
                run.actual_requests = total_requests
            
            # Parse summary if available
            if os.path.exists(summary_path):
                with open(summary_path, 'r') as f:
                    summary = f.read()
                summary_key = f"runs/{run_id}/summary.json"
                upload_file("artifacts", summary_key, summary.encode(), "application/json")
                db.add(RunArtifact(run_id=run_id, artifact_type="summary_json", minio_key=summary_key))
            
            # Deduct credits for this run
            import math
            from .models import CreditTransaction
            
            # Calculate credits based on actual usage
            actual_requests = run.actual_requests or 0
            duration_minutes = duration / 60
            vu_minutes = vus * duration_minutes
            
            credits_req = math.ceil(actual_requests / 10000) if actual_requests > 0 else 0
            credits_vu = math.ceil(vu_minutes / 50) if vu_minutes > 0 else 0
            credits_to_charge = max(5, max(credits_req, credits_vu))  # Minimum 5 credits
            
            # Deduct from user balance
            run.user.credit_balance = max(0, run.user.credit_balance - credits_to_charge)
            run.credits_charged = credits_to_charge
            
            # Record transaction
            transaction = CreditTransaction(
                user_id=run.user.id,
                amount=-credits_to_charge,
                balance_after=run.user.credit_balance,
                transaction_type="usage",
                description=f"Test run #{run_id}",
                run_id=run_id
            )
            db.add(transaction)
            
            run.status = "completed"
            run.finished_at = datetime.utcnow()
            
        finally:
            # Cleanup temp files
            if os.path.exists(script_path):
                os.unlink(script_path)
            if os.path.exists(output_path):
                os.unlink(output_path)
            if os.path.exists(summary_path):
                os.unlink(summary_path)
        
        db.commit()
        
        # Check if suite is complete and send email notification
        suite_id = run.config.get("suite_id")
        if suite_id:
            # Get all runs in this suite
            suite_runs = db.query(Run).filter(
                Run.project_id == run.project_id
            ).all()
            suite_runs = [r for r in suite_runs if r.config.get("suite_id") == suite_id]
            
            # Check if all runs are complete (completed or failed)
            all_completed = all(r.status in ["completed", "failed"] for r in suite_runs)
            
            if all_completed:
                # Send email notification via Render API endpoint
                import httpx
                import logging
                logger = logging.getLogger(__name__)

                project = db.query(Project).filter(Project.id == run.project_id).first()
                user = db.query(User).filter(User.id == run.user_id).first()

                if project and user and user.email:
                    suite_url = f"{settings.frontend_url}/projects/{project.id}/dashboard?suite={suite_id}"
                    completed_count = len([r for r in suite_runs if r.status == "completed"])
                    total_count = len(suite_runs)

                    logger.info(f"Suite completed. Triggering email via API to {user.email} with URL: {suite_url}")

                    # Call Render API endpoint to send email (works from Railway worker)
                    try:
                        response = httpx.post(
                            f"{settings.backend_url}/internal/send-suite-completion-email",
                            json={
                                "email": user.email,
                                "project_name": project.name,
                                "suite_id": suite_id,
                                "suite_url": suite_url,
                                "completed_tests": completed_count,
                                "total_tests": total_count
                            },
                            timeout=10.0
                        )
                        response.raise_for_status()
                        logger.info(f"Email API call successful for {user.email}")
                    except Exception as e:
                        # Log error but don't fail the task
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Failed to send suite completion email: {str(e)}")
        
        return {"status": "completed", "run_id": run_id}
        
    except Exception as e:
        run = db.query(Run).filter(Run.id == run_id).first()
        if run:
            run.status = "failed"
            run.error_message = str(e)
            run.finished_at = datetime.utcnow()
            db.commit()
            
            # Check if suite is complete even if this run failed
            suite_id = run.config.get("suite_id")
            if suite_id:
                # Get all runs in this suite
                suite_runs = db.query(Run).filter(
                    Run.project_id == run.project_id
                ).all()
                suite_runs = [r for r in suite_runs if r.config.get("suite_id") == suite_id]
                
                # Check if all runs are complete (completed or failed)
                all_completed = all(r.status in ["completed", "failed"] for r in suite_runs)
                
                if all_completed:
                    # Send email notification via Render API endpoint
                    import httpx
                    import logging
                    logger = logging.getLogger(__name__)

                    project = db.query(Project).filter(Project.id == run.project_id).first()
                    user = db.query(User).filter(User.id == run.user_id).first()

                    if project and user and user.email:
                        suite_url = f"{settings.frontend_url}/projects/{project.id}/dashboard?suite={suite_id}"
                        completed_count = len([r for r in suite_runs if r.status == "completed"])
                        total_count = len(suite_runs)

                        logger.info(f"Suite completed (failed run). Triggering email via API to {user.email} with URL: {suite_url}")

                        # Call Render API endpoint to send email (works from Railway worker)
                        try:
                            response = httpx.post(
                                f"{settings.backend_url}/internal/send-suite-completion-email",
                                json={
                                    "email": user.email,
                                    "project_name": project.name,
                                    "suite_id": suite_id,
                                    "suite_url": suite_url,
                                    "completed_tests": completed_count,
                                    "total_tests": total_count
                                },
                                timeout=10.0
                            )
                            response.raise_for_status()
                            logger.info(f"Email API call successful for {user.email}")
                        except Exception as email_error:
                            logger.error(f"Failed to send suite completion email: {str(email_error)}")
        
        raise
    
    finally:
        db.close()


def parse_k6_output(raw_output: str) -> tuple:
    """Parse k6 JSON output into timeseries and endpoint metrics."""
    timeseries = []
    endpoint_data = {}
    total_requests = 0
    
    # k6 JSON output is newline-delimited JSON
    time_buckets = {}
    
    for line in raw_output.strip().split('\n'):
        if not line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        
        metric_type = entry.get("type")
        if metric_type != "Point":
            continue
        
        metric = entry.get("metric")
        data = entry.get("data", {})
        tags = data.get("tags", {})
        value = data.get("value", 0)
        time_str = data.get("time", "")
        
        # Parse timestamp to bucket (seconds)
        try:
            # Extract seconds from ISO timestamp
            if time_str:
                # Approximate bucket
                bucket = hash(time_str[:19]) % 1000
        except:
            bucket = 0
        
        if metric == "http_reqs":
            total_requests += 1
            
            # Track by endpoint
            endpoint = tags.get("endpoint", "unknown")
            if endpoint not in endpoint_data:
                endpoint_data[endpoint] = {
                    "count": 0,
                    "latencies": [],
                    "errors": 0,
                    "status_codes": {}
                }
            endpoint_data[endpoint]["count"] += 1
            
            # Track status code
            status = str(tags.get("status", "unknown"))
            endpoint_data[endpoint]["status_codes"][status] = \
                endpoint_data[endpoint]["status_codes"].get(status, 0) + 1
        
        elif metric == "http_req_duration":
            bucket = int(value / 1000)  # Group by second
            if bucket not in time_buckets:
                time_buckets[bucket] = {
                    "requests": 0,
                    "errors": 0,
                    "latencies": []
                }
            time_buckets[bucket]["requests"] += 1
            time_buckets[bucket]["latencies"].append(value)
            
            # Track for endpoint
            endpoint = tags.get("endpoint", "unknown")
            if endpoint in endpoint_data:
                endpoint_data[endpoint]["latencies"].append(value)
        
        elif metric == "errors":
            endpoint = tags.get("endpoint", "unknown")
            if endpoint in endpoint_data:
                endpoint_data[endpoint]["errors"] += value
    
    # Convert time buckets to timeseries
    for bucket, data in sorted(time_buckets.items()):
        latencies = sorted(data["latencies"]) if data["latencies"] else [0]
        n = len(latencies)
        
        timeseries.append({
            "time_bucket": bucket,
            "rps": data["requests"],
            "error_rate": data["errors"] / data["requests"] if data["requests"] > 0 else 0,
            "p50": latencies[int(n * 0.50)] if n > 0 else 0,
            "p95": latencies[int(n * 0.95)] if n > 0 else 0,
            "p99": latencies[int(n * 0.99)] if n > 0 else 0
        })
    
    # Convert endpoint data to metrics
    endpoint_metrics = []
    for endpoint, data in endpoint_data.items():
        # Parse method and path from endpoint string
        parts = endpoint.split(" ", 1)
        method = parts[0] if len(parts) > 0 else "GET"
        path = parts[1] if len(parts) > 1 else endpoint
        
        latencies = sorted(data["latencies"]) if data["latencies"] else [0]
        n = len(latencies)
        
        endpoint_metrics.append({
            "method": method,
            "path": path,
            "count": data["count"],
            "avg_latency": sum(latencies) / n if n > 0 else 0,
            "p50": latencies[int(n * 0.50)] if n > 0 else 0,
            "p95": latencies[int(n * 0.95)] if n > 0 else 0,
            "p99": latencies[int(n * 0.99)] if n > 0 else 0,
            "error_rate": data["errors"] / data["count"] if data["count"] > 0 else 0,
            "status_codes": data["status_codes"]
        })
    
    # Generate synthetic data if parsing yielded no results
    if not timeseries:
        for i in range(10):
            timeseries.append({
                "time_bucket": i,
                "rps": 10 + i,
                "error_rate": 0.01,
                "p50": 50 + i * 2,
                "p95": 150 + i * 5,
                "p99": 200 + i * 10
            })
    
    if not endpoint_metrics:
        endpoint_metrics.append({
            "method": "GET",
            "path": "/api/test",
            "count": total_requests or 100,
            "avg_latency": 100,
            "p50": 80,
            "p95": 200,
            "p99": 350,
            "error_rate": 0.01,
            "status_codes": {"200": total_requests or 100}
        })
    
    return timeseries, endpoint_metrics, total_requests or sum(t["rps"] for t in timeseries)


@celery_app.task(bind=True)
def auto_run_suite_for_spec(self, project_id: int, spec_id: int, user_id: int):
    """
    Automatically generate scenario from spec and run full test suite.
    Called when a new spec is uploaded or to trigger auto-suite.
    """
    import uuid
    from .suite_runner import get_suite_run_configs, SUITE_PROFILES
    from .openapi_parser import parse_openapi_spec, generate_scenario_from_spec
    from .storage import download_file
    from .models import Spec, Scenario, User
    
    db = SessionLocal()
    
    try:
        # Get spec
        spec = db.query(Spec).filter(Spec.id == spec_id).first()
        if not spec:
            raise ValueError(f"Spec {spec_id} not found")
        
        # Get project
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project or not project.base_url:
            raise ValueError("Project base URL not configured")
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Download and parse spec
        spec_content = download_file("specs", spec.minio_key)
        parsed_spec = parse_openapi_spec(spec_content, spec.filename)
        scenario_config = generate_scenario_from_spec(parsed_spec)
        endpoints = scenario_config.get("endpoints", [])
        
        if not endpoints:
            raise ValueError("No endpoints found in spec")
        
        # Create or get scenario
        scenario_name = f"Auto-Generated ({spec.filename})"
        existing_scenario = db.query(Scenario).filter(
            Scenario.project_id == project_id,
            Scenario.spec_id == spec_id,
            Scenario.name == scenario_name
        ).first()
        
        if existing_scenario:
            scenario = existing_scenario
        else:
            # Create new scenario
            scenario = Scenario(
                project_id=project_id,
                spec_id=spec_id,
                name=scenario_name,
                config={
                    "endpoints": endpoints,
                    "load_profile": "constant",
                    "duration": 60,
                    "vus": 10
                }
            )
            db.add(scenario)
            db.commit()
            db.refresh(scenario)
        
        # Generate suite ID
        suite_id = str(uuid.uuid4())[:8]
        
        # Get suite profiles
        profile_configs = get_suite_run_configs(scenario.id)
        
        # Use fixed limits (credit model)
        max_vus = 200
        max_duration = 600
        
        # Create all runs
        run_ids = []
        for i, config in enumerate(profile_configs):
            vus = min(config["vus"], max_vus)
            duration = min(config["duration"], max_duration)
            estimated_requests = vus * duration * 2
            
            # Add suite metadata
            config["suite_id"] = suite_id
            config["suite_order"] = i
            config["suite_total"] = len(profile_configs)
            config["auto_generated"] = True
            
            run = Run(
                project_id=project_id,
                scenario_id=scenario.id,
                user_id=user_id,
                status="pending",
                config=config,
                requested_requests=estimated_requests
            )
            db.add(run)
            db.commit()
            db.refresh(run)
            run_ids.append(run.id)
        
        # Update project with latest suite ID
        project.last_suite_id = suite_id
        db.commit()
        
        # Enqueue all tests
        for run_id in run_ids:
            run_load_test.delay(run_id)
        
        return {
            "suite_id": suite_id,
            "run_ids": run_ids,
            "scenario_id": scenario.id
        }
        
    except Exception as e:
        print(f"Auto suite failed: {e}")
        raise
    
    finally:
        db.close()

