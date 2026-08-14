# Fraud Detection System - Graph Database

A real-time fraud detection system powered by CognoDB (Neo4j-compatible graph database). This application demonstrates how graph databases excel at detecting fraud patterns that would be difficult or slow in relational databases.

## 🎯 Why This Problem Needs a Graph Database

**Relational Database Challenges:**
- ❌ Detecting circular transactions requires multiple self-joins (expensive)
- ❌ Finding money mule networks needs recursive queries or multiple passes
- ❌ Tracing transaction paths between users requires expensive table scans
- ❌ Analyzing relationship patterns is inefficient with normalized schemas

**Graph Database Advantages:**
- ✓ **Circular Detection**: Query patterns like A→B→C→A in a single pass
- ✓ **Money Mule Networks**: Instantly find nodes with high in/out degree
- ✓ **Path Traversal**: Find connections between users in milliseconds
- ✓ **Relationship Analysis**: Naturally model "who sent to whom" as direct edges
- ✓ **Real-time Performance**: Query multi-hop relationships without table scans

## 📊 Graph Schema

```
┌─────────────┐                ┌────────────┐
│    User     │                │  Merchant  │
├─────────────┤                ├────────────┤
│ id          │                │ id         │
│ name        │                │ name       │
│ riskScore   │                │ category   │
│ status      │                └────────────┘
└─────────────┘                     ↑
      │                             │
      │ SENT_TO [amount, flagged]  MERCHANT_TX
      ├─────────────────────────────┤
      ↓                             ↓
   User ←─────── RECEIVED_FROM     |
      │
      └──── MADE_TRANSACTION ──→ Transaction
                                    │
                                    └─── TO_USER ──→ User
```

### Nodes:
- **User**: Person account with risk score and verification status
- **Transaction**: Explicit transaction record with amount and timestamp
- **Merchant**: Business entity for retail/exchange transactions

### Relationships:
- **SENT_TO**: Direct transfer from one user to another [amount, timestamp, flagged]
- **RECEIVED_FROM**: Inverse of SENT_TO for easier traversal
- **MADE_TRANSACTION**: User initiates a transaction
- **TO_USER**: Transaction targets a user

## 🚀 Quick Start

### 1. Set Up CognoDB Instance

```bash
# Go to console.cognodb.com/signup and create a free account (no credit card)
# Create a c0 (free) instance in your preferred region
# Save these credentials:
# - Connection URI: bolt+s://<instance-id>.databases.cognodb.cloud
# - Password: (shown only once!)
```

### 2. Install Dependencies

```bash
cd backend
npm install

# Also needed globally for development:
npm install -g nodemon
```

### 3. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your CognoDB credentials:
# NEO4J_URI=bolt+s://<your-instance-id>.databases.cognodb.cloud
# NEO4J_USER=cognodb
# NEO4J_PASSWORD=<your-password>
```

### 4. Seed Initial Data

```bash
npm run seed
# This creates 10 users, 3 merchants, and sample transactions
# Includes legitimate transactions and fraud patterns
```

### 5. Start the Application

```bash
# Terminal 1: Start the backend server
npm start
# Server runs on http://localhost:3000

# Terminal 2: Open the dashboard
# Visit: file:///path/to/fraud-detection-graph/public/index.html
# Or use a local file server:
cd ../public
python3 -m http.server 8080
# Then visit: http://localhost:8080
```

## 📡 API Endpoints

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/users` | GET | All users with risk scores |
| `/api/users/:userId` | GET | User details and transactions |
| `/api/high-risk-transactions` | GET | Transactions >$10k or flagged |
| `/api/money-mules` | GET | Suspects with high transaction flow |
| `/api/suspicious-rings` | GET | Circular transaction patterns |
| `/api/transaction-paths/:fromId/:toId` | GET | Connection path between users |

### Example Queries

```bash
# Get all high-risk users
curl http://localhost:3000/api/users

# Find money mule suspects
curl http://localhost:3000/api/money-mules

# Detect circular transaction rings
curl http://localhost:3000/api/suspicious-rings

# Find path between users
curl http://localhost:3000/api/transaction-paths/U001/U105
```

## 🔍 Key Cypher Queries

### 1. Detect Circular Transaction Rings (Money Laundering)

```cypher
MATCH cycle = (u1:User)-[t1:SENT_TO]->(u2:User)-[t2:SENT_TO]->(u3:User)-[t3:SENT_TO]->(u1)
WHERE t1.amount > 5000 AND t2.amount > 5000 AND t3.amount > 5000
RETURN u1.name as user1, u2.name as user2, u3.name as user3,
       t1.amount as amount1, t2.amount as amount2, t3.amount as amount3
```

