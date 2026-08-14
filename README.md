# 🔍 Fraud Detection System using CognoDB Graph Database

An interactive fraud detection and investigation dashboard backed by **CognoDB**, a Neo4j-compatible graph database.

The application demonstrates how graph data modeling and Cypher queries can be used to identify relationship-driven fraud patterns such as **circular transaction rings, money mule networks, high-risk users, and suspicious high-value transactions**.

## 🌐 Live Demo

**Hosted Application:**
https://cognodb-fraud-detection-5jo0.onrender.com/

---

# 🎯 Problem Statement

Financial fraud is often not visible by looking at an individual transaction in isolation.

The interesting questions are about **relationships**:

- Who sent money to whom?
- Can money be traced through multiple accounts?
- Does money eventually return to the original account?
- Which users have unusually high incoming and outgoing transaction activity?
- Which users form suspicious transaction networks?

These questions naturally form a graph:

```text
User → User → User → User
```

A graph database allows these relationships to be traversed directly instead of repeatedly joining normalized transaction tables.

---

# 🧠 Why a Graph Database?

Traditional relational databases can store transactions effectively, but relationship-heavy fraud analysis can become cumbersome as the number of hops increases.

For example, detecting a pattern such as:

```text
User A
  ↓
User B
  ↓
User C
  ↓
User A
```

requires multiple joins or recursive queries in a relational schema.

In this application, the same relationship can be represented directly:

```text
(Frank Castle)-[:SENT_TO]->(Grace Hopper)
        ↓
(Grace Hopper)-[:SENT_TO]->(Henry Ford)
        ↓
(Henry Ford)-[:SENT_TO]->(Frank Castle)
```

This makes graph traversal and relationship pattern matching natural.

### Graph advantages demonstrated by this project

| Fraud Analysis | Graph Approach |
|---|---|
| Circular transactions | Direct multi-hop pattern matching |
| Money mule detection | Analyze incoming/outgoing relationships |
| Transaction paths | Variable-length graph traversal |
| Transaction flow | Follow relationships between users |
| Fraud rings | Pattern matching across connected users |

The purpose of this project is not to claim that relational databases cannot perform these operations, but to demonstrate how **relationship-centric fraud questions map naturally to a graph model**.

---

# 🏗️ Technology Stack

### Backend

- Node.js
- Express.js
- JavaScript
- Official Neo4j JavaScript Driver
- openCypher

### Database

- CognoDB Cloud
- Bolt protocol
- Neo4j-compatible graph database

### Frontend

- HTML
- CSS
- JavaScript

### Deployment

- Render

---

# 📊 Graph Data Model

The application models users, transactions, and merchants as graph entities.

## Nodes

### `User`

Represents a customer/account.

Properties:

```text
id
name
riskScore
status
```

### `Transaction`

Represents an individual transaction.

Properties include:

```text
amount
timestamp
flagged
```

### `Merchant`

Represents a business involved in transactions.

Properties:

```text
id
name
category
```

## Relationships

### `SENT_TO`

Represents a direct transfer between users.

Properties include:

```text
amount
timestamp
flagged
```

### `RECEIVED_FROM`

Represents the inverse relationship used to simplify incoming transaction traversal.

### `MADE_TRANSACTION`

Connects a user to a transaction they initiated.

### `TO_USER`

Connects a transaction to its target user.

---

## Graph Diagram

```text
                         ┌──────────────┐
                         │   Merchant   │
                         │              │
                         │ id           │
                         │ name         │
                         │ category     │
                         └──────▲───────┘
                                │
                         MERCHANT_TX
                                │
┌──────────────┐        SENT_TO        ┌──────────────┐
│     User     │ ────────────────────► │     User     │
│              │                       │              │
│ id           │ ◄──────────────────── │ id           │
│ name         │    RECEIVED_FROM      │ name         │
│ riskScore    │                       │ riskScore    │
│ status       │                       │ status       │
└──────┬───────┘                       └──────────────┘
       │
       │ MADE_TRANSACTION
       ▼
┌──────────────────┐
│   Transaction    │
│                  │
│ amount           │
│ timestamp        │
│ flagged          │
└────────┬─────────┘
         │
         │ TO_USER
         ▼
      ┌────────┐
      │  User  │
      └────────┘
```

The most important relationship for fraud-ring analysis is:

```text
(User)-[:SENT_TO]->(User)
```

because it directly represents the flow of money between accounts.

---

# 🌱 Seed Data

The repository contains a seed script:

```text
backend/scripts/seed.js
```

The seed script:

- Clears existing graph data
- Creates 10 users
- Creates 3 merchants
- Creates legitimate transactions
- Creates suspicious transactions
- Creates a circular transaction ring
- Creates a money mule network
- Creates bidirectional relationships used for traversal
- Creates explicit `Transaction` nodes
- Sets up database constraints

Run:

```bash
npm run seed
```

