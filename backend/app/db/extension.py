"""SQL for the extension officer tools: field records, escalations, knowledge list."""
from typing import Any, Optional

from app.db.database import get_pool

TZ = "Africa/Kigali"

_RECORD_COLS = """id, officer, farmer_ref, district, sector, crop, dimension, problem, advice,
                  to_char(follow_up_date, 'YYYY-MM-DD') AS follow_up_date,
                  to_char(created_at AT TIME ZONE %(tz)s, 'YYYY-MM-DD HH24:MI') AS created_at"""
_ESCALATION_COLS = """id, officer, district, sector, crop, dimension, issue, farmers_affected,
                      severity, status, response,
                      to_char(created_at AT TIME ZONE %(tz)s, 'YYYY-MM-DD HH24:MI') AS created_at,
                      to_char(updated_at AT TIME ZONE %(tz)s, 'YYYY-MM-DD HH24:MI') AS updated_at"""


def _rows(conn, sql: str, params: dict) -> list[dict[str, Any]]:
    cur = conn.execute(sql, params)
    cols = [c.name for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


# ---------- Field records ----------
def add_record(rec: dict) -> dict[str, Any]:
    with get_pool().connection() as conn:
        return _rows(conn, f"""
            INSERT INTO field_records (officer, farmer_ref, district, sector, crop, dimension,
                                       problem, advice, follow_up_date)
            VALUES (%(officer)s, %(farmer_ref)s, %(district)s, %(sector)s, %(crop)s,
                    %(dimension)s, %(problem)s, %(advice)s, %(follow_up_date)s)
            RETURNING {_RECORD_COLS}""", {**rec, "tz": TZ})[0]


def list_records(officer: Optional[str], limit: int) -> list[dict[str, Any]]:
    with get_pool().connection() as conn:
        return _rows(conn, f"""
            SELECT {_RECORD_COLS} FROM field_records
            WHERE (%(officer)s::text IS NULL OR officer = %(officer)s)
            ORDER BY created_at DESC LIMIT %(limit)s""",
                     {"officer": officer, "limit": limit, "tz": TZ})


# ---------- Escalations ----------
def add_escalation(rec: dict) -> dict[str, Any]:
    with get_pool().connection() as conn:
        return _rows(conn, f"""
            INSERT INTO escalations (officer, district, sector, crop, dimension, issue,
                                     farmers_affected, severity)
            VALUES (%(officer)s, %(district)s, %(sector)s, %(crop)s, %(dimension)s,
                    %(issue)s, %(farmers_affected)s, %(severity)s)
            RETURNING {_ESCALATION_COLS}""", {**rec, "tz": TZ})[0]


def list_escalations(officer: Optional[str], status: Optional[str],
                     limit: int) -> list[dict[str, Any]]:
    with get_pool().connection() as conn:
        return _rows(conn, f"""
            SELECT {_ESCALATION_COLS} FROM escalations
            WHERE (%(officer)s::text IS NULL OR officer = %(officer)s)
              AND (%(status)s::text IS NULL OR status = %(status)s)
            ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,
                     CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
                     created_at DESC
            LIMIT %(limit)s""",
                     {"officer": officer, "status": status, "limit": limit, "tz": TZ})


def update_escalation(escalation_id: int, status: str,
                      response: Optional[str]) -> Optional[dict[str, Any]]:
    with get_pool().connection() as conn:
        rows = _rows(conn, f"""
            UPDATE escalations
            SET status = %(status)s, response = COALESCE(%(response)s, response),
                updated_at = now()
            WHERE id = %(id)s
            RETURNING {_ESCALATION_COLS}""",
                     {"id": escalation_id, "status": status, "response": response, "tz": TZ})
    return rows[0] if rows else None


# ---------- Summary for the officer's dashboard ----------
def summary(officer: Optional[str]) -> dict[str, Any]:
    p = {"officer": officer}
    mine = "(%(officer)s::text IS NULL OR officer = %(officer)s)"
    with get_pool().connection() as conn:
        counts = _rows(conn, f"""
            SELECT
              (SELECT count(*) FROM field_records WHERE {mine}) AS records,
              (SELECT count(*) FROM field_records WHERE {mine}
                 AND created_at >= now() - interval '30 days') AS records_30d,
              (SELECT count(*) FROM field_records WHERE {mine}
                 AND follow_up_date BETWEEN current_date AND current_date + 7) AS follow_ups_7d,
              (SELECT count(*) FROM escalations WHERE {mine} AND status <> 'resolved')
                 AS open_escalations""", p)[0]
        top_problems = _rows(conn, f"""
            SELECT coalesce(dimension, 'not_detected') AS key, count(*) AS questions
            FROM field_records WHERE {mine}
            GROUP BY 1 ORDER BY 2 DESC LIMIT 8""", p)
        by_crop = _rows(conn, f"""
            SELECT coalesce(crop, 'not_detected') AS key, count(*) AS questions
            FROM field_records WHERE {mine}
            GROUP BY 1 ORDER BY 2 DESC""", p)
    return {**counts, "top_problems": top_problems, "by_crop": by_crop}


# ---------- Knowledge refresher ----------
def knowledge_documents() -> list[dict[str, Any]]:
    with get_pool().connection() as conn:
        return _rows(conn, """
            SELECT d.title, d.source, d.url, d.crop, d.language, count(c.id) AS chunks
            FROM documents d LEFT JOIN chunks c ON c.document_id = d.id
            GROUP BY d.id ORDER BY d.crop, d.title""", {})
