"""Billing router for credit-based billing with Stripe."""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import math
import stripe

from ..database import get_db
from ..models import User, CreditTransaction, Run
from ..auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/billing", tags=["billing"])


def get_stripe():
    """Initialize Stripe client."""
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe is not configured")
    stripe.api_key = settings.stripe_secret_key
    return stripe


def get_or_create_stripe_customer(user: User, db: Session) -> str:
    """Get existing Stripe customer or create new one."""
    stripe_client = get_stripe()
    
    if user.stripe_customer_id:
        return user.stripe_customer_id
    
    customer = stripe_client.Customer.create(
        email=user.email,
        metadata={"user_id": str(user.id)}
    )
    
    user.stripe_customer_id = customer.id
    db.commit()
    
    return customer.id


def calculate_credits(requests: int, vu_minutes: float) -> int:
    """
    Calculate credits for a test run.
    
    Formula: max(ceil(requests/10k), ceil(vu_minutes/50))
    Minimum: 5 credits
    """
    credits_req = math.ceil(requests / 10000) if requests > 0 else 0
    credits_vu = math.ceil(vu_minutes / 50) if vu_minutes > 0 else 0
    return max(settings.min_credits_per_run, max(credits_req, credits_vu))


def calculate_vu_minutes(duration_seconds: int, vus_start: int, vus_end: int = None) -> float:
    """
    Calculate VU-minutes for a test run.
    
    For ramp tests: (vus_start + vus_end) / 2 * duration_minutes
    For constant: vus * duration_minutes
    """
    duration_minutes = duration_seconds / 60
    if vus_end is None:
        vus_end = vus_start
    return ((vus_start + vus_end) / 2) * duration_minutes


def add_credits(user: User, amount: int, transaction_type: str, db: Session, 
                description: str = None, stripe_payment_id: str = None, 
                package_name: str = None, run_id: int = None):
    """Add or deduct credits and create transaction record."""
    user.credit_balance += amount
    
    transaction = CreditTransaction(
        user_id=user.id,
        amount=amount,
        balance_after=user.credit_balance,
        transaction_type=transaction_type,
        description=description,
        stripe_payment_id=stripe_payment_id,
        package_name=package_name,
        run_id=run_id
    )
    db.add(transaction)
    db.commit()
    
    return transaction


@router.get("/balance")
def get_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current credit balance."""
    return {
        "balance": current_user.credit_balance,
        "free_credits_claimed": current_user.free_credits_claimed
    }


@router.post("/claim-free-credits")
def claim_free_credits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Claim free signup credits (one-time)."""
    if current_user.free_credits_claimed:
        raise HTTPException(status_code=400, detail="Free credits already claimed")
    
    add_credits(
        user=current_user,
        amount=settings.free_credits_on_signup,
        transaction_type="bonus",
        description=f"Welcome bonus: {settings.free_credits_on_signup} free credits",
        db=db
    )
    
    current_user.free_credits_claimed = True
    db.commit()
    
    return {
        "message": f"Claimed {settings.free_credits_on_signup} free credits!",
        "balance": current_user.credit_balance
    }


@router.get("/packages")
def get_packages():
    """Get available credit packages."""
    packages = []
    for price_id, pkg in settings.credit_packages.items():
        packages.append({
            "id": price_id,
            "name": pkg["name"],
            "credits": pkg["credits"],
            "price": pkg["price_cents"] / 100,
            "price_per_credit": round(pkg["price_cents"] / pkg["credits"] / 100, 3)
        })
    return {"packages": packages}


@router.post("/buy-credits")
def buy_credits(
    package_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Stripe checkout session for credit purchase."""
    stripe_client = get_stripe()
    
    if package_id not in settings.credit_packages:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = settings.credit_packages[package_id]
    customer_id = get_or_create_stripe_customer(current_user, db)
    
    try:
        checkout_session = stripe_client.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"API Stress Lab - {package['name']} Credits",
                        "description": f"{package['credits']} credits for API stress testing"
                    },
                    "unit_amount": package["price_cents"]
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=f"{settings.frontend_url}/dashboard?purchase=success&credits={package['credits']}",
            cancel_url=f"{settings.frontend_url}/pricing?purchase=canceled",
            metadata={
                "user_id": str(current_user.id),
                "package_id": package_id,
                "credits": str(package["credits"])
            }
        )
        return {"checkout_url": checkout_session.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions")
def get_transactions(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get credit transaction history."""
    transactions = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == current_user.id
    ).order_by(CreditTransaction.created_at.desc()).limit(limit).all()
    
    return {
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "balance_after": t.balance_after,
                "type": t.transaction_type,
                "description": t.description,
                "package_name": t.package_name,
                "run_id": t.run_id,
                "created_at": t.created_at.isoformat()
            }
            for t in transactions
        ]
    }


@router.get("/estimate")
def estimate_credits(
    requests: int = 10000,
    duration_seconds: int = 60,
    vus: int = 10,
    vus_end: int = None
):
    """Estimate credits for a test run."""
    if vus_end is None:
        vus_end = vus
    
    vu_minutes = calculate_vu_minutes(duration_seconds, vus, vus_end)
    credits = calculate_credits(requests, vu_minutes)
    
    return {
        "estimated_credits": credits,
        "breakdown": {
            "requests": requests,
            "vu_minutes": round(vu_minutes, 1),
            "credits_from_requests": math.ceil(requests / 10000),
            "credits_from_vu_minutes": math.ceil(vu_minutes / 50),
            "minimum_credits": settings.min_credits_per_run
        }
    }


def handle_checkout_completed(session: dict, db: Session):
    """Handle successful checkout - add credits to user."""
    user_id = session.get("metadata", {}).get("user_id")
    package_id = session.get("metadata", {}).get("package_id")
    credits = session.get("metadata", {}).get("credits")
    
    if not user_id or not credits:
        print(f"Missing metadata in checkout session: {session.get('id')}")
        return
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        print(f"User not found: {user_id}")
        return
    
    # Check for duplicate payment
    existing = db.query(CreditTransaction).filter(
        CreditTransaction.stripe_payment_id == session.get("payment_intent")
    ).first()
    if existing:
        print(f"Duplicate payment ignored: {session.get('payment_intent')}")
        return
    
    package = settings.credit_packages.get(package_id, {})
    
    add_credits(
        user=user,
        amount=int(credits),
        transaction_type="purchase",
        description=f"Purchased {package.get('name', '')} package",
        stripe_payment_id=session.get("payment_intent"),
        package_name=package.get("name"),
        db=db
    )
    
    print(f"Added {credits} credits to user {user_id}")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db)
):
    """Handle Stripe webhooks."""
    stripe_client = get_stripe()
    
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")
    
    payload = await request.body()
    
    try:
        event = stripe_client.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    event_type = event["type"]
    data = event["data"]["object"]
    
    print(f"Stripe webhook: {event_type}")
    
    if event_type == "checkout.session.completed":
        handle_checkout_completed(data, db)
    
    return {"status": "ok"}