The sample users include:

### Lower-risk users

```text
Alice Johnson    U001
Bob Smith        U002
Charlie Brown    U003
Diana Prince     U004
Eve Wilson       U005
```

### Suspicious/high-risk users

```text
Frank Castle     U101
Grace Hopper     U102
Henry Ford       U103
Iris West        U104
Jack Sparrow     U105
```

The seeded graph includes a circular transaction pattern:

```text
Frank Castle
     ↓
Grace Hopper
     ↓
Henry Ford
     ↓
Frank Castle
```

---

# 🔎 Fraud Detection Queries

The application uses Cypher queries to investigate relationships in the graph.

## 1. Circular Transaction Ring Detection

A simplified version of the query searches for a three-hop cycle:

```cypher
MATCH cycle =
    (u1:User)-[t1:SENT_TO]->(u2:User)
    -[t2:SENT_TO]->(u3:User)
    -[t3:SENT_TO]->(u1)
WHERE t1.amount > 5000
  AND t2.amount > 5000
  AND t3.amount > 5000
RETURN
    u1.name AS user1,
    u2.name AS user2,
    u3.name AS user3,
    t1.amount AS amount1,
    t2.amount AS amount2,
    t3.amount AS amount3
```

This identifies a pattern where money moves through multiple users and eventually returns to the original user.

The dashboard presents the detected relationship as:

```text
Frank Castle
      ↓
Grace Hopper
      ↓
Henry Ford
      ↓
Frank Castle
```

The **View Details** interaction exposes the individual transaction flow.

---

# 💰 2. Money Mule Detection

The application analyzes incoming and outgoing relationships around users.

```cypher
MATCH (u:User)
WITH u,
     size([(u)-[t:SENT_TO]->() | t]) AS sentCount,
     size([(u)-[r:RECEIVED_FROM]->() | r]) AS receivedCount
WHERE sentCount > 3
  AND receivedCount > 3
RETURN
    u.id,
    u.name,
    sentCount,
    receivedCount,
    u.riskScore
ORDER BY (sentCount + receivedCount) DESC
```

This helps identify users that act as transaction hubs with significant incoming and outgoing activity.

The dashboard currently identifies users such as **Frank Castle** as money-mule suspects in the seeded dataset.

---

# 🛣️ 3. Multi-Hop Transaction Paths

The application also supports finding connections between users using graph traversal.

Example:

```cypher
MATCH path =
    shortestPath(
        (u1:User {id: 'U001'})-[*..5]-(u2:User {id: 'U105'})
    )
WHERE u1 <> u2
RETURN
    nodes(path) AS users,
    length(path) - 1 AS hops
```

This demonstrates a key graph capability: traversing multiple relationships without manually specifying every join.

---

# 🔄 4. Transaction Flow Through a User

The application can examine both incoming and outgoing transaction relationships around a user.

```cypher
MATCH (u:User {id: 'U101'})-[received:RECEIVED_FROM]-(sender:User)
MATCH (u)-[sent:SENT_TO]->(receiver:User)
RETURN
    sender.name AS received_from,
    sent.amount,
    receiver.name AS sent_to
ORDER BY sent.amount DESC
```

This provides a relationship-centric view of how money enters and leaves an account.

---

# 🖥️ Application Dashboard

The dashboard provides a non-technical interface for investigating the seeded fraud patterns.

It currently displays:

- High-risk users
- Money mule suspects
- Suspicious transaction rings
- High-value/flagged transactions
- Graph statistics
- Database status
- Refresh functionality
- Report export functionality
- Transaction ring details

---

# 📸 Screenshots

## Main Dashboard

![Fraud Detection Dashboard](docs/screenshots/dashboard.png)

The main dashboard provides an overview of high-risk users, money mule suspects, suspicious rings, high-value transactions, and graph statistics.

---

## Suspicious Transaction Ring Details

![Suspicious Transaction Ring](docs/screenshots/suspicious-ring-details.png)

The details view exposes the multi-hop relationship:

```text
Frank Castle
      ↓
Grace Hopper
      ↓
Henry Ford
      ↓
Frank Castle
```

and displays the individual transaction flow and total transaction amount.

---

## Money Mule Detection

![Money Mule Detection](docs/screenshots/money-mules.png)

The dashboard highlights users with suspicious transaction flow and associated risk scores.

---

## High-Value Transactions

![High Value Transactions](docs/screenshots/high-value-transactions.png)

The dashboard surfaces high-value and flagged transactions for investigation.

---

## Database Status

![Database Status](docs/screenshots/database-status.png)

The database status view demonstrates the application's connection to the CognoDB backend.

---

# 📁 Project Structure

```text
cognodb-fraud-detection/
│
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   ├── .env.example
│   │
│   └── scripts/
│       └── seed.js
│
├── public/
│   └── index.html
│
├── docs/
│   └── screenshots/
│       ├── dashboard.png
│       ├── suspicious-ring-details.png
│       ├── money-mules.png
│       ├── high-value-transactions.png
│       └── database-status.png
│
└── README.md
```

