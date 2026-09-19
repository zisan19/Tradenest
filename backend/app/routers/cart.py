from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, crud, auth

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.get('/', response_model=schemas.CartOut)
def get_cart(
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.get_current_user),
):
    """Retrieve the current authenticated user's active shopping cart."""
    return crud.get_cart_details(db, current_user.id)


@router.post('/items', response_model=schemas.CartOut)
def add_item_to_cart(
    body: schemas.CartItemCreate,
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.get_current_user),
):
    """Add a product with requested quantity to cart, enforcing MOQ and available stock."""
    try:
        return crud.add_cart_item(
            db,
            buyer_id=current_user.id,
            product_id=body.product_id,
            quantity=body.quantity,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.patch('/items/{item_id}', response_model=schemas.CartOut)
def update_item_quantity(
    item_id: int,
    body: schemas.CartItemUpdate,
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.get_current_user),
):
    """Update item quantity, ensuring MOQ and stock thresholds are satisfied."""
    try:
        return crud.update_cart_item(
            db,
            buyer_id=current_user.id,
            item_id=item_id,
            quantity=body.quantity,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.delete('/items/{item_id}')
def remove_item_from_cart(
    item_id: int,
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.get_current_user),
):
    """Remove a single item from the cart."""
    success = crud.delete_cart_item(db, buyer_id=current_user.id, item_id=item_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    return {"success": True, "cart": crud.get_cart_details(db, current_user.id)}


@router.delete('/')
def clear_all_items_from_cart(
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.get_current_user),
):
    """Clear all items from the current user's cart."""
    crud.clear_cart(db, current_user.id)
    return {"success": True, "cart": crud.get_cart_details(db, current_user.id)}
