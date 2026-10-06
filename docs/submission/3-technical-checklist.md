# Technical fit checklist: SAN TECH

> If C4IR's template has its own list of statements, copy these answers into that template.
> Text in **[brackets]** is to be confirmed by SAN TECH management.

## A. Access to our solution for the benchmark
| Statement | Answer | Evidence |
|---|---|---|
| Our solution is available behind one secure API endpoint | **Yes** | `POST /ask`, protected by an `X-API-Key` header. Docs: https://santech-agri-api.onrender.com/docs |
| It answers farmer questions in English and Kinyarwanda, including follow-ups | **Yes** | `language` is detected or set; `session_id` keeps the conversation for follow-up questions |
| It provides a readiness check | **Yes** | `GET /health` returns `ready: true/false` and the database status |
| It records which version answered, and how fast | **Yes** | Each answer returns `model`, `system_version`, `prompt_version` and `latency_ms`; `GET /version`; every request is logged |
| Voice (optional): Kinyarwanda audio or text in, audio or text out | **Yes** | `POST /transcribe` (speech-to-text) and `POST /speak` (text-to-speech) |
| The model and harness (prompts, retrieval, knowledge base, guardrails, orchestration) are all behind the API | **Yes** | Channel front-ends (web, USSD, SMS) call the same API |
| We can take part in onboarding on 9–14 October | **[Yes]** | Contact: [name, email, phone] |
| We can add C4IR's local data for the final evaluation | **Yes** | Documents and data are added with `scripts/ingest.py`, without code changes; then the same tests are re-run |

## B. Hosting and data in Rwanda
| Statement | Answer | Evidence |
|---|---|---|
| Today's pilot hosting | **Cloud pilot** | Application: Vercel and Render. Database: Supabase PostgreSQL (EU, Ireland). Language model: Google Gemini API |
| We will host the solution and data in Rwanda for production | **Yes, committed** | Standard PostgreSQL and a stateless Python API: they move to a Rwanda-based data centre ([provider to be confirmed]) without code changes |
| We can use a model hosted in Rwanda or an approved provider | **Yes** | The model is set by configuration (`LLM_BASE_URL`, `LLM_MODEL`); any OpenAI-compatible endpoint, including a self-hosted open model, works |
| C4IR data will not be processed on free consumer tiers | **Yes, committed** | Free tiers are used only for this public pilot with test data |
| Compliance with Law No. 058/2021 on personal data protection | **Yes, by design** | No farmer phone numbers stored (pseudonymous ID for SMS); photos not stored; no names on dashboards; officer records refuse phone and ID numbers; database tables locked from public access (row-level security) |
| We will sign C4IR's data sharing agreement | **[Yes]** | |

## C. Openness, documentation and transfer
| Statement | Answer | Evidence |
|---|---|---|
| Source code is open or available to C4IR | **[Open source under (licence) / Available to C4IR on request]** | https://github.com/YVES10BOBO/santech-agri-advisor [public or private] |
| Built with open-source technology | **Yes** | Python, FastAPI, PostgreSQL, pgvector, Next.js; the model provider is swappable |
| Documentation | **Yes** | README (setup and what was built), `docs/api.md` (all endpoints), `docs/architecture.md` (design, security, roadmap), interactive `/docs` |
| Automated tests | **Yes** | 28 automated tests; a 50-question bilingual benchmark script with a scorecard |
| Knowledge transfer to C4IR and government teams | **Yes** | [Handover sessions, training for engineers, documentation in English and Kinyarwanda] |
| Ownership and IP | **To be agreed at the RFP stage**, as stated by C4IR | |

## Known limits (stated openly)
- Kinyarwanda wording and agronomic numbers still need review by a native speaker and an agronomist before production.
- Pilot hosting is outside Rwanda (see B).
- Logins and roles for dashboards, WhatsApp, IVR, weather alerts and live input and market data are on the roadmap.