**Why Graph is Better**: Relational databases need 3 self-joins. Graphs traverse edges directly.

### 2. Identify Money Mule Networks

```cypher
MATCH (u:User)
WITH u,
     size([(u)-[t:SENT_TO]->() | t]) as sentCount,
     size([(u)-[r:RECEIVED_FROM]->() | r]) as receivedCount
WHERE sentCount > 3 AND receivedCount > 3
RETURN u.id, u.name, sentCount, receivedCount, u.riskScore
ORDER BY (sentCount + receivedCount) DESC
```

**Why Graph is Better**: Degree centrality is instant in graphs; requires aggregation in SQL.

### 3. Find Multi-Hop Transaction Paths

```cypher
MATCH path = shortestPath((u1:User {id: 'U001'})-[*..5]-(u2:User {id: 'U105'}))
WHERE u1 <> u2
RETURN nodes(path) as users, length(path) - 1 as hops
```

**Why Graph is Better**: Variable-length paths are graph-native; SQL needs recursive CTEs.

### 4. Analyze Transaction Flow Through a User

```cypher
MATCH (u:User {id: 'U101'})-[received:RECEIVED_FROM]-(sender:User)
MATCH (u)-[sent:SENT_TO]->(receiver:User)
RETURN sender.name as received_from, sent.amount, receiver.name as sent_to
ORDER BY sent.amount DESC
```

**Why Graph is Better**: Single query instead of multiple JOINs and subqueries.

## 📈 Sample Data

### Legitimate Users
- Alice Johnson (U001) - Risk: 0.2
- Bob Smith (U002) - Risk: 0.1
- Charlie Brown (U003) - Risk: 0.15
- Diana Prince (U004) - Risk: 0.05
- Eve Wilson (U005) - Risk: 0.3

### Suspicious Users (Money Mules & Laundering)
- Frank Castle (U101) - Risk: 0.85 ⚠️
- Grace Hopper (U102) - Risk: 0.78 ⚠️
- Henry Ford (U103) - Risk: 0.92 🚩
- Iris West (U104) - Risk: 0.88 ⚠️
- Jack Sparrow (U105) - Risk: 0.95 🚩

### Fraud Patterns Created
1. **Circular Ring**: U101 → U102 → U103 → U101 ($15k each)
2. **Money Mule Network**: Multiple inputs to U101, outputs to U104/U105
3. **High-Value Transactions**: >$10k transfers flagged for review

## 🛡️ Security Notes

- ✓ All credentials stored in `.env` (never committed)
- ✓ Environment variables used for database connection
- ✓ Parameterized Cypher queries (no string concatenation)
- ✓ CORS configured for frontend communication
- ✓ Error handling for database failures

## 📦 Project Structure

```
fraud-detection-graph/
├── backend/
│   ├── package.json
│   ├── server.js           # Express API server
│   ├── db.js               # Database connection
│   ├── .env.example        # Environment template
│   └── scripts/
│       └── seed.js         # Initialize sample data
├── public/
│   └── index.html          # Interactive dashboard
└── README.md
```

## 🎓 Learning Outcomes

By building this system, you'll understand:

1. **Graph Data Modeling**: Design labeled nodes and typed relationships
2. **Cypher Query Language**: Multi-hop traversals, pattern matching, aggregation
3. **Fraud Detection Patterns**: Circular flows, degree centrality, path analysis
4. **Graph vs Relational**: When to choose graphs for relationship-heavy problems
5. **Real-time Dashboards**: Building responsive UIs over graph queries

## 🔄 Next Steps

### Enhancement Ideas:
- Add user authentication to the dashboard
- Implement real-time WebSocket updates
- Add more complex pattern detection (triangles, cliques)
- Build a visual network graph renderer
- Add anomaly scoring algorithm
- Create export/report functionality
- Implement alerts for new patterns

### Advanced Queries:
- Find common payment hubs
- Detect layering patterns (multi-step washing)
- Analyze temporal patterns (time-based anomalies)
- Community detection algorithms
- PageRank for influence scoring

## 📞 Support

If you encounter issues:

1. **Database Connection**: Verify `.env` credentials and instance status
2. **CORS Errors**: Check backend is running on port 3000
3. **Empty Dashboard**: Ensure seed data was loaded with `npm run seed`
4. **High Latency**: Check CognoDB instance tier (free tier may be slower)

## 📄 License

MIT - Feel free to use this for learning and educational purposes.

---

**Fraud Detection System using CognoDB Graph Database**
