#!/usr/bin/env node
/**
 * MB Bank standalone script - called by Next.js API routes
 * Usage: node mb-bank-script.js <action> [args]
 * Actions: login, balance, transactions
 */

// Setup polyfills BEFORE any imports
const mbUrl = new URL("https://online.mbbank.com.vn/pl/login");
globalThis.window = { 
  globalThis, 
  document: { welovemb: true }, 
  location: mbUrl 
};
globalThis.location = mbUrl;

const { MB } = require("mbbank");

const username = process.env.MB_USERNAME;
const password = process.env.MB_PASSWORD;
const action = process.argv[2];
const argsJson = process.argv[3] ? JSON.parse(process.argv[3]) : {};

async function main() {
  if (!username || !password) {
    console.error("Missing MB_USERNAME or MB_PASSWORD");
    process.exit(1);
  }

  const mb = new MB({
    username,
    password,
    preferredOCRMethod: "default",
  });

  try {
    if (action === "login" || action === "balance" || action === "transactions") {
      await mb.login();
      
      if (action === "login") {
        console.log(JSON.stringify({ ok: true, sessionId: mb.sessionId }));
      } else if (action === "balance") {
        const balance = await mb.getBalance();
        console.log(JSON.stringify(balance));
      } else if (action === "transactions") {
        const txs = await mb.getTransactionsHistory({
          accountNumber: argsJson.accountNumber || argsJson.accountNo,
          fromDate: argsJson.fromDate,
          toDate: argsJson.toDate,
        });
        console.log(JSON.stringify(txs || []));
      }
    } else {
      console.error("Unknown action:", action);
      process.exit(1);
    }
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

main();
