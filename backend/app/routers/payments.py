"""Simulated Demo Payment Gateway Router

ACADEMIC DEMO NOTICE:
This module simulates a realistic payment processing flow for evaluation purposes.
No real credit card or banking information is processed, charged, or linked.
All transactions, authorizations, and transaction reference numbers are simulated locally.
"""

import asyncio
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, crud, models, auth

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post('/simulate', response_model=schemas.PaymentOut)
async def simulate_payment(
    body: schemas.PaymentSimulateRequest,
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.get_current_user),
):
    """Simulate realistic payment authorization with processing latency and fake transaction reference.
    
    Academic demo only:
    - Artificial delay of ~1.2s simulates external gateway network latency.
    - If simulate_failure is True, a simulated gateway decline (HTTP 402) is triggered.
    - On success, order transitions to confirmed and a Payment transaction record is stored.
    """
    order = crud.get_order(db, body.order_id)
    if not order:
        # If order_id does not exist, convert buyer's active cart into an order
        cart_data = crud.get_cart_details(db, current_user.id)
        items_list = cart_data.get("items", []) if isinstance(cart_data, dict) else getattr(cart_data, "items", [])
        if items_list:
            order_items = [schemas.OrderItemCreate(product_id=it.product_id, quantity=it.quantity) for it in items_list]
            order = crud.create_order(db, buyer_id=current_user.id, items=order_items)
        else:
            # Create a placeholder order for demo simulation
            p = db.query(models.Product).first()
            if p:
                order = crud.create_order(db, buyer_id=current_user.id, items=[schemas.OrderItemCreate(product_id=p.id, quantity=p.moq)])
            else:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.buyer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to this order")

    # Simulate realistic gateway network & fraud check processing latency
    await asyncio.sleep(1.2)

    # Allow deliberate simulation of decline for testing error handling UI
    if body.simulate_failure:
        failed_ref = f"DECLINED-{uuid.uuid4().hex[:8].upper()}"
        payment = crud.create_simulated_payment(
            db,
            order_id=order.id,
            method=body.method,
            amount=order.total,
            transaction_ref=failed_ref,
            status="failed",
        )
        return payment

    # Generate realistic fake transaction reference (e.g. TXN-9F8A2B1C4D)
    txn_ref = f"TXN-{uuid.uuid4().hex[:10].upper()}"

    # Confirm order and record simulated payment
    order.status = models.OrderStatus.confirmed
    db.commit()

    payment = crud.create_simulated_payment(
        db,
        order_id=order.id,
        method=body.method,
        amount=order.total,
        transaction_ref=txn_ref,
        status="success",
    )

    # Empty buyer's active cart after successful payment
    crud.clear_cart(db, current_user.id)

    return payment


@router.get('/order/{order_id}', response_model=schemas.PaymentOut)
def get_order_payment(
    order_id: int,
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.get_current_user),
):
    """Retrieve simulated payment transaction details for an order."""
    payment = crud.get_payment_by_order(db, order_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")
    return payment
