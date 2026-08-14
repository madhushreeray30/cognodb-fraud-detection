# Cypher Query Reference Guide

A comprehensive guide to querying the fraud detection graph database with Cypher.

## 📚 Cypher Basics

### Basic Patterns

```cypher
# Match any node
MATCH (n) RETURN n LIMIT 10

# Match specific node type
MATCH (u:User) RETURN u

# Match by property
MATCH (u:User {name: 'Alice Johnson'}) RETURN u

# Match with variable
MATCH (u:User {id: 'U001'}) RETURN u.name, u.riskScore
```

### Relationships

```cypher
# Simple relationship
MATCH (u1:User)-[t:SENT_TO]->(u2:User) RETURN u1, t, u2

# Relationship with properties
MATCH (u1:User)-[t:SENT_TO {flagged: true}]->(u2:User) RETURN u1.name, t.amount, u2.name

# Any relationship type
MATCH (u1:User)-[rel]->(u2:User) RETURN u1, rel, u2

# Without specifying direction
MATCH (u1:User)-[:SENT_TO]-(u2:User) RETURN u1, u2
```

## 🔍 Fraud Detection Queries

### 1. Find All Suspicious Users

```cypher
MATCH (u:User)
WHERE u.riskScore > 0.7
RETURN u.name, u.riskScore, u.status
ORDER BY u.riskScore DESC
```

**Purpose**: Get high-risk users at a glance
**Performance**: O(n) - full table scan
**Use Case**: Daily risk dashboard

### 2. Detect 3-Hop Circular Transactions

```cypher
MATCH cycle = (u1:User)-[t1:SENT_TO]->(u2:User)
           -[t2:SENT_TO]->(u3:User)
           -[t3:SENT_TO]->(u1)
WHERE t1.amount > 5000 
  AND t2.amount > 5000 
  AND t3.amount > 5000
RETURN u1.name as user1,
       u2.name as user2,
       u3.name as user3,
       t1.amount as trans1,
       t2.amount as trans2,
       t3.amount as trans3,
       (t1.amount + t2.amount + t3.amount) as total_cycled
```

**Purpose**: Detect money laundering via circular flows
**Pattern**: Graph excels at cycle detection
**SQL Alternative**: Would need 3 self-joins (extremely expensive)

### 3. Find 4-Hop Circular Transactions

```cypher
MATCH cycle = (u1:User)-[t1:SENT_TO]->(u2:User)
           -[t2:SENT_TO]->(u3:User)
           -[t3:SENT_TO]->(u4:User)
           -[t4:SENT_TO]->(u1)
WHERE t1.amount > 2000 
  AND t2.amount > 2000 
  AND t3.amount > 2000
  AND t4.amount > 2000
RETURN [u1.name, u2.name, u3.name, u4.name] as ring,
       t1.amount + t2.amount + t3.amount + t4.amount as total
```

**Purpose**: Detect larger laundering rings
**Complexity**: O(n²) for full graph scan

### 4. Identify Money Mule Suspects

```cypher
MATCH (u:User)
WITH u,
     size([(u)-[s:SENT_TO]->() | s]) as sent_count,
     size([(u)-[r:RECEIVED_FROM]->() | r]) as received_count,
     size([(u)-[f:SENT_TO {flagged: true}]->() | f]) as flagged_sent
WHERE sent_count > 2 AND received_count > 2
RETURN u.id as user_id,
       u.name as name,
       sent_count,
       received_count,
       flagged_sent,
       (sent_count + received_count) as total_flow,
       u.riskScore
ORDER BY total_flow DESC
```

**Purpose**: Find accounts acting as intermediaries
**Mule Indicator**: High in-degree AND high out-degree
**Performance**: O(n) - one pass through users

### 5. Find Bidirectional Transfers

```cypher
MATCH (u1:User)-[t1:SENT_TO]->(u2:User)
MATCH (u2)-[t2:SENT_TO]->(u1)
RETURN u1.name as user1,
       u2.name as user2,
       t1.amount as user1_to_user2,
       t2.amount as user2_to_user1,
       ABS(t1.amount - t2.amount) as difference
ORDER BY difference
```

**Purpose**: Detect back-and-forth transfers (structuring)
**Red Flag**: Similar amounts moving in both directions
**Use Case**: Detect layering phase of money laundering

### 6. High-Value Transaction Chain

