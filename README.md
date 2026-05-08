# GasChain 🔗⛽

**India's National Gas Distribution Operating System**

> *Every cylinder tracked. Every local producer connected. A digital twin of India's gas demand — built one transaction at a time.*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status: Pre-MVP](https://img.shields.io/badge/Status-Pre--MVP-orange.svg)]()
[![Made in Bengaluru](https://img.shields.io/badge/Made%20in-Bengaluru-blue.svg)]()

---

## The Problem

India has **300 million LPG consumers** and **no visibility** between the depot and the consumer.

- Private cylinder prices have surged to ₹3,350–4,000 due to hoarding and black-market diversion
- **₹1,200–4,770 Cr** of annual LPG subsidy leaks despite DBT reforms
- **5 million+** biogas/gobar gas units produce gas that goes nowhere — no market channel
- **Zero** national database tracking cylinder age, safety history, or consumer entitlements
- STPs across India produce thousands of tonnes of biogas daily — **most of it flared or wasted**

The shortage is not in supply. It is in visibility and accountability.

---

## The Solution

GasChain is a **unified digital platform** that connects every stakeholder in India's gas ecosystem:

```
Producers (OMCs, CBG plants, STPs)
        ↓
   Distributors (allocation + demand forecasting)
        ↓
   Agencies (QR scan + Aadhar verify)
        ↓
   Consumers (entitlement wallet + booking)
```

**Three compounding horizons:**

| Horizon | Timeline | What it does |
|---|---|---|
| Distribution OS | 0–3 years | Every cylinder tracked, anti-hoarding enforced, CBG producers onboarded |
| Demand Intelligence | 3–7 years | India's only live gas demand dataset, licensed to planners and OMCs |
| National Digital Twin | 7–20 years | Ground truth for India's gas economy — like GSTN for tax |

---

## Architecture

```
gaschain/
├── backend/
│   ├── api/              # REST API (Node.js / FastAPI)
│   ├── services/         # Business logic (entitlement, fraud, allocation)
│   └── models/           # Database schemas
├── frontend/
│   ├── consumer-app/     # React Native — consumer booking + quota
│   └── distributor-app/  # React — distributor dashboard + analytics
├── data/
│   ├── sample/           # Synthetic demo data
│   └── schemas/          # Data models and validation
├── infrastructure/       # Docker, deployment configs
├── scripts/              # Setup, seeding, utilities
└── docs/                 # Architecture, API reference, research
```

---

## Core Features

### For Consumers
- 📱 Aadhar-linked entitlement wallet
- 🗺️ Nearest OMC agency OR CBG distributor on map
- 📦 Refill booking + real-time delivery tracking
- 🔄 Digital account transfer (no office visit)
- 💸 DBT subsidy verification

### For Distributors / Agencies
- 📊 Real-time inventory dashboard
- 🔍 QR scan + Aadhar OTP verify at dispensing
- 🚨 Anomaly detection (hoarding, commercial diversion)
- 📈 Area demand forecasting
- 📋 Automated PPAC compliance reports

### For Producers (OMCs, CBG plants, STPs)
- 🏭 Allocation engine with demand forecasting
- 🌿 CBG marketplace — connect local producers to distribution chain
- 🔒 Ghost connection and duplicate Aadhar detection
- 💰 Subsidy leakage quantification
- 🌍 Geography-wise demand heatmaps

### For Government
- 🗺️ National gas digital twin — district-level, live
- 📉 Subsidy diversion tracking
- 🌱 CBG blending mandate monitoring
- 🏗️ Pipeline investment signal (demand heatmaps)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Consumer app | React Native (Android first) |
| Distributor dashboard | React + Recharts |
| API | Node.js (Express) + Python (FastAPI for ML) |
| Database | PostgreSQL (transactional) + TimescaleDB (IoT) |
| Cache | Redis |
| Event streaming | Apache Kafka |
| Auth | UIDAI Aadhar eKYC + OTP |
| Payments | UPI via NPCI |
| ML/Analytics | Python (scikit-learn, pandas) |
| Infrastructure | Docker + AWS/GCP |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/gaschain.git
cd gaschain

# Install dependencies
npm install          # Backend
pip install -r requirements.txt  # Python ML services

# Set up environment
cp .env.example .env
# Add your API keys (Aadhar sandbox, etc.)

# Seed with sample data
node scripts/seed.js

# Run development server
npm run dev
```

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

---

## Data Models (Key)

```
Consumer → Aadhar ID → Connection → Cylinder → Transaction
                                           ↓
                                    Anomaly Score
                                           ↓
                              CBG Producer → Marketplace Order
```

Full schema at [data/schemas/](data/schemas/)

---

## Roadmap

- [x] Repository structure and documentation
- [x] Data schemas and sample data
- [x] Demo dashboard (HTML prototype)
- [ ] Consumer app MVP (booking + quota)
- [ ] Agency app (QR scan + Aadhar verify)
- [ ] Distributor dashboard (inventory + anomaly alerts)
- [ ] Aadhar eKYC integration (UIDAI sandbox)
- [ ] CBG marketplace module
- [ ] ML anomaly detection model
- [ ] STP biogas aggregation module

---

## Why STP Biogas?

India's sewage treatment plants produce **10 MMT/year** of potential CBG — double the MSW potential — with:
- **Zero feedstock cost** (sewage arrives continuously, free)
- **No seasonal variation** (cities generate sewage 365 days a year)
- **PPP concession model** — municipality pays you a tipping fee AND you sell the gas commercially

Bengaluru alone has STPs treating 1,400 MLD of sewage daily. GasChain's CBG aggregator module connects STP operators directly to commercial buyers (hospitals, hotels, restaurant chains).

See [docs/STP_OPPORTUNITY.md](docs/STP_OPPORTUNITY.md) for the full analysis.

---

## Business Model

GasChain charges **producers and distributors — not consumers.**

| Stream | Model | Scale |
|---|---|---|
| Transaction fee | ₹5–15 per cylinder dispensed | ₹45–135 Cr/yr at scale |
| Distributor SaaS | ₹2,000–8,000/month | ₹24–96 Cr/yr |
| Govt / OMC data | Analytics + compliance | ₹10–50 Cr/yr |
| CBG marketplace | 2–3% of GMV | ₹15–60 Cr/yr |
| Demand intelligence | District data licensed | ₹20–80 Cr/yr |

---

## Founder

**Sobhan Mishra** — Bengaluru, Karnataka

Building GasChain as part of a group-of-companies vision: distribution platform + CBG aggregator + STP biogas processing.

Currently: Pre-incorporation, seeking government pilot partnership with MoPNG / HPCL.

---

## Contributing

This project is in pre-MVP stage. If you work in energy, LPG distribution, biogas, or government policy and want to contribute — open an issue or reach out directly.

---

## License

MIT License — see [LICENSE](LICENSE)

---

*"The most durable businesses in history are those that kept the ledger. GasChain keeps India's gas ledger."*
