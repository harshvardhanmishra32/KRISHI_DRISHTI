# 🛡️ Krishi Drishti (कृषि दृष्टि) - Security Architecture & Hardening Guide (P22)

This document details the security posture, threat mitigation strategies, and defensive controls implemented across Krishi Drishti to protect farmer privacy, application integrity, and agricultural advisory accuracy.

---

## 1. Threat Mitigation Matrix

| Security Risk | What Could Go Wrong | What Krishi Drishti Did About It |
| :--- | :--- | :--- |
| **Authentication & Brute Force** | Attackers execute credential stuffing or dictionary attacks against farmer phone numbers. | Enforced sliding-window rate limiting on `/auth/login` (maximum 5 attempts per minute per IP). Enforced bcrypt salted password hashing with minimum complexity rules. Passwords never logged. |
| **JWT Token Hijacking & Weak Keys** | Weak or short JWT secrets allow offline cracking and forged authentication claims. | Strict validation in `core/config.py`: minimum 32-character high-entropy secret requirement. Access tokens expire automatically after 24 hours. |
| **Malicious File Uploads & RCE** | Attackers upload shell scripts, executable binaries, or disguised malware via image upload endpoints. | Strict three-layer upload verification in `services/upload_service.py`: 1) Strict byte limit (5 MB); 2) True content inspection with Pillow (only real JPEG, PNG, WebP decoded); 3) Complete re-encoding and resizing to 1280px, stripping malicious metadata. Files stored under randomized UUID filenames, never original user names. |
| **Farmer Privacy & Geolocation Leaks** | Precise GPS coordinates of farmer fields and homes exposed to adversaries, commercial competitors, or predatory lenders. | Automatic EXIF GPS metadata stripping on every uploaded leaf image. For epidemiology outbreak alerts (`/outbreaks`), centroids are rounded to 2 decimal places (~1.1 km radius), and farmer names/phones are strictly excluded from all public and API responses. |
| **SQL Injection** | Attacker injects malicious SQL statements through filter queries, search bars, or URL parameters. | 100% of database queries utilize SQLAlchemy 2.0 ORM parameterized statements and type-annotated Mapped columns. Zero string concatenation or raw format strings in database queries. |
| **Agrochemical Hallucination & Poisoning** | Generative AI invents dangerous pesticide doses, non-existent chemical brands, or toxic mixing ratios. | Hardened Guardrail Explainer in `services/explainer.py`: Strict validator ensures LLMs can ONLY use verified chemical compounds already stored in the seed database. Fallback `TemplateExplainer` ensures zero-hallucination. Every recommendation mandatorily includes: *"Confirm dose with local agriculture officer or Krishi Vigyan Kendra"*. |
| **DDoS & Large Payload Denial of Service** | Volumetric requests or massive request bodies exhaust backend RAM or disk space. | Global HTTP middleware rejects request bodies exceeding 10 MB with HTTP 413. Rate limits enforced on resource-intensive endpoints (uploads: 20/min, voice: 10/min). |
| **Cross-Origin & Injection Attacks** | Malicious websites make unauthorized cross-origin requests or iframe clickjacking attacks. | Strict CORS allowlists (`settings.CORS_ORIGINS`). Standard HTTP Security Headers injected on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security: max-age=31536000`. |
| **Information Disclosure via Stack Traces** | Unhandled exceptions leak database internals, environment variable names, or file paths. | Centralized FastAPI exception handlers (`core/errors.py`) catch all standard and unhandled exceptions, returning a clean, uniform JSON schema (`{"error": {"code": "...", "message": "..."}}`) without stack traces in production. |
| **Epidemiology False Alarms** | A single disgruntled individual repeatedly uploads fake diseased photos to trigger regional panic or price manipulation. | Outbreak detection service (`services/outbreak.py`) requires a minimum of 3 distinct authenticated farmers before clustering reports via DBSCAN into an active outbreak alert. |

---

## 2. Secure Configuration Checklist

- [x] **Environment Secrets**: All sensitive keys (`SECRET_KEY`, `OPENWEATHER_API_KEY`, `POSTGRES_PASSWORD`) managed via `.env` and excluded from Git via `.gitignore`.
- [x] **Rate Limiting**: Sliding window backed by Redis with in-memory fallback.
- [x] **Input Validation**: Strict Pydantic v2 schemas with bound validation (e.g. pH strictly between 3.5 and 9.5; monetary amounts strictly $> 0$).
- [x] **Authorization Boundaries**: Farmers can only access their own farms, reports, and expenses. Administrative endpoints (`/admin/disease-stats`, `/admin/run-outbreak-check`) strictly enforced with `require_role("officer", "admin")`.
