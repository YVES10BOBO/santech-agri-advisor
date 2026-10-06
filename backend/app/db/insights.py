"""Read-only statistics over request_logs for the MINAGRI/RAB insights page."""
from typing import Any

from app.db.database import get_pool

TZ = "Africa/Kigali"

# Channel of a logged question, from its flags.
_CHANNEL = """CASE WHEN 'channel:sms' = ANY(flags) THEN 'sms_ussd'
                   WHEN 'photo' = ANY(flags) THEN 'photo'
                   ELSE 'web_api' END"""


def _rows(conn, sql: str, params: dict) -> list[dict[str, Any]]:
    cur = conn.execute(sql, params)
    cols = [c.name for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def collect(days: int) -> dict[str, Any]:
    p = {"days": days, "tz": TZ}
    window = "created_at >= now() - make_interval(days => %(days)s)"
    with get_pool().connection() as conn:
        totals = _rows(conn, f"""
            SELECT count(*)                                              AS questions,
                   count(*) FILTER (WHERE created_at >= now() - interval '1 day') AS last_24h,
                   count(*) FILTER (WHERE status = 'ok')                 AS answered,
                   count(*) FILTER (WHERE language = 'rw')               AS kinyarwanda,
                   count(*) FILTER (WHERE 'photo' = ANY(flags))          AS photos,
                   count(*) FILTER (WHERE 'channel:sms' = ANY(flags))    AS sms_ussd,
                   count(*) FILTER (WHERE 'no_sources' = ANY(flags) OR status = 'fallback')
                                                                         AS without_sources,
                   round(avg(latency_ms) FILTER (WHERE status = 'ok'))::int AS avg_latency_ms
            FROM request_logs WHERE {window}""", p)[0]

        per_day = _rows(conn, f"""
            SELECT to_char(d, 'YYYY-MM-DD') AS day, count(r.id) AS questions
            FROM generate_series((now() AT TIME ZONE %(tz)s)::date - (%(days)s - 1),
                                 (now() AT TIME ZONE %(tz)s)::date, interval '1 day') AS d
            LEFT JOIN request_logs r
                   ON (r.created_at AT TIME ZONE %(tz)s)::date = d::date
            GROUP BY d ORDER BY d""", p)

        def breakdown(expr: str) -> list[dict[str, Any]]:
            return _rows(conn, f"""
                SELECT {expr} AS key, count(*) AS questions FROM request_logs
                WHERE {window} GROUP BY 1 ORDER BY 2 DESC""", p)

        by_crop = breakdown("coalesce(crop, 'not_detected')")
        by_topic = breakdown("coalesce(dimension, 'not_detected')")
        by_language = breakdown("coalesce(language, 'unknown')")
        by_channel = breakdown(_CHANNEL)

        photo_problems = _rows(conn, f"""
            SELECT substr(f, 7) AS key, count(*) AS questions
            FROM request_logs, unnest(flags) AS f
            WHERE {window} AND f LIKE 'photo:%%'
            GROUP BY 1 ORDER BY 2 DESC LIMIT 8""", p)

        gaps = _rows(conn, f"""
            SELECT question, language, crop, dimension,
                   to_char(created_at AT TIME ZONE %(tz)s, 'YYYY-MM-DD HH24:MI') AS asked_at
            FROM request_logs
            WHERE {window} AND ('no_sources' = ANY(flags) OR status = 'fallback')
              AND coalesce(dimension, '') <> 'off_topic'
            ORDER BY created_at DESC LIMIT 10""", p)

        recent = _rows(conn, f"""
            SELECT question, language, crop, dimension, {_CHANNEL} AS channel,
                   to_char(created_at AT TIME ZONE %(tz)s, 'YYYY-MM-DD HH24:MI') AS asked_at
            FROM request_logs WHERE {window}
            ORDER BY created_at DESC LIMIT 12""", p)

    return {
        "days": days, "totals": totals, "per_day": per_day, "by_crop": by_crop,
        "by_topic": by_topic, "by_language": by_language, "by_channel": by_channel,
        "photo_problems": photo_problems, "knowledge_gaps": gaps, "recent": recent,
    }
