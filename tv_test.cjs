const https = require('https');
const payload = JSON.stringify({
  filter: [{ left: 'type', operation: 'in_range', right: ['stock', 'dr', 'fund'] }],
  options: { lang: 'tr' },
  symbols: { query: { types: [] }, tickers: [] },
  columns: ['name', 'price_earnings_ttm', 'price_book_ratio', 'net_income', 'total_revenue', 'ebitda', 'return_on_equity', 'Recommend.All'],
  sort: { sortBy: 'volume', sortOrder: 'desc' },
  range: [0, 5]
});
const req = https.request('https://scanner.tradingview.com/turkey/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
req.write(payload);
req.end();
