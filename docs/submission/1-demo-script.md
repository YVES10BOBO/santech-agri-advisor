# Demo video script: 15 minutes maximum

**Product:** Umujyanama w'Ubuhinzi, by SAN TECH
**Live:** https://santech-agri-advisor.vercel.app · **API:** https://santech-agri-api.onrender.com
Follows C4IR's 7-part demo order. Times are targets; stay under 15:00 in total.

## Before you press record (15 min)
- [ ] Open `https://santech-agri-api.onrender.com/health` and wait for `"ready": true` (wakes the free server)
- [ ] Ask one warm-up question in the chat (the first answer after a pause is slow)
- [ ] Log in at `/login` with the **officer** account, then on `/extension` save 2–3 field records and 1 escalation (so dashboards are not empty)
- [ ] On `/farmer`, fill in a farm: Musanze · 0.3 ha · Irish potato · no irrigation · has livestock
- [ ] Open these tabs in order: chat · farmer · extension · insights · API `/docs` · Africa's Talking USSD simulator · GitHub repo
- [ ] Have `docs/demo-photos/maize_faw.jpg` ready to upload
- [ ] Microphone test; browser zoom 110–125% so text is readable; close other notifications
- [ ] Recording tool: OBS Studio or the Windows Game Bar (Win+Alt+R)
- [ ] **Recording on localhost is also fine** (same code, answers about 11 s instead of 20–40 s on the free server). Say which one you use.

---

## 1. Introduction (0:00–2:00)
**Screen:** chat welcome page (live link visible in the address bar)

**Say:**
> "Hello, I am [Your name], [your role] at SAN TECH. This is Umujyanama w'Ubuhinzi, a Kinyarwanda-first AI advisor for smallholder farmers growing maize, beans and Irish potatoes.
>
> The problem is reach. Only about 35% of Rwanda's 3.4 million farmers are reached by extension agents, and about 3 in 10 calls to the agricultural call centre are answered. Where advice does arrive, it is often generic, and what farmers struggle with does not reach MINAGRI and RAB in real time.
>
> Our answer is one AI 'brain' behind a secure API. Every channel uses it: this web chat, USSD and SMS for basic phones, voice, and photos. It serves the three user groups C4IR described: farmers first, extension officers, and MINAGRI and RAB.
>
> Everything you will see is the real, working product, live at santech-agri-advisor.vercel.app."

---

## 2. Live workflow (2:00–5:00)
**Screen:** chat

1. Click a crop starter question (e.g. maize), or type:
   `Nshobora gutera ibigori ryari muri iki gihembwe?`
   **Say:** "The farmer asks in Kinyarwanda. The answer is short, step by step, and fits Season A, which the system knows from today's date."
2. Point at the **sources** under the answer: "Every answer shows the RAB, CGIAR or FAO documents it used."
3. Show C4IR's other use cases with two quick questions (no need to read the whole answers):
   - Weather: `Imvura yatinze, nkore iki ku bishyimbo byanjye?` (Rain is late: what do I do for my beans?)
   - Inputs and market: from the **farmer page**, click *"Ni hehe nabona imbuto nziza n'ifumbire…?"*
   **Say:** "It covers C4IR's four use cases: crop advice, pests and diseases, weather and climate, and inputs and market access. Live weather alerts and market prices come next, from data partners."
