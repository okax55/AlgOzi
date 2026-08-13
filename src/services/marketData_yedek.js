// Create a queue for API requests to avoid rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchAllBistTickers = async () => {
  try {
    const response = await fetch('/api/tradingview/turkey/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: [{ left: "type", operation: "in_range", right: ["stock"] }],
        options: { lang: "en" },
        markets: ["turkey"],
        symbols: { query: { types: [] }, tickers: [] },
        columns: ["name"],
        sort: { sortBy: "volume", sortOrder: "desc" },
        range: [0, 1000] // Max 1000 stocks (BIST has ~600)
      })
    });
    
    if (!response.ok) throw new Error('TradingView fetch failed');
    const data = await response.json();
    
    // Extract the ticker symbol from 'BIST:THYAO' format
    return data.data.map(item => item.s.replace('BIST:', ''));
  } catch (error) {
    console.error("BIST hisseleri çekilirken hata:", error);
    return [];
  }
};


// Fetches live indicator data directly from TradingView Scanner in batches
export const fetchTVDataForStocks = async (tickers) => {
  // Chunking to avoid URL/Payload size limits (300 per chunk is safe)
  const chunkSize = 300;
  const chunked = [];
  for (let i = 0; i < tickers.length; i += chunkSize) {
    chunked.push(tickers.slice(i, i + chunkSize));
  }

  const results = {};
  for (const chunk of chunked) {
    try {
      const response = await fetch('/api/tradingview/turkey/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: { tickers: chunk.map(t => `BIST:${t}`) },
          columns: [
            'close', 
            'volume', 
            'average_volume_30d_calc', 
            'Perf.W', 
            'Volatility.D', 
            'RSI', 
            'MACD.macd', 
            'MACD.signal', 
            'SMA20', 
            'ATR',
            'open',
            'high',
            'low'
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          data.data.forEach(item => {
            const t = item.s.replace('BIST:', '');
            const d = item.d;
            results[t] = {
              ticker: t,
              close: d[0],
              volume: d[1],
              avgVol30: d[2],
              perfW: d[3],
              volatility: d[4],
              rsi: d[5],
              macd: d[6],
              macdSignal: d[7],
              sma20: d[8],
              atr: d[9] || (d[0] * 0.03), // Default 3% ATR if missing
              open: d[10],
              high: d[11],
              low: d[12],
              currentPrice: d[0]
            };
          });
        }
      }
    } catch(err) {
      console.error('TV Batch fetch error:', err);
    }
    // Small delay between chunks to be polite to the API
    await delay(200);
  }
  return results;
};

