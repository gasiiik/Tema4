from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os

app = FastAPI(title="Evidence Náhradních Dílů API")

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

@app.post("/api/login")
def login(credentials: LoginRequest):
    if credentials.username == "udrzba" and credentials.password == "heslo123":
        return {"token": "ukazkovy-jwt-token", "role": "udrzbar", "name": "Jan Novák"}
    raise HTTPException(status_code=401, detail="Nesprávné přihlašovací údaje")

# --- NOVÝ ENDPOINT: ZALOŽENÍ DÍLU ---
# Jelikož posíláme soubory, nemůžeme použít standardní Pydantic model (JSON).
# Místo toho přijímáme data přes Form a File parametry.
@app.post("/api/parts")
async def create_part(
    part_type: str = Form(...),          # Povinné textové pole
    serial_number: str = Form(...),      # Povinné textové pole
    parameters: str = Form(None),        # Nepovinné textové pole (parametry)
    source_equipment: str = Form(...),   # Zařízení, ze kterého byl díl demontován
    created_by_user: str = Form(...),    # ID/Jméno údržbáře, který díl zakládá
    label_photo: UploadFile = File(...), # Soubor: Foto štítku
    part_photo: UploadFile = File(...)   # Soubor: Foto dílu
):
    try:
        # Zde simulujeme uložení do databáze a na disk.
        # V reálné aplikaci soubory uložíš do Docker volume nebo S3 úložiště a cesty k nim do SQL databáze.
        print(f"Zakládám díl: {part_type}, S/N: {serial_number}")
        print(f"Založil uživatel: {created_by_user} dne {datetime.now()}")
        print(f"Foto štítku: {label_photo.filename}, Velikost: {label_photo.size} bytů")
        print(f"Foto dílu: {part_photo.filename}, Velikost: {part_photo.size} bytů")
        
        # Vrátíme úspěšnou odpověď klientovi
        return {
            "status": "success",
            "message": "Díl byl úspěšně zaevidován do systému",
            "part": {
                "part_type": part_type,
                "serial_number": serial_number,
                "source_equipment": source_equipment,
                "created_at": datetime.now().isoformat(),
                "created_by": created_by_user
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při ukládání dílu: {str(e)}")