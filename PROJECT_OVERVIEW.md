# Fraud Detection System - Project Overview

## 🎯 Project Summary

A production-ready **fraud detection and transaction monitoring system** built with:
- **Backend**: Node.js + Express.js
- **Database**: CognoDB (Neo4j-compatible graph database)
- **Frontend**: Vanilla JavaScript + React (partial)
- **Query Language**: Cypher

This project demonstrates why **graph databases excel at detecting fraud patterns** that would be difficult or extremely slow in relational databases.

## 📁 Project Structure

```
fraud-detection-graph/
│
├── 📄 README.md                 # Quick start & feature overview
├── 📄 SETUP.md                  # Step-by-step setup guide
├── 📄 SCHEMA.md                 # Graph schema & data model
├── 📄 CYPHER_REFERENCE.md       # Cypher query examples
├── 📄 PROJECT_OVERVIEW.md       # This file
├── 📄 package.json              # Root-level script aliases
├── 📄 .gitignore                # Git ignore rules
│
├── 📁 backend/                  # Node.js API Server
│   ├── 📄 package.json          # Dependencies (express, neo4j-driver, etc)
│   ├── 📄 server.js             # Express API with Cypher queries
│   ├── 📄 db.js                 # Database connection setup
│   ├── 📄 .env.example          # Environment template
│   │
│   └── 📁 scripts/
│       └── 📄 seed.js           # Initialize sample fraud data
│
└── 📁 public/                   # Frontend Dashboard
    └── 📄 index.html            # Vanilla JS + React interactive UI
```

## 🔄 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Browser)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  index.html - Interactive Fraud Detection Dashboard  │  │
│  │  - High Risk Users card                              │  │
│  │  - Money Mules Detection                             │  │
│  │  - Suspicious Rings (Circular Flows)                 │  │
│  │  - High-Value Transactions                           │  │
│  │  - Graph Statistics                                  │  │
│  │  - Quick Actions                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓ (Fetch API)                      │
└─────────────────────────────────────────────────────────────┘

         HTTP Requests (Port 3000)
         ↓                    ↑
    /api/users           JSON Response
    /api/money-mules
    /api/suspicious-rings
    /api/high-risk-transactions
    /api/transaction-paths
    /api/health

┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  server.js - Express API Server                       │  │
│  │  - Routes for each fraud detection query              │  │
│  │  - Cypher query execution                             │  │
│  │  - Response formatting                                │  │
│  │  - Error handling                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  db.js - Database Connection                          │  │
│  │  - Neo4j driver initialization                        │  │
│  │  - Connection pooling                                 │  │
│  │  - Session management                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓ (Bolt Protocol)                  │
└─────────────────────────────────────────────────────────────┘

    bolt+s://instance-id.databases.cognodb.cloud
    ↓

┌─────────────────────────────────────────────────────────────┐
│                  CognoDB Cloud Instance                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Graph Database                                       │  │
│  │  - User nodes (legitimate & suspicious)              │  │
│  │  - Transaction nodes                                  │  │
│  │  - Merchant nodes                                     │  │
│  │  - SENT_TO relationships (transaction flows)         │  │
│  │  - RECEIVED_FROM relationships (reverse)             │  │
│  │  - MADE_TRANSACTION relationships                    │  │
│  │  - TO_USER relationships                             │  │
│  └───────────────────────────────────────────────────────┘  │
│  Pattern Detection Engine:                                   │
│  ✓ Circular transaction rings (3+ hops)                    │
│  ✓ Money mule networks (high degree nodes)               │
│  ✓ Transaction paths (variable-length)                    │
│  ✓ Risk scoring (propagation analysis)                    │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start (TL;DR)

```bash
# 1. Set up CognoDB (free account at console.cognodb.com)
# 2. Save credentials to backend/.env

cd fraud-detection-graph
npm install-all      # Install all dependencies
npm run seed         # Load sample fraud data
npm start            # Start backend server

# 3. Open dashboard in browser
file:///path/to/public/index.html
```

## 📊 Fraud Detection Patterns

### 1. **Circular Transaction Rings** 🔄
**What**: A → B → C → A (money comes back to original user)
**Why Suspicious**: Classic money laundering pattern
**Graph Query**: Single cycle detection traversal
**SQL Alternative**: 3 self-joins (extremely expensive)

### 2. **Money Mule Networks** 💰
**What**: User receives from many sources, sends to many destinations
**Why Suspicious**: Intermediary (mule) handling stolen funds
**Indicator**: High in-degree + high out-degree
**Graph Query**: Count connected edges (O(1) per node)
**SQL Alternative**: Complex GROUP BY with HAVING clauses

### 3. **High-Value Transaction Chains** 💳
**What**: Large amounts flowing through linked users
**Why Suspicious**: Structured payment to avoid detection
**Graph Query**: Follow flagged transactions through paths
**SQL Alternative**: Multiple JOINs and filtering

### 4. **Transaction Path Analysis** 🛣️
**What**: Find indirect connections between users
**Why Suspicious**: Hidden relationships in layering phase
**Graph Query**: Variable-length path traversal
**SQL Alternative**: Recursive CTEs or stored procedures

### 5. **Bidirectional Transfers** ↔️
**What**: Similar amounts moving back and forth
**Why Suspicious**: Structuring or reversing fraudulent activity
**Graph Query**: Match pairs with bidirectional edges
**SQL Alternative**: Self-join with filtering

## 🔑 Key Features

### Backend API (`server.js`)
| Endpoint | Query | Purpose |
|----------|-------|---------|
| GET `/api/users` | Match all users | List suspicious users by risk score |
| GET `/api/money-mules` | Degree centrality | Find intermediary suspects |
| GET `/api/suspicious-rings` | Cycle detection | Detect circular flows |
| GET `/api/high-risk-transactions` | Edge filtering | Show large/flagged transactions |
| GET `/api/transaction-paths/:from/:to` | Shortest path | Find connections between users |

