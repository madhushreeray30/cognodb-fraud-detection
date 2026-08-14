const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const seed = async () => {
  const session = driver.session();
  try {
    console.log('Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('Creating nodes...');

    // Create legitimate users
    const legitimateUsers = [
      { id: 'U001', name: 'Alice Johnson', riskScore: 0.2, status: 'VERIFIED' },
      { id: 'U002', name: 'Bob Smith', riskScore: 0.1, status: 'VERIFIED' },
      { id: 'U003', name: 'Charlie Brown', riskScore: 0.15, status: 'VERIFIED' },
      { id: 'U004', name: 'Diana Prince', riskScore: 0.05, status: 'VERIFIED' },
      { id: 'U005', name: 'Eve Wilson', riskScore: 0.3, status: 'SUSPICIOUS' }
    ];

    // Create suspicious users (potential money mules)
    const suspiciousUsers = [
      { id: 'U101', name: 'Frank Castle', riskScore: 0.85, status: 'FLAGGED' },
      { id: 'U102', name: 'Grace Hopper', riskScore: 0.78, status: 'FLAGGED' },
      { id: 'U103', name: 'Henry Ford', riskScore: 0.92, status: 'HIGH_RISK' },
      { id: 'U104', name: 'Iris West', riskScore: 0.88, status: 'FLAGGED' },
      { id: 'U105', name: 'Jack Sparrow', riskScore: 0.95, status: 'HIGH_RISK' }
    ];

    // Create merchants
    const merchants = [
      { id: 'M001', name: 'SafeMart', category: 'RETAIL' },
      { id: 'M002', name: 'CryptoExchange', category: 'EXCHANGE' },
      { id: 'M003', name: 'ShopNow', category: 'RETAIL' }
    ];

    // Insert all users
    for (const user of [...legitimateUsers, ...suspiciousUsers]) {
      await session.run(
        'CREATE (:User {id: $id, name: $name, riskScore: $riskScore, status: $status})',
        user
      );
    }

    // Insert merchants
    for (const merchant of merchants) {
      await session.run(
        'CREATE (:Merchant {id: $id, name: $name, category: $category})',
        merchant
      );
    }

    console.log('Creating legitimate transactions...');

    // Legitimate transactions
    const legitimateTransactions = [
      { from: 'U001', to: 'U002', amount: 500, timestamp: '2026-08-01' },
      { from: 'U002', to: 'U003', amount: 750, timestamp: '2026-08-02' },
      { from: 'U003', to: 'U004', amount: 1200, timestamp: '2026-08-03' },
      { from: 'U004', to: 'U001', amount: 300, timestamp: '2026-08-04' },
      { from: 'U001', to: 'M001', amount: 200, timestamp: '2026-08-05' }
    ];

    for (const tx of legitimateTransactions) {
      await session.run(`
        MATCH (u1:User {id: $from}), (u2:User {id: $to})
        CREATE (u1)-[:SENT_TO {amount: $amount, timestamp: $timestamp, flagged: false}]->(u2)
      `, tx);
    }

    console.log('Creating suspicious transaction ring (circular flow)...');

    // Suspicious Ring: U101 -> U102 -> U103 -> U101 (money laundering)
    await session.run(`
      MATCH (u1:User {id: 'U101'}), (u2:User {id: 'U102'}), (u3:User {id: 'U103'})
      CREATE (u1)-[:SENT_TO {amount: 15000, timestamp: '2026-08-06', flagged: true}]->(u2)
      CREATE (u2)-[:SENT_TO {amount: 14800, timestamp: '2026-08-07', flagged: true}]->(u3)
      CREATE (u3)-[:SENT_TO {amount: 14500, timestamp: '2026-08-08', flagged: true}]->(u1)
    `);

    console.log('Creating money mule network...');

    // Money mule network: U101 receives from multiple users and sends to multiple
    const muleTransactions = [
      { from: 'U005', to: 'U101', amount: 8000, flagged: true },
      { from: 'U001', to: 'U101', amount: 5000, flagged: false },
      { from: 'U101', to: 'U104', amount: 7000, flagged: true },
      { from: 'U101', to: 'U105', amount: 6500, flagged: true },
      { from: 'U104', to: 'U102', amount: 5500, flagged: true },
      { from: 'U105', to: 'M002', amount: 6000, flagged: true }
    ];

    for (const tx of muleTransactions) {
      await session.run(`
        MATCH (u1:User {id: $from}), (u2:User {id: $to})
        CREATE (u1)-[:SENT_TO {amount: $amount, timestamp: $timestamp, flagged: $flagged}]->(u2)
      `, { ...tx, timestamp: '2026-08-10' });
    }

    console.log('Creating bidirectional relationships for paths...');

    // Add RECEIVED_FROM for easier traversal
    await session.run(`
      MATCH (u1)-[s:SENT_TO]->(u2)
      CREATE (u2)-[:RECEIVED_FROM {amount: s.amount, timestamp: s.timestamp}]->(u1)
    `);

    console.log('Creating Transaction nodes...');

    // Create explicit Transaction nodes for more complex queries
    await session.run(`
      MATCH (u1:User)-[s:SENT_TO]->(u2:User)
      CREATE (t:Transaction {
        id: u1.id + '_' + u2.id + '_' + s.timestamp,
        amount: s.amount,
        timestamp: s.timestamp,
        flagged: s.flagged
      })
      CREATE (u1)-[:MADE_TRANSACTION]->(t)
      CREATE (t)-[:TO_USER]->(u2)
    `);

    console.log('Setting up constraints...');

    // Create constraints for uniqueness
    await session.run('CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT merchant_id IF NOT EXISTS FOR (m:Merchant) REQUIRE m.id IS UNIQUE');

    console.log('✓ Seed data loaded successfully!');
    console.log('Created:');
    console.log('- 10 Users (5 legitimate, 5 suspicious)');
    console.log('- 3 Merchants');
    console.log('- Multiple transactions including:');
    console.log('  • Legitimate transactions');
    console.log('  • Suspicious circular ring (money laundering)');
    console.log('  • Money mule network');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
};

seed();
