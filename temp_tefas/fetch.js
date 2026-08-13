const Tefas = require('@firstthumb/tefas');
const fs = require('fs');

async function run() {
  const tefas = new Tefas();
  const funds = await tefas.getFunds();
  fs.writeFileSync('../all_tefas_funds.json', JSON.stringify(funds, null, 2));
  console.log("Success! Funds fetched: " + funds.length);
}
run().catch(console.error);
