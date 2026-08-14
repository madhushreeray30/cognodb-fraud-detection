const express = require('express');
const cors = require('cors');
const { getSession } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Helper to convert BigInt to Number
const convertBigInt = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      converted[key] = convertBigInt(obj[key]);
    }
    return converted;
  }
  return obj;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all users with risk score
app.get('/api/users', async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (u:User)
      RETURN u.id as id, u.name as name, u.riskScore as riskScore, u.status as status
      ORDER BY u.riskScore DESC
      LIMIT 100
    `);
    const data = result.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      riskScore: r.get('riskScore'),
      status: r.get('status')
    }));
    res.json(convertBigInt(data));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.json([]);
  } finally {
    await session.close();
  }
});

// Get user details with transactions
app.get('/api/users/:userId', async (req, res) => {
  const session = getSession();
  try {
    const { userId } = req.params;
    const result = await session.run(`
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[t:SENT_TO|RECEIVED_FROM]->(other:User)
      OPTIONAL MATCH (u)-[tr:MADE_TRANSACTION]->(trans:Transaction)
      RETURN u, collect(other) as relatedUsers, collect(trans) as transactions
      LIMIT 1
    `, { userId });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const record = result.records[0];
    const user = record.get('u').properties;
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  } finally {
    await session.close();
  }
});

// Detect suspicious transaction rings (circular transactions)
app.get('/api/suspicious-rings', async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (u1:User)-[t1:SENT_TO]->(u2:User)
      MATCH (u2)-[t2:SENT_TO]->(u3:User)
      MATCH (u3)-[t3:SENT_TO]->(u1)
      WHERE t1.amount > 1000 AND t2.amount > 1000 AND t3.amount > 1000
      RETURN DISTINCT u1.name as user1, u2.name as user2, u3.name as user3,
             t1.amount as amount1, t2.amount as amount2, t3.amount as amount3
      LIMIT 50
    `);
    if (result.records.length === 0) {
      return res.json([]);
    }
    const data = result.records.map(r => ({
      users: [r.get('user1'), r.get('user2'), r.get('user3')],
      amounts: [Number(r.get('amount1')), Number(r.get('amount2')), Number(r.get('amount3'))],
      totalAmount: Number(r.get('amount1')) + Number(r.get('amount2')) + Number(r.get('amount3'))
    }));
    res.json(convertBigInt(data));
  } catch (error) {
    console.error('Error detecting rings:', error);
    res.json([]);
  } finally {
    await session.close();
  }
});

// Find money mule networks (nodes with many incoming and outgoing transactions)
app.get('/api/money-mules', async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (u:User)
      WITH u,
           size([(u)-[t:SENT_TO]->() | t]) as sentCount,
           size([(u)-[r:RECEIVED_FROM]->() | r]) as receivedCount
      WHERE sentCount > 1 AND receivedCount > 1
      RETURN u.id as id, u.name as name, sentCount, receivedCount, u.riskScore as riskScore
      ORDER BY (sentCount + receivedCount) DESC
      LIMIT 20
    `);
    const data = result.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      sentCount: Number(r.get('sentCount')),
      receivedCount: Number(r.get('receivedCount')),
      riskScore: r.get('riskScore')
    }));
    res.json(convertBigInt(data));
  } catch (error) {
    console.error('Error finding money mules:', error);
    res.json([]);
  } finally {
    await session.close();
  }
});

// Find transaction paths between two users
app.get('/api/transaction-paths/:fromId/:toId', async (req, res) => {
  const session = getSession();
  try {
    const { fromId, toId } = req.params;
    const result = await session.run(`
      MATCH path = shortestPath((u1:User {id: $fromId})-[*..5]-(u2:User {id: $toId}))
      WHERE u1 <> u2
      UNWIND nodes(path) as node
      RETURN collect(node.name) as path, length(path) - 1 as hops
      LIMIT 1
    `, { fromId, toId });

    if (result.records.length === 0) {
      return res.json({ path: null, message: 'No connection found' });
    }

    const record = result.records[0];
    res.json({
      path: record.get('path'),
      hops: record.get('hops')
    });
  } catch (error) {
    console.error('Error finding paths:', error);
    res.status(500).json({ error: 'Failed to find transaction paths' });
  } finally {
    await session.close();
  }
});

// Get high-risk transactions
app.get('/api/high-risk-transactions', async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (u1:User)-[t:SENT_TO]->(u2:User)
      WHERE t.amount > 5000 OR t.flagged = true
      RETURN u1.name as from, u2.name as to, t.amount as amount, t.flagged as flagged, t.timestamp as timestamp
      ORDER BY t.amount DESC
      LIMIT 50
    `);
    const data = result.records.map(r => ({
      from: r.get('from'),
      to: r.get('to'),
      amount: Number(r.get('amount')),
      flagged: r.get('flagged'),
      timestamp: r.get('timestamp')
    }));
    res.json(convertBigInt(data));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.json([]);
  } finally {
    await session.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