// Generates Swing Trade Signals based on TradingView indicators
export const analyzeStock = (data) => {
  if (!data || !data.close) return null;

  const { ticker, close, rsi, macd, macdSignal, sma20, atr, open, high, low, volume, avgVol30 } = data;
  const signals = [];

  // Hacim Filtresi (Volume Surge)
  const hasVolumeSurge = avgVol30 && volume > (avgVol30 * 1.2);

  // Mum (Candlestick) Analizi
  let isHammer = false;
  let isDoji = false;

  if (open !== undefined && high !== undefined && low !== undefined) {
      const body = Math.abs(close - open);
      const fullSize = high - low;
      const upperWick = high - Math.max(open, close);
      const lowerWick = Math.min(open, close) - low;
      
      // Çekiç (Hammer): Alt fitil gövdenin en az 2 katı, üst fitil küçük, gövde var
      if (lowerWick > (body * 2) && upperWick < (body * 0.5) && body > 0) {
          isHammer = true;
      }
      
      // Doji: Gövde tüm boyun %10'undan az (Açılış ve Kapanış birbirine çok yakın)
      if (fullSize > 0 && body < (fullSize * 0.1)) {
          isDoji = true;
      }
  }

  // RSI
  if (rsi < 30) {
    if (isHammer) {
        signals.push({ type: 'Mum+İndikatör', signal: 'Aşırı Satım + Çekiç Mumu', strength: 'Güçlü Al' });
    } else if (isDoji) {
        signals.push({ type: 'Mum+İndikatör', signal: 'Aşırı Satım + Doji (Dönüş)', strength: 'Güçlü Al' });
    } else {
        signals.push({ type: 'İndikatör', signal: 'RSI < 30 (Aşırı Satım)', strength: 'Al' });
    }
  } else if (rsi >= 30 && rsi < 40) {
    if (isHammer) {
        signals.push({ type: 'Mum', signal: 'Dipten Dönüş (Çekiç)', strength: 'Güçlü Al' });
    } else {
        signals.push({ type: 'İndikatör', signal: 'RSI 30-40 Aralığı', strength: 'İzleme' });
    }
  }

  // MACD
  if (macd !== null && macdSignal !== null) {
    if (macd > macdSignal && macd < 0) {
      signals.push({ type: 'İndikatör', signal: 'MACD Pozitif Kesişim (Sıfır Altı)', strength: 'Al' });
    } else if (macd > macdSignal && macd > 0) {
       signals.push({ type: 'İndikatör', signal: 'MACD Yükseliş Trendi', strength: 'Al' });
    }
  }

  // SMA
  if (sma20 && close > sma20) {
    signals.push({ type: 'İndikatör', signal: 'Fiyat SMA20 Üzerinde', strength: 'İzleme' });
  }

  // Hacim Teyidi ile Sinyal Gücünü Belirleme
  let finalSignals = [];
  for (const s of signals) {
      if (s.strength === 'Güçlü Al' || s.strength === 'Al') {
          if (hasVolumeSurge) {
             finalSignals.push({ ...s, strength: 'Güçlü Al', signal: s.signal + ' + Hacim Patlaması' });
          } else {
             // Hacim yoksa Güçlü Al'ı normal Al'a düşür, normal Al'ı İzleme'ye düşür
             finalSignals.push({ ...s, strength: s.strength === 'Güçlü Al' ? 'Al' : 'İzleme' });
          }
      }
  }
  
  finalSignals = finalSignals.filter(s => s.strength === 'Güçlü Al' || s.strength === 'Al');

  if (finalSignals.length > 0) {
    // Sort signals by strength (Güçlü Al first)
    finalSignals.sort((a, b) => b.strength.localeCompare(a.strength));
    
    // Swing Trade Math (ATR based Stop Loss and Take Profit)
    const entryPrice = close;
    const stopPrice = entryPrice - (atr * 1.5); // 1.5x ATR trailing stop
    const targetPrice = entryPrice + (atr * 3); // 1:2 Risk/Reward

    return {
      ticker,
      price: entryPrice.toFixed(2),
      entry: entryPrice.toFixed(2),
      target: targetPrice.toFixed(2),
      stop: stopPrice.toFixed(2),
      atr: atr.toFixed(2),
      type: finalSignals[0].type,
      signal: finalSignals[0].signal,
      strength: finalSignals[0].strength,
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      indicators: {
        rsi: rsi ? rsi.toFixed(1) : '-',
        macd: macd ? macd.toFixed(2) : '-',
        sma20Status: (sma20 && close > sma20) ? 'Üzerinde' : 'Altında'
      },
      rr: '1:2'
    };
  }

  return null;
};