```cypher
MATCH (u1:User)-[t1:SENT_TO {flagged: true}]->(u2:User)
                -[t2:SENT_TO {flagged: true}]->(u3:User)
                -[t3:SENT_TO {flagged: true}]->(u4:User)
RETURN u1.name as source,
       u2.name as intermediate_1,
       u3.name as intermediate_2,
       u4.name as destination,
       [t1.amount, t2.amount, t3.amount] as amounts
LIMIT 20
```

**Purpose**: Find chains of flagged transactions
**Pattern**: Linear flow vs circular
**Use Case**: Trace destination of suspicious funds

## 📊 Analysis Queries

### 7. User Transaction Volume

```cypher
MATCH (u:User)-[t:SENT_TO]->(other)
RETURN u.id,
       u.name,
       COUNT(t) as transaction_count,
       SUM(t.amount) as total_sent,
       AVG(t.amount) as avg_amount,
       MAX(t.amount) as max_amount,
       MIN(t.amount) as min_amount
ORDER BY total_sent DESC
```

**Purpose**: Profile user behavior
**Output**: Transaction statistics per user
**Use Case**: Baseline normal behavior

### 8. Transaction Activity by Time Period

```cypher
MATCH (u:User)-[t:SENT_TO]->(other)
WHERE t.timestamp >= '2026-08-01' AND t.timestamp < '2026-08-15'
WITH t.timestamp as date, COUNT(*) as daily_txn_count, SUM(t.amount) as daily_volume
RETURN date,
       daily_txn_count,
       daily_volume
ORDER BY date
```

**Purpose**: Detect temporal anomalies
**Pattern**: Spike detection
**Use Case**: Alert on unusual activity times

### 9. Connected Users (Clustering)

```cypher
MATCH (u1:User {id: 'U101'})-[*..3]-(u2:User)
WHERE u1 <> u2
RETURN DISTINCT u2.name, u2.riskScore
ORDER BY u2.riskScore DESC
```

**Purpose**: Find all users within N hops
**Hops**: `[*..3]` means 1-3 steps away
**Use Case**: Find related suspicious accounts

### 10. Transaction Flow Through a Hub

```cypher
MATCH (sender:User)-[in_tx:SENT_TO]->(hub:User {id: 'U101'})
MATCH (hub)-[out_tx:SENT_TO]->(receiver:User)
WITH sender, hub, receiver, in_tx, out_tx
WHERE in_tx.timestamp <= out_tx.timestamp
RETURN sender.name as source,
       in_tx.amount as received,
       out_tx.amount as sent,
       receiver.name as destination,
       (out_tx.amount - in_tx.amount) as fee
ORDER BY fee DESC
```

**Purpose**: Analyze money passing through intermediaries
**Pattern**: Money mule flow
**Use Case**: Calculate "fee" or "skimming"

## 🔗 Path Analysis

### 11. Shortest Path Between Users

```cypher
MATCH path = shortestPath((u1:User {id: 'U001'})-[*..5]-(u2:User {id: 'U105'}))
RETURN [node IN nodes(path) | node.name] as user_path,
       [rel IN relationships(path) | type(rel)] as relationship_types,
       length(path) - 1 as hops
```

**Purpose**: Find indirect connections
**Max Hops**: `[*..5]` limits search depth
**Use Case**: Investigate if users are connected

### 12. All Paths from High-Risk User

```cypher
MATCH path = (u1:User {id: 'U101'})-[*..2]-(u2:User)
WHERE u1 <> u2
RETURN [node IN nodes(path) | node.name] as path,
       [rel IN relationships(path) | {type: type(rel), amount: rel.amount}] as edges,
       length(path) as hops
LIMIT 50
```

**Purpose**: Map user's transaction network
**Complexity**: Variable-length paths
**Use Case**: Network visualization

### 13. Reachability Analysis

```cypher
MATCH (u1:User {id: 'U101'})
MATCH (u2:User)
WHERE u1 <> u2
WITH u1, u2,
     CASE WHEN EXISTS(
       (u1)-[*..1]-(u2)
     ) THEN 'direct'
     WHEN EXISTS(
       (u1)-[*..2]-(u2)
     ) THEN '1-hop'
     WHEN EXISTS(
       (u1)-[*..3]-(u2)
     ) THEN '2-hop'
     ELSE 'unreachable'
     END as distance
RETURN distance, COUNT(*) as user_count
```

