# Complete Setup Guide

This guide walks you through setting up your entire fraud detection system from scratch.

## Phase 1: Set Up CognoDB Cloud Instance

### Step 1.1: Create CognoDB Account

1. Visit **[console.cognodb.com/signup](https://console.cognodb.com/signup)**
2. Sign up with your email (no credit card required)
3. Verify your email address
4. Log in to the CognoDB console

### Step 1.2: Provision a Free Instance

1. Click **"Create Instance"** or **"New Database"**
2. **Instance Name**: `fraud-detection` (or your choice)
3. **Tier**: Select **c0** (free tier)
4. **Region**: Choose closest to you:
   - `us-east-1` (N. Virginia)
   - `eu-west-1` (Ireland)
   - `ap-southeast-1` (Singapore)
5. Click **"Create"**
6. **Wait 30-60 seconds** while the instance provisions

### Step 1.3: Save Your Credentials

⚠️ **IMPORTANT**: These are shown only once!

After creation, you'll see:

```
Connection Details:
┌─────────────────────────────────────────────┐
│ URI: bolt+s://abc123xyz.databases.cognodb.cloud
│ Username: cognodb
│ Password: ••••••••••••••••••••••••••••
└─────────────────────────────────────────────┘
```

**Save these to a secure location** (password manager, local notes file).

## Phase 2: Set Up Project Repository

### Step 2.1: Clone/Extract Project

If you haven't already, copy the project structure:

```bash
cd /your/workspace
# Project is already at: C:\Users\Admin\fraud-detection-graph
cd fraud-detection-graph
```

### Step 2.2: Create .env File

```bash
cd backend
cp .env.example .env
```

Open `.env` and update:

```bash
# .env
NEO4J_URI=bolt+s://YOUR-INSTANCE-ID.databases.cognodb.cloud
NEO4J_USER=cognodb
NEO4J_PASSWORD=YOUR-PASSWORD-HERE

PORT=3000
NODE_ENV=development
```

**Replace**:
- `YOUR-INSTANCE-ID` with your instance ID (e.g., `abc123xyz`)
- `YOUR-PASSWORD-HERE` with your actual password

### Step 2.3: Verify .env is Ignored

```bash
# Check .gitignore
cat .gitignore
# Should include: .env, *.log, node_modules/
```

If `.gitignore` doesn't exist:

```bash
# Create it
echo ".env" > .gitignore
echo "*.log" >> .gitignore
echo "node_modules/" >> .gitignore
```

## Phase 3: Install Dependencies

### Step 3.1: Install Node.js (if needed)

Check if Node.js is installed:

```bash
node --version
npm --version
```

If not installed:
- **Windows**: Download from [nodejs.org](https://nodejs.org/)
- **macOS**: `brew install node`
- **Linux**: `sudo apt-get install nodejs npm`

### Step 3.2: Install Backend Dependencies

```bash
cd backend
npm install
```

Expected output:
```
added X packages in Ys
```

### Step 3.3: Verify Installation

```bash
npm list neo4j-driver express cors dotenv
```

Should show versions like:
```
├── cors@2.8.5
├── dotenv@16.3.1
├── express@4.18.2
└── neo4j-driver@5.14.0
```

## Phase 4: Seed Database

### Step 4.1: Run Seed Script

```bash
npm run seed
```

Expected output:
```
Clearing existing data...
Creating nodes...
Creating legitimate transactions...
Creating suspicious transaction ring (circular flow)...
Creating money mule network...
Creating bidirectional relationships...
Creating Transaction nodes...
Setting up constraints...
✓ Seed data loaded successfully!
Created:
- 10 Users (5 legitimate, 5 suspicious)
- 3 Merchants
- Multiple transactions including:
  • Legitimate transactions
  • Suspicious circular ring (money laundering)
  • Money mule network
```

**Troubleshooting**:

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Check `.env` credentials and that CognoDB instance is running |
| `Auth error` | Verify password in `.env` is correct (copy-paste from console) |
| `Network error` | Check internet connection and that CognoDB is in your region |
| `Invalid scheme` | Ensure URI starts with `bolt+s://` not `bolt://` |

### Step 4.2: Verify Data Was Loaded

You can verify in the CognoDB console:
1. Go to [console.cognodb.com](https://console.cognodb.com)
2. Click on your instance
3. Should see ~100+ nodes and relationships created

## Phase 5: Start the Application

### Step 5.1: Start Backend Server

```bash
cd backend
npm start
```

Expected output:
```
Server running on port 3000
```

✓ Server is now listening for API requests

### Step 5.2: Open Dashboard (choose one)

**Option A: Direct File (Simplest)**
```bash
# Windows
start ..\public\index.html

# macOS
open ../public/index.html

# Linux
xdg-open ../public/index.html
```

**Option B: Local Web Server (Recommended)**
```bash
# Terminal 2: Start a simple server
cd ../public
python3 -m http.server 8080
# Visit: http://localhost:8080
```

**Option C: Using Node.js Server (Alternative)**
```bash
# From backend directory
npx serve ../public
# Visit: http://localhost:3000
```

### Step 5.3: Verify Dashboard Loads

You should see:
- ✓ "Fraud Detection Dashboard" title
- ✓ 6 colored cards loading data
- ✓ User lists appearing
- ✓ Risk scores visible

## Phase 6: Test API Endpoints

### Step 6.1: Basic Health Check

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{"status":"ok","timestamp":"2026-08-14T12:00:00.000Z"}
```

### Step 6.2: Get Users

```bash
curl http://localhost:3000/api/users
```

Response (sample):
```json
[
  {"id":"U101","name":"Frank Castle","riskScore":0.85,"status":"FLAGGED"},
  {"id":"U103","name":"Henry Ford","riskScore":0.92,"status":"HIGH_RISK"},
  ...
]
```

### Step 6.3: Find Money Mules

```bash
curl http://localhost:3000/api/money-mules
```

### Step 6.4: Detect Suspicious Rings

```bash
curl http://localhost:3000/api/suspicious-rings
```

Response (sample):
```json
[
  {
    "users":["Frank Castle","Grace Hopper","Henry Ford"],
    "amounts":[15000,14800,14500],
    "totalAmount":44300
  }
]
```

## Phase 7: Troubleshooting

### Dashboard Shows "Loading..." Forever

**Cause**: Backend server not running or not responding

**Fix**:
```bash
# Terminal 1: Restart backend
cd backend
npm start

# Terminal 2: Test connection
curl http://localhost:3000/api/health
```

### Getting CORS Error in Console

**Cause**: Frontend and backend not communicating properly

**Fix**:
1. Verify backend is running on port 3000
2. Open browser DevTools (F12)
3. Check console for exact error message
4. If error is "Access-Control-Allow-Origin", restart backend

### Database Connection Failed

**Cause**: `.env` credentials incorrect or instance down

**Fix**:
1. Verify `.env` has correct URI and password
2. Test connection: `curl bolt+s://your-instance-id.databases.cognodb.cloud`
3. Check CognoDB console to see if instance is running
4. Restart instance if needed

### Seed Script Fails Midway

**Cause**: Database connection lost or timeout

**Fix**:
```bash
# Clear and retry
npm run seed
# If it fails again, restart CognoDB instance and retry
```

## Phase 8: Next Steps

### Explore the Codebase

- **`backend/server.js`**: API endpoints and Cypher queries
- **`backend/scripts/seed.js`**: Sample data structure
- **`public/index.html`**: Dashboard and frontend logic
- **`SCHEMA.md`**: Detailed graph schema documentation

### Enhance the System

1. **Add Authentication**: Protect dashboard with login
2. **Implement Real-Time Updates**: Use WebSockets for live notifications
3. **Add More Patterns**: Detect triangles, cliques, temporal anomalies
4. **Build Visualizations**: Add network graph visualization
5. **Create Reports**: Export findings as PDF

### Learn Cypher

Query patterns to try:

```cypher
# Find all users
MATCH (u:User) RETURN u

# Get user's transaction flow
MATCH (u:User {id: 'U101'})-[t:SENT_TO]->(other) RETURN other.name, t.amount

# Find connected components
MATCH (u1:User)-[*..3]-(u2:User) WHERE u1.id = 'U001' RETURN DISTINCT u2.name

# Calculate risk based on activity
MATCH (u:User)-[t:SENT_TO]->(other)
RETURN u.name, COUNT(t) as transaction_count, SUM(t.amount) as total_volume
ORDER BY total_volume DESC
```

## 📞 Support

| Issue | Resource |
|-------|----------|
| CognoDB docs | [docs.cognodb.com](https://docs.cognodb.com) |
| Neo4j/Cypher | [neo4j.com/docs](https://neo4j.com/docs) |
| Node.js issues | [nodejs.org/en/docs](https://nodejs.org/en/docs) |
| Express.js | [expressjs.com](https://expressjs.com) |

## ✅ Verification Checklist

- [ ] CognoDB account created
- [ ] Instance provisioned and running
- [ ] Credentials saved in `.env`
- [ ] npm dependencies installed
- [ ] Seed data loaded successfully
- [ ] Backend server running on port 3000
- [ ] Dashboard accessible and showing data
- [ ] API endpoints responding correctly
- [ ] Money mules detected in dashboard
- [ ] Suspicious rings displayed

Once all checkboxes are complete, your fraud detection system is ready to use! 🎉
