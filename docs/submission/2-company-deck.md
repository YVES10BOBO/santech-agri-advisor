# SAN TECH company profile deck (10 slides)

> Text in **[brackets]** is information to fill in from the company. Remove the brackets when done.
> C4IR asks for 3 things in this deck: **institutional overview**, **alignment with the vision**, **track record with links**.

---

## Slide 1: Title
**SAN TECH**
**Umujyanama w'Ubuhinzi:** Kinyarwanda-first AI advisory for Rwanda's farmers

EOI: AI-Enabled Agricultural Advisory Solution Partner · C4IR / Rwanda AI Scaling Hub · October 2026

[SAN TECH logo]
[Contact person name] · [email] · [phone] · [website]

---

## Slide 2: Who we are (institutional overview)
- **SAN TECH** [Ltd / full legal name], founded in **[year]**, based in **[Kigali, Rwanda]**
- Company registration (RDB): **[registration number]**
- **What we do:** [one sentence, e.g. "We build software and AI solutions for Rwandan institutions and businesses"]
- **Focus areas:** [e.g. AI and data · web and mobile applications · digital public services]
- **Team:** [number] people · [number] engineers
- **Mission:** [e.g. "Technology that works for every Rwandan, in Kinyarwanda, on any phone"]
- Applying **alone** (not as a consortium)

---

## Slide 3: Our team
| Name | Role | Relevant skills |
|---|---|---|
| [Name] | Software developer, lead engineer for this product | Python/FastAPI, AI retrieval (RAG), Next.js, USSD/SMS integration |
| [Name] | [CEO / Managing Director] | [business, partnerships] |
| [Name] | [Role] | [skills] |
| [Name] | [Agronomist / advisor, if any] | [crop expertise, RAB experience] |

**Planned for the project:** an agronomist reviewer and a Kinyarwanda language reviewer, to validate answers and wording. [Names or partner organisations, if known]

---

## Slide 4: The problem we solve
- **35%** of 3.4 million farmers are reached by 16,654 extension agents
- **3 in 10** calls to the agricultural call centre are answered
- Where extension reaches, it works: **+38%** yields with Twigire Muhinzi
- But advice is **generic** and **not personalised**, and there is **no feedback loop** to MINAGRI and RAB

**Our goal:** every farmer gets timely, safe advice in Kinyarwanda, on the phone they already own, and their real questions reach the people who set policy.

*(Figures: C4IR info session, 1 October 2026)*

---

## Slide 5: Our solution, live today
**One AI brain behind a secure API, used by every channel.**

| For | What works today |
|---|---|
| **Farmers** | Web chat in Kinyarwanda and English · voice in and out · photo of a sick plant · USSD and SMS for basic phones · "My farm" profile for personalised advice |
| **Extension officers** | Digital field records · photo second opinion · knowledge refresher · escalation of recurring issues |
| **MINAGRI and RAB** | Live dashboard: what farmers ask, trends, pests seen in photos, knowledge gaps, escalations they can answer |

**Live:** https://santech-agri-advisor.vercel.app
**API:** https://santech-agri-api.onrender.com/docs

---

## Slide 6: How it works
1. **Understands Kinyarwanda:** detects the language, crop, season and which of the 8 advisory topics a question belongs to; uses a Kinyarwanda agricultural glossary
2. **Grounded answers:** searches 17 Rwanda-focused documents (RAB, MINAGRI, CGIAR, CIP, FAO, CIAT) in both Kinyarwanda and English, and shows its sources
3. **Built on the 9 scoring criteria:** safe, accurate, complete, concise, well sequenced, within the farmer's means, actionable, simple, relevant to the farm
4. **Safety guardrails:** protective-equipment and label warnings for chemicals; no invented doses; referral to the sector agronomist
5. **Reliable:** backup models, an answer even when search fails, health checks, versioned logs

*Visual: architecture diagram (docs/architecture.md)*

---

## Slide 7: Alignment with C4IR's vision
| C4IR asks for | SAN TECH today |
|---|---|
| Conversational AI in Kinyarwanda | Yes: Kinyarwanda-first, tested side by side with English |
| Strong voice (optional Layer 2) | Yes: Kinyarwanda speech-to-text and text-to-speech |
| Image-based pest identification | Yes: photo diagnosis with confidence level |
| Multi-channel delivery | Web, USSD, SMS today · WhatsApp and IVR planned |
| Crop, pest, weather, inputs and market | Crops and pests: strong · weather, inputs and market: answered from documents; live data planned |
| Serves farmers, extension and MINAGRI/RAB | Yes: a working dashboard for each group |
| Compliant with Rwanda's data law | No phone numbers, names or photos stored · Rwanda hosting planned for production |
| Open source preferred | [Open source under (licence) / Code available to C4IR on request] |
| Offline-tolerant | USSD and SMS work without internet; offline mobile app planned |

---

## Slide 8: Ready for the benchmark
- **Secure API:** ask questions (follow-ups included), readiness check (`/health`), version and speed on every answer (`/version`, `latency_ms`), optional voice endpoints
- **We already benchmark ourselves:** 50 questions (3 crops × 8 topics, English + Kinyarwanda) with an English-vs-Kinyarwanda scorecard
- **Built to improve with local data:** C4IR's crop registry, soil data, pest registry and QA pairs go into the knowledge base with one script, without code changes. This is how we will maximise **Δ = Final − Baseline**
- **Model-independent:** we pick the model on measured Kinyarwanda quality, and can switch to a model hosted in Rwanda

---

## Slide 9: Track record
**Previous work**
- [Project 1: client, what we built, year, number of users] · [link]
- [Project 2: client, what we built, year] · [link]
- [Project 3] · [link]

**Partners and clients:** [names / logos]

**Delivered at scale:** [e.g. "X users", "deployed in Y districts"; leave out if not available]

**This product:** built and deployed for this EOI, live and testable now
- Live product: https://santech-agri-advisor.vercel.app
- Code: [https://github.com/YVES10BOBO/santech-agri-advisor, if made public]

---

## Slide 10: Our commitment and next steps
**If shortlisted (from 9 October):**
1. Onboarding: give C4IR API access and sign the data sharing agreement
2. Baseline benchmark on our current solution
3. Augmentation: ingest C4IR's local data; agronomist and native-speaker review
4. Final evaluation: measure and report our improvement (Δ)

**For production (RFP stage):** hosting and data in Rwanda · logins and roles for officers and agencies · WhatsApp and IVR · weather alerts · input and market data · offline mobile app for extension officers

**Contact:** [Name] · [email] · [phone] · [website]

**Murakoze.**