4. Click **Umva igisubizo** (listen): "Farmers who prefer listening can hear the answer in a Kinyarwanda voice."
5. **USSD** (switch to the Africa's Talking simulator tab):
   dial `*384*74619#` → choose Kinyarwanda → type a question → the answer arrives by SMS.
   **Say:** "Many farmers use basic phones and weak networks, so the same brain answers through USSD and SMS, which work without internet. That is our offline-tolerant channel. This is the Africa's Talking sandbox; production needs a registered short code."

---

## 3. Kinyarwanda handling, context extraction and grounded response (5:00–8:00)
**Screen:** chat, then the farmer page

1. Ask: `Nakoresha ifumbire ingana iki ku birayi?`
2. Under the answer, point at the chips: **crop = potato, topic = fertilizer & inputs**.
   **Say:** "The system detects the language, the crop and which of C4IR's eight advisory topics the question belongs to: fertilizer and inputs, seeds and planting, pests and diseases, weeds, soil and water, post-harvest, weather, and government programs. The Kinyarwanda question is also translated and searched in English, so Kinyarwanda speakers get the same documents as English speakers."
3. Follow-up: `Nayishyira ryari?` (When should I apply it?)
   **Say:** "Follow-up questions keep the context: it still knows we are talking about potato fertilizer."
4. Ask the same first question in English: `How much fertilizer should I use on potatoes?`
   **Say:** "The benchmark asks the same question in both languages. The answers agree."
5. Go to **/farmer** (Umurima wanjye) and show the saved farm, then go back to the chat and ask again.
   **Say:** "A farmer can tell us their district, farm size and what they have. Answers then fit their farm, for example quantities for 0.3 hectare, and manure because they keep livestock. This answers two of C4IR's scoring criteria: constraint adherence, and relevance to the farmer's conditions. The profile stays on the phone; we never ask for a name or phone number."
6. Press the **microphone** and ask a question by voice:
   **Say:** "Voice in, in Kinyarwanda, is the optional Layer 2. The farmer sees the transcript before sending, to correct mistakes."

**Safety point to say:** "If a farmer asks about chemicals, the answer always adds protective equipment and the label instructions, and when the documents do not contain a number, the system says so and refers the farmer to the sector agronomist instead of inventing one."

---

## 4. Pest, disease and image workflow (8:00–10:00)
**Screen:** chat

1. Click the **camera**, upload `maize_faw.jpg`, send without text.
2. Show the diagnosis card (likely problem, confidence, symptoms) and the grounded advice.
   **Say:** "A farmer, or an extension officer wanting a second opinion, sends a photo. The vision model names the likely pest or disease with a confidence level and the symptoms it saw, then the normal grounded answer gives what to do. It is a likely diagnosis, not a certainty, so the answer says to confirm with the agronomist."
3. **Say:** "The photo itself is not stored. Only the diagnosis is logged, so MINAGRI and RAB can see which pests are appearing where." (Photo credit: Wikimedia Commons.)

---

## 5. API and benchmark integration (10:00–12:00)
**Screen:** `https://santech-agri-api.onrender.com/docs`

1. Show `GET /health` → **Say:** "C4IR's readiness check before each run."
2. Show `GET /version` → "Model, embedding model and prompt version."
3. Show `POST /ask` (try it out, or show a saved response) and point at `model`, `prompt_version`, `latency_ms`, `session_id`.
   **Say:** "Every answer records which version answered and how fast, so every score ties to an exact version. `session_id` handles follow-up questions. The API is protected by a key."
4. Show `/transcribe` and `/speak`: "The optional voice layer, audio in and audio out."
5. **Say:** "Our prompt is built on C4IR's nine scoring criteria: safety, accuracy, completeness, conciseness, reasoning and sequencing, constraint adherence, actionability, simplicity, and relevance to the farmer's conditions."
6. **Say:** "For the two benchmark runs: we already test ourselves with 50 questions, 3 crops times 8 topics, in both languages, with an English-versus-Kinyarwanda scorecard. When C4IR opens its local data (crop registry, soil data, pest registry, QA pairs), we add it to the knowledge base with one ingestion script, without changing code, and re-run the same test to measure the improvement."

---

## 6. Rwanda hosting, security, modularity and data governance (12:00–14:00)
**Screen:** architecture diagram (docs/architecture.md) or the GitHub repo

**Say:**
> "Security: the API requires a key; USSD and SMS callbacks require a secret token; secrets live only in server settings, never in the code.
>
> Data protection, Law 058 of 2021: we do not store farmers' phone numbers. SMS conversations use a pseudonymous ID. Photos are not stored. Extension officers refer to farmers by a code, and the system refuses phone numbers. Dashboards show no names.
>
> Modularity: the language model is swappable. Any compatible model, including an open model hosted in Rwanda, works by changing one setting. The database is standard PostgreSQL. The brain, the channels and the dashboards are separate parts.
>
> Hosting, honestly: today the pilot runs on cloud services, with the database in the EU and the model from Google. For production we will move the database and application to a Rwanda-based data centre, and run the model on Rwanda-hosted or approved infrastructure. No C4IR data will be processed on free consumer tiers."

---

## 7. Operational readiness, scalability and benchmark refinement (14:00–15:00)
**Screen:** `/extension`, then `/insights`

1. `/extension` (logged in as the officer): "Extension officers and MINAGRI/RAB log in; farmers never need an account. Extension officers record field visits, refresh their knowledge, get a photo second opinion, and escalate recurring problems."
2. Log out, log in as **rab**, open `/insights`: "MINAGRI and RAB see what farmers ask, by crop, topic, language and channel; pests found in photos; officers' escalations, which they can answer and resolve; and **knowledge gaps**: questions with no matching document, which tell RAB what guidance to write next. This is the feedback loop C4IR asked for."
3. **Close:**
> "Operationally: health checks, request logs, backup models when one is overloaded, and an answer even if document search fails. The API is stateless, so it scales by adding instances.
>
>
> We are also ready for C4IR's lightweight A/B tests with small groups of real farmers on our existing channels: every answer is logged with its version, so two versions can be compared.
>
> Next: ingest C4IR's data, run the benchmark, and refine weak answers with agronomists and native speakers. Thank you. Murakoze."

---

## If something fails while recording
- Slow answer: keep talking about what the system is doing; cut the wait in editing.
- An error: say "the free hosting tier is waking up", wait, and retry. Or record that part on localhost.
- Don't claim anything the screen does not show.
