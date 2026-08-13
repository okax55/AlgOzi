const http = require('http');
const payload = JSON.stringify({
  filter: [{ left: 'type', operation: 'in_range', right: ['stock', 'dr', 'fund'] }],
  options: { lang: 'tr' },
  symbols: { query: { types: [] }, tickers: [] },
  columns: ['name'],
  sort: { sortBy: 'volume', sortOrder: 'desc' },
  range: [0, 5]
});
const req = http.request('http://localhost:5174/api/tradingview/turkey/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data.substring(0, 200)));
});
req.write(payload);
req.end();
