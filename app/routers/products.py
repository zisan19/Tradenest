from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, crud, auth

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get('/', response_model=list[schemas.ProductOut])
def list_products(q: str | None = None, category_id: int | None = None, db: Session = Depends(auth.get_db)):
    return crud.list_products(db, q=q, category_id=category_id)

@router.get('/{product_id}', response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(auth.get_db)):
    p = crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail='Product not found')
    return p

@router.post('/', response_model=schemas.ProductOut)
def create_product(product: schemas.ProductCreate, db: Session = Depends(auth.get_db), current_user=Depends(auth.require_role('supplier'))):
    return crud.create_product(db, product, supplier_id=current_user.id)

@router.put('/{product_id}', response_model=schemas.ProductOut)
def update_product(product_id: int, data: schemas.ProductCreate, db: Session = Depends(auth.get_db), current_user=Depends(auth.require_role('supplier'))):
    p = crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail='Product not found')
    if p.supplier_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail='Not allowed')
    updated = crud.update_product(db, product_id, data.dict())
    return updated

@router.delete('/{product_id}')
def delete_product(product_id: int, db: Session = Depends(auth.get_db), current_user=Depends(auth.require_role('supplier'))):
    p = crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail='Product not found')
    if p.supplier_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail='Not allowed')
    ok = crud.delete_product(db, product_id)
    return {"deleted": ok}