---

# 🚀 Local Setup

## 1. Clone the Repository

```bash
git clone https://github.com/madhushreeray30/cognodb-fraud-detection.git
cd cognodb-fraud-detection
```

---

## 2. Create a CognoDB Instance

Create a free CognoDB Cloud instance from the CognoDB console.

You will receive:

```text
Bolt URI
Username
Password
```

The connection URI has the form:

```text
bolt+s://<instance-id>.databases.cognodb.cloud
```

---

## 3. Configure Environment Variables

Go to the backend:

```bash
cd backend
```

Create `.env` from the provided example:

```bash
cp .env.example .env
```

Configure:

```env
NEO4J_URI=bolt+s://<your-instance-id>.databases.cognodb.cloud
NEO4J_USER=cognodb
NEO4J_PASSWORD=<your-password>
```

### Security

**Never commit `.env` to GitHub.**

The database credentials are read from environment variables.

---

# 📦 Install Dependencies

From the `backend` directory:

```bash
npm install
```

---

# 🌱 Seed the Database

Run:

```bash
npm run seed
```

Expected result:

```text
✓ Seed data loaded successfully!

Created:
- 10 Users
- 3 Merchants
- Multiple transactions
- Suspicious circular ring
- Money mule network
```

---

# ▶️ Run the Backend

```bash
npm start
```

The backend runs on:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

---

# 🖥️ Run the Dashboard Locally

Because the frontend is a static HTML application, serve the `public` directory separately.

Open another terminal:

```bash
cd public
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

The local dashboard communicates with the backend running on:

```text
http://localhost:3000
```

---

# 📡 API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Backend health check |
| `/api/users` | GET | Retrieve users and risk scores |
| `/api/users/:userId` | GET | Retrieve user details |
| `/api/high-risk-transactions` | GET | Retrieve high-value/flagged transactions |
| `/api/money-mules` | GET | Detect suspicious transaction hubs |
| `/api/suspicious-rings` | GET | Detect circular transaction patterns |
| `/api/transaction-paths/:fromId/:toId` | GET | Find transaction paths |

---

# ☁️ Deployment

The backend is deployed using **Render**.

### Render configuration

```text
Repository:
madhushreeray30/cognodb-fraud-detection

Root Directory:
backend

Build Command:
npm install

Start Command:
npm start
```

The following environment variables are configured in Render:

```text
NEO4J_URI
NEO4J_USER
NEO4J_PASSWORD
```

The deployed application is available at:

https://cognodb-fraud-detection-5jo0.onrender.com/

---

# 🔐 Security Considerations

The application follows these basic security practices:

- Database credentials are stored in environment variables.
- `.env` is not committed to the repository.
- Cypher queries use parameters rather than constructing queries through user-input string concatenation.
- Database errors are handled by the backend.
- CORS is configured for frontend communication.
- The application does not expose the CognoDB password to the frontend.

---

# 🧪 Example Fraud Scenario

The seeded graph contains the following suspicious network:

```text
                $15,000
Frank Castle ─────────────► Grace Hopper
      ▲                         │
      │                         │ $14,800
      │                         ▼
      └──────── Henry Ford ◄────┘
             $14,500
```

The dashboard detects the connected transaction pattern and presents it as a suspicious circular ring.

This demonstrates why relationship traversal is useful for fraud investigation: the suspicious behavior becomes apparent when the **transactions are viewed as a connected network rather than isolated records**.

---

# 🎓 What This Project Demonstrates

This project demonstrates:

### Graph Data Modeling

Designing:

- Node labels
- Relationship types
- Relationship properties
- User and transaction entities

### Cypher

Using:

- Pattern matching
- Multi-hop traversal
- Variable-length paths
- Aggregation
- Relationship filtering

### Fraud Detection Patterns

Detecting:

- Circular transaction rings
- Money mule candidates
- High-risk users
- High-value/flagged transactions
- Transaction paths

### Application Engineering

Building:

- Node.js/Express backend
- Static JavaScript dashboard
- REST APIs
- Database connection layer
- Seed data workflow
- Error handling
- Hosted application

---

# 🔮 Future Improvements

Potential future improvements include:

- Authentication and role-based access
- WebSocket-based transaction updates
- Interactive network visualization
- More complex fraud patterns such as triangles and larger rings
- Temporal transaction analysis
- Community detection
- PageRank-based risk analysis
- Configurable fraud thresholds
- Investigator case management
- Alert notifications
- More detailed transaction investigation views

---

# 📄 License

MIT License

This project is intended for learning and educational purposes.

---

# 👩‍💻 Author

**Madhushree Ray**

GitHub:

https://github.com/madhushreeray30/cognodb-fraud-detection
