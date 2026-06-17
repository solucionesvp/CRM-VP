import time, json, urllib.request, os
from dotenv import load_dotenv
load_dotenv(".env")

phone = f"5299911122{int(time.time()) % 100:02d}"

def post_webhook(mid, text):
    payload = json.dumps({
        "event": "messages.upsert",
        "data": {
            "key": {"fromMe": False, "remoteJid": f"{phone}@s.whatsapp.net", "id": mid},
            "pushName": "María",
            "message": {"conversation": text}
        }
    }).encode()
    req = urllib.request.Request(
        "http://localhost:8000/api/v1/bot/webhook",
        data=payload, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        return r.status, json.loads(r.read())

print("=== 3 fragmentos rapidos ===")
ts = int(time.time())
for mid, text in [(f"td1_{ts}", "hola"), (f"td2_{ts}", "busco una bomba sumergible"), (f"td3_{ts}", "para cisterna de 10000L")]:
    status, body = post_webhook(mid, text)
    print(f"  [{mid}] '{text}' -> {status} {body}")
    time.sleep(0.3)

print("\n=== Esperando 15s para que dispare el timer y procese ===")
time.sleep(15)

from sqlalchemy import create_engine, text
engine = create_engine(os.getenv("DATABASE_URL", "").replace("postgres://", "postgresql://", 1))
with engine.connect() as c:
    rows = c.execute(text("""
        SELECT m.sender_type, LEFT(m.content, 90) AS content
        FROM messages m JOIN conversations v ON v.id = m.conversation_id
        WHERE v.channel_identifier = :ph AND m.direction = 'outbound'
        ORDER BY m.created_at
    """), {"ph": phone}).fetchall()
    print(f"\n=== {len(rows)} mensaje(s) outbound (esperado: 1) ===")
    for r in rows:
        print(f"  {dict(r._mapping)}")

    row = c.execute(text("""
        SELECT ctx.collected_data, ctx.current_intent
        FROM conversation_contexts ctx JOIN conversations v ON v.id = ctx.conversation_id
        WHERE v.channel_identifier = :ph
    """), {"ph": phone}).fetchone()
    if row:
        print(f"\n=== collected_data ===\n  intent={row[1]} data={row[0]}")
        ciudad = (row[0] or {}).get("ciudad")
        print(f"  ciudad: {repr(ciudad)} -- {'CORRECTO (vacio)' if not ciudad else 'REVISAR'}")
