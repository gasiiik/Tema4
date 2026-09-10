# Elektronická evidence náhradních dílů

Webová aplikace pro komplexní sledování životního cyklu náhradních dílů ve výrobním podniku. Aplikace usnadňuje evidenci, vyhledávání a správu dílů díky podpoře čárových/QR kódů a možností pořízení fotodokumentace přímo z mobilního zařízení či tabletu.

## Hlavní funkce
- **Založení dílu:** Prvotní evidence s možností nahrát fotky štítku a celého dílu.
- **Skenování kódů:** Aplikace využívá fotoaparát zařízení pro rychlé vyhledávání podle sériových čísel (v případě chybějící kamery lze kód zadat ručně).
- **Sledování historie:** Záznamy o nasazení na linku, demontáži, odeslání na externí opravu a návratu do skladu.
- **Správa rolí a oprávnění:** Systém uživatelů s odlišnými přístupy (Skladník, Údržbář, Administrátor).
- **Zabezpečená komunikace:** Frontend v lokálním prostředí běží na protokolu HTTPS, což je vyžadováno prohlížeči pro přístup k webkameře.

## Technologie
- **Backend:** Python, FastAPI, Uvicorn
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide React
- **Kontejnerizace:** Docker, Docker Compose

---

## 🚀 Jak aplikaci nainstalovat a spustit

Aplikaci můžete spustit dvěma způsoby: pomocí Dockeru (doporučeno pro snadné nasazení) nebo manuálně pro účely vývoje.

### Možnost 1: Spuštění přes Docker (Doporučeno)
Potřebujete mít nainstalovaný **Docker** a **Docker Desktop** (na Windows).

1. Otevřete terminál ve složce projektu.
2. Spusťte příkaz pro sestavení a spuštění kontejnerů na pozadí:
   ```bash
   docker compose up -d --build
   ```
3. Aplikace poběží na těchto adresách:
   - **Frontend (Klientská aplikace):** [https://localhost:5173](https://localhost:5173) *(Poznámka: Prohlížeč může hlásit nedůvěryhodný certifikát – to je v pořádku, jde o lokální vývojový certifikát pro povolení kamery, klikněte na "Pokračovat").*
   - **Backend (API dokumentace):** [http://localhost:8000/docs](http://localhost:8000/docs)

*(Pro zastavení aplikace použijte příkaz `docker compose down`)*

---

### Možnost 2: Manuální spuštění (Vývoj)

#### 1. Backend (API)
Otevřete si terminál ve složce `backend`:
```bash
cd backend
# Vytvoření a aktivace virtuálního prostředí
python -m venv .venv
.venv\Scripts\activate  # Na Linuxu/Macu: source .venv/bin/activate

# Instalace závislostí
pip install -r requirements.txt

# Spuštění serveru
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend (React)
Otevřete si *nový* terminál ve složce `frontend`:
```bash
cd frontend

# Instalace knihoven
npm install

# Spuštění vývojového serveru
npm run dev
```

---

## 🔑 Přihlašovací údaje (Výchozí testovací data)

Aplikace po spuštění obsahuje testovací uživatele pro různé role:

- **Admin:** `admin` / Heslo: `admin` *(Přístup ke všem modulům)*
- **Skladník:** `sklad` / Heslo: `sklad` *(Omezený přístup - např. příjem z opravy, odeslání na dopravu)*
- **Údržbář:** `udrzba` / Heslo: `heslo123` *(Omezený přístup - např. nasazení na linku, demontáž)*
