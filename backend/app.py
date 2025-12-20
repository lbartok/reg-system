import os
import json
import psycopg2
from psycopg2.extras import Json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_HOST = os.getenv('POSTGRES_HOST', 'db')
DB_PORT = int(os.getenv('POSTGRES_PORT', 5432))
DB_NAME = os.getenv('POSTGRES_DB', 'orders')
DB_USER = os.getenv('POSTGRES_USER', 'postgres')
DB_PASS = os.getenv('POSTGRES_PASSWORD', 'postgres')


def get_conn():
    return psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS)


def init_db():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    payload JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT now()
                );
                '''
            )
            conn.commit()


@app.before_first_request
def startup():
    init_db()


@app.get('/')
def ping():
    return jsonify({'status': 'ok', 'service': 'backend'}), 200


@app.post('/orders')
def create_order():
    try:
        payload = request.get_json(force=True)
        if not payload:
            return jsonify({'error': 'empty payload'}), 400

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('INSERT INTO orders (payload) VALUES (%s) RETURNING id;', (Json(payload),))
                new_id = cur.fetchone()[0]
                conn.commit()

        return jsonify({'status': 'saved', 'id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.get('/orders')
def list_orders():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT id, payload, created_at FROM orders ORDER BY id DESC LIMIT 100;')
            rows = cur.fetchall()
            results = [{'id': r[0], 'payload': r[1], 'created_at': r[2].isoformat()} for r in rows]
    return jsonify(results)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
