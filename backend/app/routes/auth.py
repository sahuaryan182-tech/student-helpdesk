"""
Admin login route. No signup route exists on purpose.
"""
from fastapi import APIRouter, HTTPException, status
from app.schemas.admin import AdminLogin
from app.models.collections import admins_collection
from app.services.auth_service import verify_password, create_access_token

router = APIRouter()


@router.post("/login")
async def login(credentials: AdminLogin):
    admin = await admins_collection().find_one({"username": credentials.username})
    if not admin or not verify_password(credentials.password, admin["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    token = create_access_token({"sub": str(admin["_id"]), "username": admin["username"]})
    return {"access_token": token, "token_type": "bearer", "username": admin["username"]}
