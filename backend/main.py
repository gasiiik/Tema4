import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Form, File, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Evidence Náhradních Dílů API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBÁLNÍ ROZŠÍŘENÁ DATABÁZE V PAMĚTI ---
# Moduly: 1=Založení, 2=Příchod, 3=Nasazení, 4=Demontáž, 5=Odeslání, 6=Administrace, 7=Přehled dílů
MOCK_ROLES = {
    "admin": {"name": "Administrátor", "permissions": [1, 2, 3, 4, 5, 6, 7]},
    "udrzbar": {"name": "Údržbář (Základ)", "permissions": [1, 3, 4, 7]},
    "skladnik": {"name": "Skladník", "permissions": [2, 5, 7]}
}

MOCK_USERS = {
    "admin": {"password": "admin", "role": "admin", "name": "Hlavní Admin"},
    "udrzba": {"password": "heslo123", "role": "udrzbar", "name": "Jan Novák"},
    "sklad": {"password": "sklad", "role": "skladnik", "name": "Josef Skladník"}
}

# --- NOVÉ ÚLOŽIŠTĚ PRO DÍLY ---
# Předvyplníme testovací data, abychom měli hned od startu co filtrovat
MOCK_PARTS = [
    {
        "part_type": "Servomotor Siemens",
        "serial_number": "END-20260510-99AA",
        "parameters": "3x400V, 1.5kW, IP65",
        "source_equipment": "Lis Kuka 02",
        "created_by_user": "Jan Novák",
        "created_at": "2026-05-10T14:32:00"
    },
    {
        "part_type": "Hydraulický ventil Bosch",
        "serial_number": "END-20260601-BB44",
        "parameters": "max 315 bar, 24V DC",
        "source_equipment": "Hlavní hydraulická stanice",
        "created_by_user": "Hlavní Admin",
        "created_at": "2026-06-01T09:15:00"
    },
    {
        "part_type": "Indukční snímač IFM",
        "serial_number": "SN-987654321",
        "parameters": "M18, PNP, NO, dosah 8mm",
        "source_equipment": "Dopravník balení 04",
        "created_by_user": "Jan Novák",
        "created_at": "2026-06-12T11:05:00"
    }
]

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

@app.post("/api/login")
def login(credentials: LoginRequest):
    user = MOCK_USERS.get(credentials.username)
    if not user or user["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Nesprávné přihlašovací údaje")
    
    role_data = MOCK_ROLES.get(user["role"], {"name": "Bez role", "permissions": []})
    return {
        "token": f"jwt-token-pro-{credentials.username}",
        "name": user["name"],
        "role": role_data["name"],
        "permissions": role_data["permissions"]
    }

# --- UPRAVENO: ZALOŽENÍ DÍLU NYNÍ UKLÁDÁ DATA DO POLE ---
@app.post("/api/parts")
async def create_part(
    part_type: str = Form(...),
    serial_number: Optional[str] = Form(None),
    parameters: Optional[str] = Form(None),
    source_equipment: str = Form(...),
    created_by_user: str = Form(...),
    photos: List[UploadFile] = File(default=[])
):
    try:
        if len(photos) > 5:
            raise HTTPException(status_code=400, detail="Můžete nahrát maximálně 5 fotografií.")

        # Pokud kód chybí, vygenerujeme unikátní
        is_new_generated = False
        if not serial_number or serial_number.strip() == "":
            date_str = datetime.now().strftime("%Y%m%d")
            short_hash = str(uuid.uuid4())[:4].upper()
            serial_number = f"END-{date_str}-{short_hash}"
            is_new_generated = True

        # Vytvoříme objekt nového dílu
        new_part = {
            "part_type": part_type,
            "serial_number": serial_number,
            "parameters": parameters or "Neuvedeno",
            "source_equipment": source_equipment,
            "created_by_user": created_by_user,
            "created_at": datetime.now().isoformat() # Automatické uložení data a času
        }

        # Přidáme díl na začátek našeho pole (databáze)
        MOCK_PARTS.insert(0, new_part)

        return {
            "status": "success",
            "message": "Díl byl úspěšně zaevidován.",
            "part": new_part
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- NOVÝ ENDPOINT: NAČTENÍ VŠECH DÍLŮ ---
@app.get("/api/parts")
def get_parts():
    return MOCK_PARTS

# ... endpointy pro správu uživatelů a rolí zůstávají stejné ...
@app.get("/api/users")
def get_users():
    return [{"username": k, "name": v["name"], "role": v["role"], "password": v["password"]} for k, v in MOCK_USERS.items()]

@app.post("/api/users")
def create_user(user: UserSchema):
    if user.username in MOCK_USERS: raise HTTPException(status_code=400, detail="Uživatel již existuje.")
    MOCK_USERS[user.username] = {"password": user.password, "role": user.role, "name": user.name}
    return {"message": "Uživatel úspěšně vytvořen"}

@app.put("/api/users/{username}")
def update_user(username: str, data: UserUpdateSchema):
    if username not in MOCK_USERS: raise HTTPException(status_code=404, detail="Nenalezen.")
    MOCK_USERS[username] = {"password": data.password, "role": data.role, "name": data.name}
    return {"message": "Aktualizováno"}

@app.get("/api/roles")
def get_roles():
    return [{"id": k, "name": v["name"], "permissions": v["permissions"]} for k, v in MOCK_ROLES.items()]

@app.post("/api/roles")
def create_role(role: RoleSchema):
    if role.id in MOCK_ROLES: raise HTTPException(status_code=400, detail="Existuje.")
    MOCK_ROLES[role.id] = {"name": role.name, "permissions": role.permissions}
    return {"message": "Vytvořeno"}

@app.put("/api/roles/{role_id}")
def update_role(role_id: str, role: RoleSchema):
    if role_id not in MOCK_ROLES: raise HTTPException(status_code=404, detail="Nenalezen.")
    MOCK_ROLES[role_id] = {"name": role.name, "permissions": role.permissions}
    return {"message": "Upraveno"}