### Frontend Dashboard
- **📊 Real-time Data**: Auto-refreshes every 30 seconds
- **🎨 Interactive UI**: Click cards for details
- **📱 Responsive Design**: Works on desktop and mobile
- **🚨 Risk Visualization**: Color-coded risk badges
- **⚡ Fast Loading**: Skeleton screens and spinners
- **🔄 Network Status**: Built-in health checks

## 📈 Sample Data

### Legitimate Users (5)
- Alice Johnson (U001) - Risk: 20%
- Bob Smith (U002) - Risk: 10%
- Charlie Brown (U003) - Risk: 15%
- Diana Prince (U004) - Risk: 5%
- Eve Wilson (U005) - Risk: 30%

### Suspicious Users (5)
- Frank Castle (U101) - Risk: 85% 🚩
- Grace Hopper (U102) - Risk: 78% 🚩
- Henry Ford (U103) - Risk: 92% 🚩
- Iris West (U104) - Risk: 88% 🚩
- Jack Sparrow (U105) - Risk: 95% 🚩

### Fraud Patterns Pre-Loaded
1. **Circular Ring**: U101 → U102 → U103 → U101 (each $14k-15k)
2. **Money Mule**: U101 receives from U001/U005, sends to U104/U105
3. **High-Value Flow**: Multiple transactions >$10k, flagged for review

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js 14+
- **Framework**: Express.js 4.18
- **Database Driver**: neo4j-driver 5.14
- **Query Language**: Cypher
- **Environment**: dotenv for config

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with gradients & flexbox
- **JavaScript (ES6+)**: Vanilla JS for API calls
- **Async**: Fetch API with error handling
- **Responsive**: Mobile-first design

### Infrastructure
- **Database**: CognoDB Cloud (Neo4j-compatible)
- **Hosting Ready**: Can deploy to Heroku, Vercel, AWS Lambda
- **CORS Enabled**: Frontend can be on different domain
- **Stateless**: No session storage needed

## 🎓 Learning Objectives

After completing this project, you'll understand:

1. **Graph Database Fundamentals**
   - When to use graphs vs relational databases
   - Property graph model (nodes + relationships)
   - Graph query patterns

2. **Cypher Query Language**
   - Pattern matching syntax
   - Multi-hop traversals
   - Aggregation and grouping
   - Cycle detection
   - Path finding

3. **Fraud Detection Techniques**
   - Circular transaction detection
   - Money mule identification
   - Risk scoring algorithms
   - Anomaly detection patterns
   - Transaction flow analysis

4. **Full-Stack Development**
   - Backend API design
   - Database connectivity
   - Frontend state management
   - Error handling
   - Security best practices

5. **Real-World Applications**
   - How banks detect fraud
   - AML (Anti-Money Laundering) compliance
   - Transaction monitoring systems
   - Relationship analysis at scale

## 🔐 Security Considerations

- ✅ Credentials in `.env` (never committed)
- ✅ Parameterized Cypher queries (no injection)
- ✅ CORS configuration
- ✅ Error messages don't leak info
- ✅ No sensitive data in logs
- ✅ Environment isolation (dev/prod)

## 📚 Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| **README.md** | Feature overview & quick start | Everyone |
| **SETUP.md** | Step-by-step installation guide | New users |
| **SCHEMA.md** | Graph design & data model | Developers |
| **CYPHER_REFERENCE.md** | Query examples & patterns | Developers |
| **PROJECT_OVERVIEW.md** | Architecture & design (this file) | Architects |

## 🚦 Getting Started Path

1. **Read**: `README.md` (overview)
2. **Follow**: `SETUP.md` (complete setup)
3. **Explore**: Dashboard in browser
4. **Learn**: `SCHEMA.md` (data model)
5. **Query**: `CYPHER_REFERENCE.md` (write queries)
6. **Extend**: Add your own fraud patterns

## 🎯 Next Steps (Enhancement Ideas)

### Short Term (1-2 weeks)
- [ ] Add user authentication
- [ ] Implement real-time WebSocket updates
- [ ] Create user detail modals
- [ ] Add transaction visualization
- [ ] Build alert system

### Medium Term (1 month)
- [ ] Add graph visualization (D3.js/Cytoscape)
- [ ] Implement rule-based alerting
- [ ] Create reporting dashboard
- [ ] Add anomaly scoring algorithm
- [ ] Build audit logs

### Long Term (ongoing)
- [ ] Machine learning-based risk scoring
- [ ] Temporal pattern analysis
- [ ] Community detection algorithms
- [ ] Influence scoring (PageRank)
- [ ] Production deployment & monitoring

## 🔗 Related Resources

- **Neo4j Docs**: https://neo4j.com/docs/
- **CognoDB**: https://cognodb.com
- **Cypher Manual**: https://neo4j.com/docs/cypher-manual/
- **Graph Databases**: https://neo4j.com/blog/
- **Fraud Detection**: NIST Cybersecurity Framework

## 💬 Questions & Support

- Check `README.md` FAQ section
- Review `SETUP.md` Troubleshooting
- See `CYPHER_REFERENCE.md` for query examples
- Read `SCHEMA.md` for data model questions

## ✨ Summary

This fraud detection system is a **complete, working example** of how graph databases solve real-world problems that relational databases struggle with. It demonstrates:

- ✅ Graph data modeling
- ✅ Cypher query language
- ✅ Fraud detection patterns
- ✅ Full-stack development
- ✅ Production-ready code

Perfect for **learning**, **interviews**, **portfolios**, or **real deployments**.

---

**Built with ❤️ for fraud detection professionals and graph database enthusiasts**
