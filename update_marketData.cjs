const fs = require('fs');
let content = fs.readFileSync('src/services/marketData.js', 'utf8');

const fetchExplosiveUSStocksCode = `
export const fetchExplosiveUSStocks = async () => {
  try {
    const response = await fetch('/api/tradingview/america/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: [
          { left: "type", operation: "in_range", right: ["stock"] },
          { left: "close", operation: "egreater", right: 1 },
          { left: "close", operation: "eless", right: 30 },
          { left: "volume", operation: "egreater", right: 1000000 },
          { left: "change", operation: "egreater", right: 5 } // En az %5 günlük yükseliş
        ],
        options: { lang: "en" },
        markets: ["america"],
        symbols: { query: { types: [] }, tickers: [] },
        columns: [
          'name', 'close', 'volume', 'average_volume_30d_calc', 'Perf.W', 'Volatility.D', 
          'RSI', 'MACD.macd', 'MACD.signal', 'EMA20', 'EMA50', 'ATR', 'open', 'high', 'low', 
          'change'
        ],
        sort: { sortBy: "relative_volume_10d_calc", sortOrder: "desc" },
        range: [0, 50]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const results = {};
      if (data.data) {
        data.data.forEach(item => {
          const t = item.s.split(':')[1];
          const d = item.d;
          results[t] = {
            ticker: t, close: d[1], volume: d[2], avgVol30: d[3], perfW: d[4], volatility: d[5],
            rsi: d[6], macd: d[7], macdSignal: d[8], ema20: d[9], ema50: d[10],
            atr: d[11] || (d[1] * 0.05),
            open: d[12], high: d[13], low: d[14],
            change: d[15] !== undefined ? d[15] : null, currentPrice: d[1]
          };
        });
      }
      return results;
    }
  } catch (error) {
    console.error("US Explosive Scanner error:", error);
  }
  return {};
};
`;

// Insert after fetchTVDataForUSStocks declaration
content = content.replace(
  /export const fetchTVDataForUSStocks = async \(tickers\) => \{/,
  fetchExplosiveUSStocksCode + '\nexport const fetchTVDataForUSStocks = async (tickers) => {'
);

// Update analyzeUSStock
const oldAnalyze = `  let finalSignals = [];
  for (const s of signals) {
      if (s.strength === 'Al' && hasVolumeSurge) {
          finalSignals.push({ ...s, strength: 'Güçlü Al', signal: s.signal + ' + Hacim Şoku' });
      } else if (s.strength === 'Al') {
          finalSignals.push(s);
      }
  }`;

const newAnalyze = `  let finalSignals = [];
  // Dinamik patlayıcı taramadan gelen hisselerde Hacim ve Trend varsa doğrudan Güçlü Al ver
  if (hasVolumeSurge && isTrendOk && data.change > 2) {
      signals.push({ type: 'Momentum', signal: 'Patlayıcı Momentum Hacmi (US)', strength: 'Güçlü Al' });
  }

  for (const s of signals) {
      if ((s.strength === 'Al' || s.strength === 'Güçlü Al') && hasVolumeSurge) {
          finalSignals.push({ ...s, strength: 'Güçlü Al', signal: s.signal.includes('Hacim') ? s.signal : s.signal + ' + Hacim Şoku' });
      } else if (s.strength === 'Al' || s.strength === 'Güçlü Al') {
          finalSignals.push(s);
      }
  }`;

content = content.replace(oldAnalyze, newAnalyze);

// Add fetchExplosiveUSStocks to exports at the top if needed.
// Actually, it's just 'export const' so it will be automatically exported.

fs.writeFileSync('src/services/marketData.js', content);
console.log('Successfully updated marketData.js');
