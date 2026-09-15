import os
import uuid
import json
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Form, File, UploadFile, Depends
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import database
import models

app = FastAPI(title="Evidence Náhradních Dílů API")

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

class UserSchema(BaseModel):
    username: str
    password: str
    name: str
    role: str

class UserUpdateSchema(BaseModel):
    password: str
    name: str
    role: str

class RoleSchema(BaseModel):
    id: str
    name: str
    permissions: List[int]

class SetupRequest(BaseModel):
    db_host: str
    db_port: str
    db_user: str
    db_password: str
    db_name: str
    admin_username: str
    admin_name: str
    admin_password: str

@app.on_event("startup")
def startup_event():
    # Pokusí se inicializovat z .env. Pokud to nevyjde, nespadne, jen čeká na /api/setup
    database.try_init_from_env()

@app.get("/api/status")
def get_status():
    return {"configured": database.SessionLocal is not None}

@app.post("/api/setup")
def setup_system(req: SetupRequest):
    if database.SessionLocal is not None:
        raise HTTPException(status_code=400, detail="Systém je již nastaven.")
        
    try:
        # Zkusit inicializovat
        database.init_db(req.db_host, req.db_port, req.db_user, req.db_password, req.db_name)
        
        # Zapsat do .env
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        from dotenv import set_key
        # Pokud soubor neexistuje, set_key ho obvykle vytvoří, ale raději:
        if not os.path.exists(env_path):
            open(env_path, 'a').close()

        set_key(env_path, "DB_HOST", req.db_host)
        set_key(env_path, "DB_PORT", req.db_port)
        set_key(env_path, "DB_USER", req.db_user)
        set_key(env_path, "DB_PASSWORD", req.db_password)
        set_key(env_path, "DB_NAME", req.db_name)
        
        # Vytvořit tabulky
        database.Base.metadata.create_all(bind=database.engine)
        
        # Přidat výchozí role a uživatele
        db = database.SessionLocal()
        if not db.query(models.Role).first():
            db.add(models.Role(id="admin", name="Administrátor", permissions=[1,2,3,4,5,6,7]))
            db.add(models.Role(id="udrzbar", name="Údržbář (Základ)", permissions=[1,3,4,7]))
            db.add(models.Role(id="skladnik", name="Skladník", permissions=[2,5,7]))
            db.commit()
            
        if not db.query(models.User).filter(models.User.username == req.admin_username).first():
            db.add(models.User(username=req.admin_username, password=req.admin_password, name=req.admin_name, role_id="admin"))
            db.commit()
        db.close()
        
        return {"status": "success", "message": "Systém byl úspěšně nastaven."}
    except Exception as e:
        # reset engine upon failure
        database.engine = None
        database.SessionLocal = None
        raise HTTPException(status_code=400, detail=f"Chyba při připojení k DB: {str(e)}")