**Purpose**: Analyze user connectivity
**Output**: Distribution of connection distances
**Use Case**: Find isolated vs connected clusters

## 🎯 Aggregation Queries

### 14. High-Risk Recipient Analysis

```cypher
MATCH (u:User {riskScore: $riskThreshold})<-[t:RECEIVED_FROM]-(sender:User)
RETURN u.name as high_risk_user,
       COUNT(sender) as sender_count,
       SUM(t.amount) as total_received,
       COLLECT(sender.name) as senders
```

**Purpose**: Who is sending money to high-risk users?
**Parameter**: `$riskThreshold` (e.g., 0.7)
**Use Case**: Identify funding sources

### 15. Risk Propagation

```cypher
MATCH (u:User)-[t:SENT_TO]->(other:User)
RETURN u.name,
       u.riskScore as source_risk,
       other.name,
       other.riskScore as dest_risk,
       CASE WHEN other.riskScore > u.riskScore THEN 'escalating'
            WHEN other.riskScore < u.riskScore THEN 'cascading'
            ELSE 'equal' END as risk_flow
ORDER BY dest_risk DESC
```

**Purpose**: Analyze if risk increases or decreases
**Pattern**: High-risk funding low-risk = suspicious
**Use Case**: Risk contagion analysis

## 🚀 Performance Optimization

### 16. Indexed Lookups

```cypher
# Using index on id (fast)
MATCH (u:User {id: 'U001'}) RETURN u

# Without index (slow)
MATCH (u:User) WHERE u.name = 'Alice Johnson' RETURN u
```

**Tip**: Always use indexed properties in WHERE clauses

### 17. Limit Early

```cypher
# Good: Limit before expensive operations
MATCH (u:User)
WHERE u.riskScore > 0.7
LIMIT 100
MATCH (u)-[t:SENT_TO]->(other)
RETURN u, t, other

# Bad: Get all transactions then limit
MATCH (u:User)-[t:SENT_TO]->(other)
LIMIT 100
```

### 18. Aggregate Before Collecting

```cypher
# Good: Aggregate first
MATCH (u:User)-[t:SENT_TO]->(other)
RETURN u.name, COUNT(*) as txn_count
ORDER BY txn_count DESC

# Bad: Collect then sort
MATCH (u:User)-[t:SENT_TO]->(other)
WITH u, COLLECT(t) as txns
RETURN u.name, LENGTH(txns) as txn_count
ORDER BY txn_count DESC
```

## 📝 Common Patterns

### Pattern: Money Mule Detection Chain

```cypher
MATCH (source:User)-[t1:SENT_TO]->(mule:User)
                    -[t2:SENT_TO]->(destination:User)
WHERE mule.riskScore > 0.7
  AND t1.amount > 1000
  AND ABS(t1.amount - t2.amount) < 500
RETURN source.name, t1.amount, mule.name, t2.amount, destination.name
```

### Pattern: Circular Risk

```cypher
MATCH cycle = (u1:User)-[*..3]-(u1)
RETURN [node IN nodes(cycle) | {name: node.name, risk: node.riskScore}] as cycle,
       length(cycle) as cycle_length
LIMIT 20
```

### Pattern: Anomaly Detection

```cypher
MATCH (u:User)-[t:SENT_TO]->(other)
WITH u, AVG(t.amount) as avg_txn, STDDEV(t.amount) as stddev
MATCH (u)-[t2:SENT_TO]->(other2)
WHERE ABS(t2.amount - avg_txn) > (2 * stddev)
RETURN u.name, t2.amount, avg_txn, stddev
```

## 🧪 Testing Queries

### Quick Count Check

```cypher
MATCH (n) RETURN labels(n) as node_type, COUNT(*) as count
MATCH ()-[r]->() RETURN type(r) as rel_type, COUNT(*) as count
```

### Data Quality Check

```cypher
MATCH (u:User)
WHERE NOT EXISTS(u.id) OR NOT EXISTS(u.name)
RETURN u as incomplete_user

MATCH ()-[t:SENT_TO]->()
WHERE t.amount <= 0 OR NOT EXISTS(t.timestamp)
RETURN t as invalid_transaction
```

## 🔗 Related Resources

- **SCHEMA.md**: Node and relationship definitions
- **README.md**: Overview and setup
- **server.js**: API endpoints using these queries