// Algorithmic Scoring for Portfolios based on direct TV data
export const scoreStock = (data, strategy) => {
  if (!data || !data.close) return { score: 0, reason: 'Veri Yetersiz' };

  const { close, volume, avgVol30, perfW, volatility, rsi, macd, macdSignal, sma20 } = data;
  
  const momentum = perfW || 0; 
  const volatilityPct = volatility || 1; 
  const currentRsi = rsi || 50;
  const currentSma = sma20 || close;
  const currentMacd = macd || 0;
  const currentMacdSignal = macdSignal || 0;

  // General indicators for "Buying status"
  const isMacdBullish = currentMacd > currentMacdSignal;
  const isRsiHealthy = currentRsi > 40 && currentRsi < 70;
  const isPriceAboveSma = close > currentSma;
  const hasVolumeSurge = avgVol30 > 0 && volume > (avgVol30 * 1.2);

  let score = 0;
  let reasons = [];

  // Temel momentum (Haftalık getiri çok daha ağırlıklı)
  if (momentum > 0) {
    score += momentum * 5; // Agresif getiri çarpanı
  } else {
    score += momentum * 3; // Düşüşte olanlara eksi puan
  }

  // MACD & RSI Sinerjisi (En başarılı hisseler için)
  if (isMacdBullish && currentRsi > 50 && currentRsi < 75) {
    score += 40;
    reasons.push('Güçlü Yükseliş Trendi (MACD+RSI)');
  }

  switch (strategy) {
    case 'alfa':
      // ALFA: Yüksek risk, yüksek getiri potansiyeli, Yıldız/Ana pazar (Volatilite teşvik edilir)
      score += (volatilityPct * 4); // Yüksek volatiliteye ekstra puan
      if (momentum > 0) score += momentum * 6;
      if (hasVolumeSurge) { score += 40; reasons.push('Hacim Patlaması'); }
      if (currentRsi > 65) { score += 30; reasons.push('Agresif İvme'); }
      if (isMacdBullish) { score += 20; reasons.push('MACD AL Sinyali'); }
      break;

    case 'beta':
      // BETA: Yeni halka arzlar, büyüme hikayeleri (Momentum ve Dönüş)
      if (hasVolumeSurge) { score += 35; reasons.push('Güçlü Hacim Desteği'); }
      if (isMacdBullish && currentMacd < 0) { score += 40; reasons.push('Dipten Güçlü Dönüş'); }
      else if (isMacdBullish) { score += 20; reasons.push('Trend Yönü Pozitif'); }
      if (isPriceAboveSma) { score += 30; reasons.push('Büyüme İvmesi Korunuyor'); }
      score += momentum * 5;
      break;

    case 'katilim':
      // KATILIM: Etik ve faizsiz, daha dengeli model (Aşırı uçlardan kaçınır)
      if (isRsiHealthy) { score += 40; reasons.push('Dengeli ve Güvenli Trend'); }
      if (currentRsi > 75) { score -= 20; reasons.push('Aşırı Alım Riski'); }
      if (isPriceAboveSma) { score += 35; reasons.push('SMA20 Destekli Yükseliş'); }
      if (isMacdBullish) { score += 25; reasons.push('MACD Teyidi'); }
      score += momentum * 3;
      break;

    case 'delta':
      // DELTA: Düşük risk, sürdürülebilir, düşük oynaklık (Volatilite cezalandırılır)
      score += 60 - (volatilityPct * 10); // Volatilite arttıkça puan çok sert düşer
      if (isPriceAboveSma) { score += 40; reasons.push('Güçlü SMA20 Koruması (Düşük Risk)'); }
      if (currentRsi > 40 && currentRsi < 65) { score += 30; reasons.push('İstikrarlı Fiyat Bölgesi'); }
      if (momentum > 0 && momentum < 15) { score += 20; reasons.push('Sürdürülebilir Büyüme'); }
      if (isMacdBullish) { score += 15; reasons.push('Sınırlı Yükseliş Beklentisi'); }
      break;
  }

  // Base multiplier if it meets technical "Buy" status
  if (isMacdBullish && isPriceAboveSma && hasVolumeSurge) {
    score *= 1.5; // Çok agresif çarpan
    reasons.push('Teknik KUSURSUZ AL');
  } else if (isMacdBullish && isPriceAboveSma) {
    score *= 1.2;
    reasons.push('Teknik GÜÇLÜ AL');
  }

  // Zayıf hisseleri eleme
  if (!isPriceAboveSma && momentum < 0) {
    score = score * 0.2; // Puanını çökert
    reasons.push('Trend Altında');
  }

  return {
    score: Math.max(0, score),
    reason: reasons.join(', ') || 'Veriler Nötr',
    ticker: data.ticker,
    price: close.toFixed(2)
  };
};
