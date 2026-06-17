import sys, os
from dotenv import load_dotenv
load_dotenv('.env')
from sqlalchemy import create_engine, text

phone = sys.argv[1] if len(sys.argv) > 1 else '529998887766'
engine = create_engine(os.getenv('DATABASE_URL').replace('postgres://', 'postgresql://', 1))

with engine.connect() as c:
    ctx = c.execute(text("""
        SELECT v.channel_identifier, ctx.current_intent, ctx.collected_data, ctx.handoff_to_human
        FROM conversation_contexts ctx
        JOIN conversations v ON v.id = ctx.conversation_id
        WHERE v.channel_identifier = :phone
    """), {"phone": phone}).fetchone()
    print('Contexto:', dict(ctx._mapping) if ctx else 'no row')

    msgs = c.execute(text("""
        SELECT sender_type, content FROM messages m
        JOIN conversations v ON v.id = m.conversation_id
        WHERE v.channel_identifier = :phone AND m.direction = 'outbound'
        ORDER BY m.created_at DESC LIMIT 3
    """), {"phone": phone}).fetchall()
    print('Respuestas del bot:')
    for m in msgs:
        print(' -', dict(m._mapping))
