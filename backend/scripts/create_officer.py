"""CLI script to create an Officer or Admin account for Krishi Drishti.

Usage:
    python scripts/create_officer.py --name "Dr. Sharma" --phone 9876543210 --password Secret1234 --role officer
"""
import sys
import os
import argparse

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password
from app.schemas.auth import SignupRequest


def create_officer(name: str, phone: str, password: str, role: str, email: str | None = None):
    # Validate using Pydantic schema
    try:
        req = SignupRequest(name=name, phone=phone, password=password, email=email)
    except Exception as exc:
        print(f"❌ Validation error: {exc}")
        return

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.phone == req.phone).first()
        if existing:
            print(f"❌ User with phone {req.phone} already exists!")
            return

        user_role = UserRole.OFFICER if role.lower() == "officer" else UserRole.ADMIN

        new_user = User(
            name=req.name,
            phone=req.phone,
            email=req.email,
            password_hash=hash_password(req.password),
            preferred_language=req.preferred_language,
            role=user_role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"✅ Successfully created {user_role.value.upper()} account:")
        print(f"   Name:  {new_user.name}")
        print(f"   Phone: {new_user.phone}")
        print(f"   Role:  {new_user.role.value}")
        print(f"   ID:    {new_user.id}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create Officer or Admin Account")
    parser.add_argument("--name", required=True, help="Full name")
    parser.add_argument("--phone", required=True, help="10-digit Indian phone number")
    parser.add_argument("--password", required=True, help="Password (min 8 chars)")
    parser.add_argument("--role", default="officer", choices=["officer", "admin"], help="Role (officer/admin)")
    parser.add_argument("--email", default=None, help="Optional email")

    args = parser.parse_args()
    create_officer(
        name=args.name,
        phone=args.phone,
        password=args.password,
        role=args.role,
        email=args.email
    )