@app.post("/api/login")
def login(credentials: LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    if not user or user.password != credentials.password:
        raise HTTPException(status_code=401, detail="Nesprávné přihlašovací údaje")
    
    role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
    return {
        "token": f"jwt-token-pro-{credentials.username}",
        "name": user.name,
        "role": role.name if role else "Bez role",
        "permissions": role.permissions if role else []
    }


@app.post("/api/parts")
async def create_part(
    part_type: str = Form(...),
    device_type: Optional[str] = Form(None),
    serial_number: Optional[str] = Form(None),
    parameters: Optional[str] = Form(None),
    additional_identifier: Optional[str] = Form(None),
    source_equipment: str = Form(...),
    source_serial_number: Optional[str] = Form(None),
    created_by_user: str = Form(...),
    photos: List[UploadFile] = File(default=[]),
    db: Session = Depends(database.get_db)
):
    try:
        if len(photos) > 5:
            raise HTTPException(status_code=400, detail="Můžete nahrát maximálně 5 fotografií.")

        is_new_generated = False
        if not serial_number or serial_number.strip() == "":
            date_str = datetime.now().strftime("%Y%m%d")
            short_hash = str(uuid.uuid4())[:4].upper()
            serial_number = f"END-{date_str}-{short_hash}"
            is_new_generated = True

        if db.query(models.Part).filter(models.Part.serial_number == serial_number).first():
            raise HTTPException(status_code=400, detail="Díl s tímto sériovým číslem již existuje.")

        saved_photo_urls = []
        for photo in photos:
            ext = "jpg"
            if photo.filename and photo.filename.strip() != "" and "." in photo.filename:
                ext = photo.filename.split('.')[-1]
            unique_filename = f"{uuid.uuid4().hex}.{ext}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            content = await photo.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            saved_photo_urls.append(f"/uploads/{unique_filename}")

        new_part = models.Part(
            serial_number=serial_number,
            part_type=part_type,
            parameters=parameters or "Neuvedeno",
            source_equipment="Neuvedeno",
            created_by_user=created_by_user,
            created_at=datetime.utcnow()
        )
        db.add(new_part)
        db.commit()

        for url in saved_photo_urls:
            db.add(models.PartPhoto(part_id=new_part.serial_number, url=url))

        hist = models.PartHistory(
            part_id=new_part.serial_number,
            action="Založení",
            user=created_by_user,
            date=new_part.created_at,
            details={"info": "Původní zaevidování", "source": source_equipment}
        )
        db.add(hist)
        db.commit()
        db.refresh(hist)

        for url in saved_photo_urls:
            db.add(models.HistoryPhoto(history_id=hist.id, url=url))
        db.commit()

        part_dict = {
            "part_type": part_type,
            "device_type": device_type or "Neuvedeno",
            "serial_number": serial_number,
            "parameters": parameters or "Neuvedeno",
            "additional_identifier": additional_identifier or "",
            "source_equipment": "Neuvedeno",
            "source_serial_number": source_serial_number or "",
            "created_by_user": created_by_user,
            "created_at": new_part.created_at.isoformat(),
            "photos": saved_photo_urls,
            "history": [
                {
                    "action": "Založení",
                    "user": created_by_user,
                    "date": hist.date.isoformat(),
                    "details": hist.details,
                    "photos": saved_photo_urls
                }
            ]
        }

        return {
            "status": "success", 
            "message": "Díl zaevidován.", 
            "part": part_dict,
            "is_new_generated": is_new_generated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/parts")
def get_parts(db: Session = Depends(database.get_db)):
    parts = db.query(models.Part).order_by(models.Part.created_at.desc()).all()
    results = []
    for p in parts:
        results.append({
            "serial_number": p.serial_number,
            "part_type": p.part_type,
            "parameters": p.parameters,
            "source_equipment": p.source_equipment,
            "created_by_user": p.created_by_user,
            "created_at": p.created_at.isoformat(),
            "photos": [ph.url for ph in p.photos]
        })
    return results


@app.get("/api/parts/{serial_number}")
def get_part_by_sn(serial_number: str, db: Session = Depends(database.get_db)):
    p = db.query(models.Part).filter(models.Part.serial_number == serial_number).first()
    if not p:
        raise HTTPException(status_code=404, detail="Díl nenalezen")
    
    hist_list = []
    for h in p.history:
        hist_list.append({
            "action": h.action,
            "user": h.user,
            "date": h.date.isoformat(),
            "details": h.details,
            "photos": [hp.url for hp in h.photos]
        })

    return {
        "serial_number": p.serial_number,
        "part_type": p.part_type,
        "parameters": p.parameters,
        "source_equipment": p.source_equipment,
        "created_by_user": p.created_by_user,
        "created_at": p.created_at.isoformat(),
        "photos": [ph.url for ph in p.photos],
        "history": hist_list
    }


@app.post("/api/parts/{serial_number}/history")
async def add_part_history(
    serial_number: str,
    action: str = Form(...),
    user: str = Form(...),
    details: str = Form("{}"),
    photos: List[UploadFile] = File(default=[]),
    db: Session = Depends(database.get_db)
):
    part = db.query(models.Part).filter(models.Part.serial_number == serial_number).first()
    if not part:
        raise HTTPException(status_code=404, detail="Díl nenalezen")
        
    saved_photo_urls = []
    if photos:
        for photo in photos:
            ext = "jpg"
            if photo.filename and photo.filename.strip() != "" and "." in photo.filename:
                ext = photo.filename.split('.')[-1]
            unique_filename = f"{uuid.uuid4().hex}.{ext}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            content = await photo.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            saved_photo_urls.append(f"/uploads/{unique_filename}")

    try:
        details_dict = json.loads(details)
    except:
        details_dict = {"raw": details}

    hist = models.PartHistory(
        part_id=part.serial_number,
        action=action,
        user=user,
        date=datetime.utcnow(),
        details=details_dict
    )
    db.add(hist)
    db.commit()
    db.refresh(hist)

    for url in saved_photo_urls:
        db.add(models.HistoryPhoto(history_id=hist.id, url=url))
    db.commit()

    return {"status": "success", "message": "Historie aktualizována"}


@app.get("/api/users")
def get_users(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    return [{"username": u.username, "name": u.name, "role": u.role_id, "password": u.password} for u in users]


@app.post("/api/users")
def create_user(user: UserSchema, db: Session = Depends(database.get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Uživatel již existuje.")
    new_user = models.User(username=user.username, password=user.password, name=user.name, role_id=user.role)
    db.add(new_user)
    db.commit()
    return {"message": "Uživatel úspěšně vytvořen"}


@app.put("/api/users/{username}")
def update_user(username: str, data: UserUpdateSchema, db: Session = Depends(database.get_db)):
    u = db.query(models.User).filter(models.User.username == username).first()
    if not u:
        raise HTTPException(status_code=404, detail="Nenalezen.")
    u.password = data.password
    u.name = data.name
    u.role_id = data.role
    db.commit()
    return {"message": "Aktualizováno"}


@app.get("/api/roles")
def get_roles(db: Session = Depends(database.get_db)):
    roles = db.query(models.Role).all()
    return [{"id": r.id, "name": r.name, "permissions": r.permissions} for r in roles]


@app.post("/api/roles")
def create_role(role: RoleSchema, db: Session = Depends(database.get_db)):
    if db.query(models.Role).filter(models.Role.id == role.id).first():
        raise HTTPException(status_code=400, detail="Existuje.")
    new_role = models.Role(id=role.id, name=role.name, permissions=role.permissions)
    db.add(new_role)
    db.commit()
    return {"message": "Vytvořeno"}


@app.put("/api/roles/{role_id}")
def update_role(role_id: str, role: RoleSchema, db: Session = Depends(database.get_db)):
    r = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Nenalezen.")
    r.name = role.name
    r.permissions = role.permissions
    db.commit()
    return {"message": "Upraveno"}
