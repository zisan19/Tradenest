from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from .. import schemas, crud, auth

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post('/', response_model=schemas.OrderOut)
def place_order(order_in: schemas.OrderCreate, db: Session = Depends(auth.get_db), current_user=Depends(auth.get_current_user)):
    try:
        order = crud.create_order(db, buyer_id=current_user.id, items=order_in.items)
        return order
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.get('/my', response_model=list[schemas.OrderOut])
def my_orders(db: Session = Depends(auth.get_db), current_user=Depends(auth.get_current_user)):
    return crud.list_orders_for_user(db, current_user.id)

@router.get('/supplier', response_model=list[schemas.OrderOut])
def supplier_orders(db: Session = Depends(auth.get_db), current_user=Depends(auth.require_role('supplier'))):
    return crud.list_orders_for_supplier(db, current_user.id)

@router.put('/{order_id}/status', response_model=schemas.OrderOut)
def update_status(order_id: int, status: str = Body(...), db: Session = Depends(auth.get_db), current_user=Depends(auth.get_current_user)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')

    if current_user.role == 'admin':
        return crud.update_order_status(db, order_id, status)

    if current_user.role == 'buyer':
        if status != 'cancelled':
            raise HTTPException(status_code=403, detail='Buyers may only cancel orders')
        if order.buyer_id != current_user.id:
            raise HTTPException(status_code=403, detail='Not your order')
        return crud.update_order_status(db, order_id, status)

    if current_user.role == 'supplier':
        has_product = any(item.product and item.product.supplier_id == current_user.id for item in order.items)
        if not has_product:
            raise HTTPException(status_code=403, detail='No permission to update this order')
        return crud.update_order_status(db, order_id, status)

    raise HTTPException(status_code=403, detail='Operation not permitted')

@router.get('/recent', response_model=list[schemas.OrderOut])
def recent_orders(db: Session = Depends(auth.get_db), current_user=Depends(auth.require_role('admin'))):
    return crud.list_recent_orders(db)
