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
    alert("BIST Hisseleri çekilirken hata: " + (error.message || error));
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
            'SMA50',
            'ATR',
            'open',
            'high',
            'low',
            'price_earnings_ttm',
            'return_on_equity',
            'price_book_ratio',
            'change'
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
              sma50: d[9],
              atr: d[10] || (d[0] * 0.03), // Default 3% ATR if missing
              open: d[11],
              high: d[12],
              low: d[13],
              pe: d[14] || null,
              roe: d[15] || null,
              pb: d[16] || null,
              change: d[17] !== undefined ? d[17] : null,
              currentPrice: d[0]
            };
          });
        }
      }
    } catch(err) {
      console.error('TV Batch fetch error:', err);
      alert("TradingView Veri Çekme Hatası: " + (err.message || err));
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
  const hasVolumeSurge = avgVol30 && volume > (avgVol30 * 1.4);

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

  // Düşen Bıçağı Tutmama Filtresi (Trend)
  const isTrendOk = (sma20 && close > sma20) || (macd !== null && macdSignal !== null && macd > macdSignal);

  // RSI
  if (rsi < 30 && isTrendOk) {
    if (isHammer) {
        signals.push({ type: 'Mum+İndikatör', signal: 'Aşırı Satım + Çekiç Mumu', strength: 'Güçlü Al' });
    } else if (isDoji) {
        signals.push({ type: 'Mum+İndikatör', signal: 'Aşırı Satım + Doji (Dönüş)', strength: 'Güçlü Al' });
    } else {
        signals.push({ type: 'İndikatör', signal: 'RSI < 30 (Aşırı Satım)', strength: 'Al' });
    }
  } else if (rsi >= 30 && rsi < 40 && isTrendOk) {
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
    
    // Maksimum Zarar Kes limiti (%7)
    const maxStopPct = 0.07;
    let stopPrice = entryPrice - (atr * 2.0); // 2.0x ATR initial stop
    if (stopPrice < entryPrice * (1 - maxStopPct)) {
        stopPrice = entryPrice * (1 - maxStopPct);
    }
    const targetPrice = entryPrice + (atr * 3.5); // 1:1.75 Risk/Reward

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

// Algorithmic Scoring for Portfolios (Multi-Factor Quant Model)
export const scoreStock = (data, strategy) => {
  if (!data || !data.close) return { score: 0, reason: 'Veri Yetersiz' };

  const { close, volume, avgVol30, perfW, volatility, rsi, macd, macdSignal, sma20, sma50, pe, roe, pb, open, high, low } = data;
  
  let score = 0;
  let reasons = [];

  // ==========================================
  // 1. KESİN RET (RED FLAG) FİLTRELERİ
  // ==========================================
  const currentSma = sma50 || sma20 || close;
  if (close < currentSma) {
      return { score: 0, reason: 'Düşüş Trendi (SMA50 Altı)' };
  }

  
  if (strategy !== 'beta') {
      // Beta (Halka arz / Yeni büyüme) haricinde zarar edenleri at
      if (pe === null || pe < 0 || pe > 30) {
          return { score: 0, reason: `F/K Oranı Uygunsuz (${pe})` };
      }
      if (roe !== null && roe < 0) {
          return { score: 0, reason: 'Özkaynak Kârlılığı Negatif' };
      }
  } else {
      // Beta için F/K null (Yeni halka arz) olabilir ama zarar kesinlikle yasak
      if (pe !== null && pe < 0) {
          return { score: 0, reason: 'Zarar Eden Şirket' };
      }
  }

  // RSI FİLTRESİ
  if (rsi) {
      if (rsi > 75) {
          score -= 30;
          reasons.push('Aşırı Alım (RSI > 75)');
      } else if (rsi >= 40 && rsi <= 70) {
          score += 10;
          reasons.push('Sağlıklı Yükseliş Trendi (RSI)');
      }
  }

  // ==========================================
  // 2. KALİTE (QUALITY) & BİLANÇO SKORU
  // ==========================================
  if (roe && roe >= 20) {
      score += 25;
      reasons.push('Yüksek ROE (Kârlı Büyüme)');
      if (roe > 40) score += 15; // Süper kârlı şirketlere ekstra prim
  }

  if (pe && pe > 0 && pe <= 15) {
      score += 20;
      reasons.push('Ucuz Değerleme (F/K)');
  }

  // ==========================================
  // 3. İVME VE MOMENTUM (Yüksek Getiri Avcısı)
  // ==========================================
  const hasVolumeSurge = avgVol30 > 0 && volume > (avgVol30 * 1.5);
  const isMacdBullish = macd !== null && macdSignal !== null && macd > macdSignal;
  
  if (isMacdBullish) {
      score += 15;
      reasons.push('MACD Pozitif İvme');
  }

  // Sadece düşmüyor diye değil, "Yukarı Patlama" yapma ihtimali olanları (Volatilitesi yukarı yönlü olanları) yakala.
  if (hasVolumeSurge && perfW > 0) {
      score += 25; // Hacimli Yükseliş - Yüzde 100 potansiyeli taşıyan hareketler
      reasons.push('Hacimli Yükseliş Trendi');
  }

  // ==========================================
  // 4. STRATEJİYE ÖZEL ÇARPANLAR (Kati Kurallar)
  // ==========================================
  switch (strategy) {
    case 'alfa':
      // ALFA (Yüksek Volatilite & Roket): Volatilite şartı aranır ve Hacimli Ralli gerekir.
      if (!hasVolumeSurge || perfW < 2 || volatility < 0.03) {
          score -= 40; // İvme veya volatilite yoksa Alfa'ya giremez
      } else {
          score += 25; 
          if (perfW > 5) score += 15; 
      }
      break;
    case 'beta':
      // BETA (Yeni Halka Arz ve Değer Kazanımı): F/K null olabilir, ama haftalık getiri çok yüksek olmalı
      if (perfW < 5) {
          score -= 50; // Değer kazanımı (hızlı yükseliş) yoksa Beta'dan at
      } else {
          score += 25; 
          if (pe === null) score += 15; // Halka arz varsayımı (P/E oluşmamış)
      }
      break;
    case 'katilim':
      // KATILIM (Katılım Endeksi Uyumu / Defansif): Aşırı dalgalanma yasak, kârlı ve PD/DD düşük olmalı
      if (volatility > 0.03 || pb > 3 || pe > 20) {
          score -= 50; // Spekülatif, pahalı veya yüksek dalgalıysa Katılım olamaz
      } else {
          score += 20;
          if (pe > 0 && pe < 15) score += 15; 
      }
      break;
    case 'delta':
      // DELTA (BIST100 Liderleri): Yüksek TL hacmi (Ana tahta) ve MACD AL sinyali
      const volumeInTL = avgVol30 * close;
      if (volumeInTL < 50000000 || !isMacdBullish) { // Sığ hisseleri (50 Milyon TL altı) ele
          score -= 50; 
      } else {
          score += 20;
          if (perfW > 0) score += 15;
      }
      break;
    default:
      break;
  }

  if (reasons.length === 0) reasons.push('Standart Puanlama');

  return {
    score: Math.min(Math.round(score), 100), // Max 100 puan
    reason: reasons.join(' + ')
  };
};

// ==========================================
// ABD (US) PİYASASI FONKSİYONLARI
// ==========================================

export const fetchTVDataForUSStocks = async (tickers) => {
  const chunkSize = 300;
  const chunked = [];
  for (let i = 0; i < tickers.length; i += chunkSize) {
    chunked.push(tickers.slice(i, i + chunkSize));
  }

  const results = {};
  for (const chunk of chunked) {
    try {
      const response = await fetch('/api/tradingview/america/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: { tickers: chunk.map(t => `AMEX:${t}`).concat(chunk.map(t => `NASDAQ:${t}`)).concat(chunk.map(t => `NYSE:${t}`)) },
          columns: [
            'close', 'volume', 'average_volume_30d_calc', 'Perf.W', 'Volatility.D', 
            'RSI', 'MACD.macd', 'MACD.signal', 'EMA20', 'EMA50', 'ATR', 'open', 'high', 'low', 
            'price_earnings_ttm', 'return_on_equity', 'price_book_ratio', 'change'
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          data.data.forEach(item => {
            const t = item.s.split(':')[1];
            if (!results[t] || results[t].volume < item.d[1]) { // Keep the one with highest volume if duplicates exist across exchanges
              const d = item.d;
              results[t] = {
                ticker: t, close: d[0], volume: d[1], avgVol30: d[2], perfW: d[3], volatility: d[4],
                rsi: d[5], macd: d[6], macdSignal: d[7], ema20: d[8], ema50: d[9],
                atr: d[10] || (d[0] * 0.04), // US market slightly more volatile
                open: d[11], high: d[12], low: d[13], pe: d[14] || null, roe: d[15] || null, pb: d[16] || null,
                change: d[17] !== undefined ? d[17] : null, currentPrice: d[0]
              };
            }
          });
        }
      }
    } catch(err) {
      console.error('US TV Batch fetch error:', err);
    }
    await delay(200);
  }
  return results;
};

export const analyzeUSStock = (data) => {
  if (!data || !data.close) return null;
  const { ticker, close, rsi, macd, macdSignal, ema20, ema50, atr, volume, avgVol30 } = data;
  const signals = [];

  const hasVolumeSurge = avgVol30 && volume > (avgVol30 * 1.5); // US Needs bigger volume shocks

  // Trend Filtresi
  const isTrendOk = (ema20 && close > ema20) || (macd !== null && macdSignal !== null && macd > macdSignal);

  // RSI Divergence / Oversold
  if (rsi < 35 && isTrendOk) {
      signals.push({ type: 'İndikatör', signal: 'RSI Aşırı Satım (US)', strength: 'Al' });
  }

  // EMA Golden Cross or Trend Continuation
  if (ema20 && ema50 && ema20 > ema50 && close > ema20) {
      signals.push({ type: 'Trend', signal: 'EMA20 Yükseliş Trendi', strength: 'İzleme' });
  }

  // MACD Momentum
  if (macd !== null && macdSignal !== null && macd > macdSignal && macd < 0) {
      signals.push({ type: 'İndikatör', signal: 'MACD Dipten Dönüş', strength: 'Al' });
  }

  let finalSignals = [];
  for (const s of signals) {
      if (s.strength === 'Al' && hasVolumeSurge) {
          finalSignals.push({ ...s, strength: 'Güçlü Al', signal: s.signal + ' + Hacim Şoku' });
      } else if (s.strength === 'Al') {
          finalSignals.push(s);
      }
  }
  
  finalSignals = finalSignals.filter(s => s.strength === 'Güçlü Al' || s.strength === 'Al');

  if (finalSignals.length > 0) {
    finalSignals.sort((a, b) => b.strength.localeCompare(a.strength));
    const entryPrice = close;
    
    // ABD piyasasında maksimum Zarar Kes limiti (%8)
    const maxStopPct = 0.08;
    let stopPrice = entryPrice - (atr * 4.0); // 4x ATR initial stop due to high volatility
    if (stopPrice < entryPrice * (1 - maxStopPct)) {
        stopPrice = entryPrice * (1 - maxStopPct);
    }
    // 1-2 haftalık hedefler (daha yakın realizasyon)
    const targetPrice = entryPrice + (atr * 6); // 1:2 R:R

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
      indicators: { rsi: rsi ? rsi.toFixed(1) : '-', macd: macd ? macd.toFixed(2) : '-', ema20Status: (ema20 && close > ema20) ? 'Üzerinde' : 'Altında' },
      rr: '1:2'
    };
  }
  return null;
};

export const scoreUSStock = (data, strategy) => {
  if (!data || !data.close) return { score: 0, reason: 'Veri Yetersiz' };
  
  const { close, volume, avgVol30, perfW, rsi, macd, macdSignal, ema20, ema50, pe, roe } = data;
  let score = 0;
  let reasons = [];

  // ==========================================
  // 1. KESİN RET (RED FLAG) FİLTRELERİ
  // ==========================================
  const currentEma = ema50 || ema20 || close;
  if (close < currentEma) {
      return { score: 0, reason: 'Düşüş Trendi (EMA50 Altı)' };
  }
  
  if (strategy !== 'beta') {
      if (pe !== null && (pe < 0 || pe > 45)) { // ABD piyasası için yüksek teknoloji primli olabilir ama sınırı var
          return { score: 0, reason: `F/K Oranı Uygunsuz (${pe})` };
      }
      if (roe !== null && roe < 0) {
          return { score: 0, reason: 'Özkaynak Kârlılığı Negatif' };
      }
  } else {
      if (pe !== null && pe < 0) {
          return { score: 0, reason: 'Zarar Eden Şirket' };
      }
  }

  // RSI FİLTRESİ
  if (rsi) {
      if (rsi > 75) {
          score -= 30;
          reasons.push('Aşırı Alım (RSI > 75)');
      } else if (rsi >= 40 && rsi <= 70) {
          score += 10;
          reasons.push('Sağlıklı Yükseliş Trendi (RSI)');
      }
  }

  // ==========================================
  // 2. KALİTE (QUALITY) & BİLANÇO SKORU
  // ==========================================
  if (roe && roe >= 20) {
      score += 25;
      reasons.push('Yüksek ROE (>%20)');
  }

  if (pe && pe > 0 && pe <= 25) {
      score += 20;
      reasons.push('Makul Değerleme (US)');
  }

  // ==========================================
  // 3. İVME VE MOMENTUM
  // ==========================================
  const hasVolumeSurge = avgVol30 > 0 && volume > (avgVol30 * 1.5);
  const isMacdBullish = macd !== null && macdSignal !== null && macd > macdSignal;
  
  if (isMacdBullish) {
      score += 15;
      reasons.push('MACD Pozitif İvme');
  }

  if (hasVolumeSurge && perfW > 0) {
      score += 25;
      reasons.push('Kurumsal Hacim Desteği');
  }

  // ==========================================
  // 4. STRATEJİYE ÖZEL ÇARPANLAR (Kati Kurallar)
  // ==========================================
  switch (strategy) {
    case 'alfa': // US Growth & Tech Momentum
      if (!hasVolumeSurge || perfW < 2) {
          score -= 50; // Agresif büyüme yoksa Alfa olamaz
      } else {
          score += 25;
          if (roe > 25) score += 15;
      }
      break;
    case 'beta': // US Mid-Cap Breakouts
      if (perfW < 5 || avgVol30 > 15000000) {
          score -= 50; // Devasa dev (Mega-cap) ise Beta olamaz, haftalık %5 altı ise giremez
      } else {
          score += 25;
          if (roe > 15) score += 15; // Sağlam kârlılık
      }
      break;
    case 'delta': // S&P500 Leaders
      if (avgVol30 < 5000000 || !isMacdBullish) {
          score -= 50; // Sığ hisseler giremez
      } else {
          score += 25;
      }
      break;
    default:
      break;
  }

  if (reasons.length === 0) reasons.push('Standart Puanlama');

  return { 
    score: Math.min(Math.round(score), 100), 
    reason: reasons.join(' + ') 
  };
};


export const fetchUSEtfs = async () => {
  try {
    const response = await fetch('/api/tradingview/america/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: [{ left: "type", operation: "in_range", right: ["fund"] }],
        options: { lang: "en" },
        markets: ["america"],
        symbols: { query: { types: [] }, tickers: [] },
        columns: [
          'name', 'description', 'close', 'volume', 'average_volume_30d_calc', 
          'Perf.W', 'Perf.3M', 'Perf.YTD', 'Volatility.D', 'RSI', 'MACD.macd', 'MACD.signal', 'EMA20', 'EMA50'
        ],
        sort: { sortBy: "volume", sortOrder: "desc" },
        range: [0, 1000] // Top 1000 US ETFs by volume
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data.map(item => {
        const d = item.d;
        return {
          ticker: d[0],
          name: d[1],
          close: d[2],
          volume: d[3],
          avgVol30: d[4],
          perfW: d[5],
          perf3M: d[6],
          perfYTD: d[7],
          volatility: d[8],
          rsi: d[9],
          macd: d[10],
          macdSignal: d[11],
          ema20: d[12],
          ema50: d[13]
        };
      });
    }
    return [];
  } catch (error) {
    console.error('US ETF fetch error:', error);
    return [];
  }
};

export const scoreETF = (etf) => {
  if (!etf || !etf.close) return { score: 0, signal: 'Bekle', reason: 'Veri Yetersiz', shortTermOutlook: '', longTermOutlook: '', aiComment: '' };
  
  let score = 0;
  let reasons = [];
  let shortTerm = '';
  let longTerm = '';
  let comment = '';
  
  // Trend Filter (Red Flag)
  const currentEma = etf.ema20 || etf.close;
  if (etf.close < currentEma) {
      score = 20;
      reasons.push('Keyifsiz Bir Trend (EMA Altı)');
      shortTerm = 'Maalesef son günlerde fiyatı ortalamaların altına sarkmış, satıcılar biraz daha baskın görünüyor. Şu an için hava biraz bulutlu.';
      longTerm = 'Eğer bu ETF\'in temsil ettiği sektöre (örneğin teknolojiye veya sağlığa) uzun vadede inanıyorsanız, bu düşüşler "ucuzdan toplamak" için güzel fırsatlar sunabilir. Ama acele etmeyip kademeli almakta fayda var.';
      
      if (etf.rsi && etf.rsi < 30) {
          shortTerm = 'Çok sert bir düşüş yaşamış, artık aşırı satılmış (oversold) görünüyor. Buradan yukarı doğru sürpriz bir tepki yükselişi gelebilir, yakından izlemek lazım.';
          score += 20;
      }
  } else {
      score += 30; // Above EMA20 is a good baseline
      reasons.push('Yüzler Gülüyor (Yükseliş)');
      shortTerm = 'Şu an keyfi gayet yerinde! Ortalamaların üzerinde güvenle süzülüyor, yatırımcıların ilgisi ve alım iştahı yüksek.';
      
      if (etf.perfYTD > 15) {
          longTerm = 'Yılın gözdelerinden biri olmuş! Bu güçlü yükseliş, ETF\'in bulunduğu sektörün işlerinin gerçekten tıkırında olduğunu gösteriyor.';
      } else {
          longTerm = 'Çok uçup kaçmıyor ama sessiz, sakin ve istikrarlı bir şekilde yoluna devam ediyor. Stresten uzak durmak isteyenler için güzel bir yapı.';
      }
  }
  
  // Momentum & Volume
  const hasVolumeSurge = etf.avgVol30 > 0 && etf.volume > (etf.avgVol30 * 1.5);
  const isMacdBullish = etf.macd !== null && etf.macdSignal !== null && etf.macd > etf.macdSignal;
  
  if (isMacdBullish) {
      score += 25;
      reasons.push('Momentum Arkasında');
      shortTerm += ' Ayrıca göstergeler (MACD) rüzgarın iyice arkadan estiğini, alıcıların direksiyona geçtiğini söylüyor.';
  }
  
  if (hasVolumeSurge && etf.perfW > 0) {
      score += 30;
      reasons.push('Büyük Fonlar Alımda');
      shortTerm += ' Bir de hacimde ciddi bir patlama var! Büyük ihtimalle kurumsal yatırımcılar veya büyük fonlar bu ETF\'i toplamaya başlamış.';
  }
  
  if (etf.rsi && etf.rsi > 70) {
      score -= 10;
      reasons.push('Biraz Fazla Şişmiş (RSI 70+)');
      comment = 'Ufak bir uyarı: Son günlerde çok hızlı yükseldiği için fiyatı biraz "şişmiş" (aşırı alım) görünüyor. Yakında ufak bir kâr satışı gelirse şaşırmayın. ';
  }
  
  let signal = 'Tut';
  if (score >= 80) signal = 'Güçlü Al';
  else if (score >= 50) signal = 'Al';
  else if (score < 35) signal = 'Sat / Uzak Dur';
  
  comment += `${signal === 'Güçlü Al' ? 'Yapay Zeka Kararı: Her şey harika görünüyor! Trendi, hacmi ve göstergeleri çok uyumlu. Gönül rahatlığıyla alım düşünülebilecek seviyelerde.' : signal === 'Al' ? 'Yapay Zeka Kararı: Gidişat genel olarak oldukça olumlu. Sepetinize çeşitlilik katmak için buralardan değerlendirmek mantıklı duruyor.' : signal === 'Tut' ? 'Yapay Zeka Kararı: Şu aralar pek net bir yönü yok, biraz kararsız. Elinizde varsa tutabilirsiniz ama yeni alım için suyun biraz daha berraklaşmasını beklemek iyi olur.' : 'Yapay Zeka Kararı: Tablo pek iç açıcı değil. Güç kaybediyor gibi görünüyor, şu anlık uzak durmak veya farklı fırsatlara bakmak daha akıllıca olabilir.'}`;
  
  return {
    score: Math.min(Math.max(score, 0), 100),
    signal,
    reason: reasons.join(' + ') || 'İzleme',
    shortTermOutlook: shortTerm,
    longTermOutlook: longTerm,
    aiComment: comment
  };
};

export const scoreTefasFund = (fund) => {
  if (!fund) return { score: 0, signal: 'Bekle', reason: 'Veri Yetersiz', shortTermOutlook: '', longTermOutlook: '', aiComment: '' };
  
  let score = 0;
  let reasons = [];
  let shortTerm = '';
  let longTerm = '';
  let comment = '';
  
  const { getiri1a, getiri3a, getiriyb, getiri6a, riskDegeri } = fund;

  const getiri1aNum = parseFloat(getiri1a) || 0;
  const getiri3aNum = parseFloat(getiri3a) || 0;
  const getiri6aNum = parseFloat(getiri6a) || 0;
  const getiriybNum = parseFloat(getiriyb) || 0;

  if (getiriybNum < 0) {
      score = 20;
      reasons.push('Yılbaşından Beri Ekside');
      shortTerm = 'Şu sıralar maalesef keyifsiz bir dönemden geçiyor, fiyatlarda biraz baskı var. Henüz toparlanma belirtisi göremiyoruz.';
      longTerm = 'Yılbaşından bu yana yatırımcısını biraz üzmüş. Uzun vade için ekleme yapmak isterseniz acele etmeyip piyasanın sakinleşmesini beklemek daha iyi olabilir.';
      if (getiri1aNum > 0) {
         shortTerm = 'Genel tablo ekside olsa da son 1 ayda ufak bir kıpırdanma var. Acaba dipten dönüş başlıyor olabilir mi? Göz ucuyla takip etmekte fayda var.';
         score += 20;
      }
  } else {
      if (getiri3aNum > 20) {
          score += 35;
          reasons.push('Harika Bir Çeyrek (3 Ay)');
          shortTerm = 'Son 3 ayda adeta şov yapmış! İvmesi çok yüksek, rüzgarı arkasına almış gidiyor. Ancak bu kadar hızlı çıkışların ufak düzeltmeleri (kâr satışları) olabileceğini unutmayın.';
      } else if (getiri3aNum > 10) {
          score += 20;
          reasons.push('Güzel İvme (3 Ay)');
          shortTerm = 'Gayet sağlıklı ve istikrarlı bir şekilde yükseliyor. Ne çok hızlı ne çok yavaş, tam tadında bir trendi var.';
      } else if (getiri3aNum < 0 && getiri1aNum < 0) {
          shortTerm = 'Son aylarda biraz yorulmuş gibi görünüyor. Belki soluklanmak için geri çekiliyor olabilir, şu an bir bekle-gör durumunda.';
      } else {
          shortTerm = 'Bugünlerde çok belirgin bir yönü yok, daha çok yatay bir seyirde takılıyor. Belki yakında bir yöne kırılım yapar.';
      }

      if (getiriybNum > 40) {
          score += 30;
          reasons.push('Yılın Yıldızı');
          longTerm = 'Yılbaşından bu yana muazzam kazandırmış! Görünen o ki fon yöneticileri işini çok iyi yapıyor ve seçtikleri tema şu an piyasanın gözdesi.';
      } else if (getiriybNum > 20) {
          score += 15;
          longTerm = 'Uzun vadede yüzleri güldüren, enflasyona ezdirmeyen sağlam bir performansı var. Kenarda birikim yapmak için güzel bir seçenek.';
      } else {
          longTerm = 'Yılbaşından beri fena değil ama banka faizi veya diğer risksiz araçlara kıyasla biraz geride kalmış. Belki ilerleyen dönemde açılır.';
      }
  }

  if (getiri6aNum > 25 && getiri1aNum > 0) {
      score += 20;
      reasons.push('İstikrarlı Orta Vade');
  }

  if (riskDegeri && parseInt(riskDegeri) < 4 && getiri3aNum > 10) {
      score += 15;
      reasons.push('Hem Güvenli Hem Kazançlı');
      comment = 'Bu fon tam anlamıyla "az risk, öz getiri" sunuyor. Geceleri rahat uyumak isteyen, parasını yavaş ama güvenli büyütmek isteyenler için harika bir liman. ';
  } else if (riskDegeri && parseInt(riskDegeri) >= 6) {
      comment = 'Bu fon biraz heyecan arayanlar için! Piyasalar iyiyken çok ciddi paralar kazandırabilir ama işler tersine döndüğünde sizi üzebilir. Portföyünüzün tamamını değil de küçük bir kısmını ayırmak daha sağlıklı olur. ';
  } else {
      comment = 'Ne çok riskli ne de çok muhafazakar; tam ortada, dengeli bir fon. Her portföyde bulunabilecek standart bir yapıya sahip. ';
  }

  let signal = 'Tut';
  if (score >= 80) signal = 'Güçlü Al';
  else if (score >= 50) signal = 'Al';
  else if (score < 35) signal = 'Sat / Uzak Dur';
  
  comment += `${signal === 'Güçlü Al' ? 'Yapay zekanın kararı net: Her şey tıkır tıkır işliyor, trend harika. Yeni alımlar için oldukça iştah açıcı görünüyor.' : signal === 'Al' ? 'Genel gidişat pozitif, ufak tefek pürüzler olsa da sepetinize eklemeyi düşünebilirsiniz.' : signal === 'Tut' ? 'Şu an ne tam almalık ne de satmalık. Elinizde varsa tutun ama yeni alım için biraz daha netleşmesini beklemek iyi olabilir.' : 'Açıkçası şu an pek ışık vermiyor. Paranızı daha iyi kazandıran fırsatlara yönlendirmek isteyebilirsiniz.'}`;
  
  return {
    score: Math.min(Math.max(score, 0), 100),
    signal,
    reason: reasons.join(' + ') || 'İzleme',
    shortTermOutlook: shortTerm,
    longTermOutlook: longTerm,
    aiComment: comment
  };
};

export const fetchTefasFunds = async () => {
  try {
    const response = await fetch('/api/tefas/api/funds/fonGetiriBazliBilgiGetir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        'dil': 'TR',
        'fonTipi': 'YAT',
        'kurucuKodu': null,
        'sfonTurKod': null,
        'fonTurAciklama': null,
        'islem': 1,
        'fonTurKod': null,
        'fonGrubu': null,
        'donemGetiri1a': '1',
        'donemGetiri3a': '1',
        'donemGetiri6a': '1',
        'donemGetiri1y': '1',
        'donemGetiriyb': '1',
        'donemGetiri3y': '1',
        'donemGetiri5y': '1',
        'basTarih': null,
        'bitTarih': null,
        'calismaTipi': 2,
        'getiriOrani': '1'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.resultList && data.resultList.length > 0) {
          return data.resultList.map(item => ({
              ticker: item.fonKodu,
              name: item.fonUnvan,
              type: item.fonTurAciklama,
              getiri1a: item.getiri1a,
              getiri3a: item.getiri3a,
              getiri6a: item.getiri6a,
              getiri1y: item.getiri1y,
              getiriyb: item.getiriyb,
              riskDegeri: item.riskDegeri,
              close: null,
              volume: null,
          }));
      }
    }
    return [];
  } catch (error) {
    console.error('TEFAS API fetch error:', error);
    return [];
  }
};



export const fetchRealBalanceSheet = async (marketMode, tickers) => {
  const isUS = marketMode === 'ABD';
  const endpoint = isUS ? '/api/tradingview/america/scan' : '/api/tradingview/turkey/scan';
  
  const chunkSize = 300;
  const chunked = [];
  for (let i = 0; i < tickers.length; i += chunkSize) {
    chunked.push(tickers.slice(i, i + chunkSize));
  }

  let allData = [];
  for (const chunk of chunked) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: { tickers: isUS ? chunk.flatMap(t => [`AMEX:${t}`, `NASDAQ:${t}`, `NYSE:${t}`]) : chunk.map(t => `BIST:${t}`) },
          columns: ['name', 'price_earnings_ttm', 'price_book_ratio', 'net_income', 'total_revenue', 'ebitda', 'return_on_equity', 'Recommend.All'],
          sort: { sortBy: 'volume', sortOrder: 'desc' },
          range: [0, 1000]
        })
      });
      
      if (!response.ok) continue;
      const data = await response.json();
      if (data && data.data) {
        allData = allData.concat(data.data.map(item => {
          const d = item.d;
          return {
            ticker: item.s.split(':')[1],
            name: d[0] || item.s.split(':')[1],
            pe: d[1],
            pb: d[2],
            netProfit: d[3],
            totalRevenue: d[4],
            ebitda: d[5],
            roe: d[6],
            analystScore: d[7] // -1 to 1
          };
        }));
      }
    } catch (e) {
      console.error('Balance sheet fetch error', e);
    }
  }
  
  if (isUS) {
    const unique = {};
    for (const item of allData) {
      if (!unique[item.ticker]) unique[item.ticker] = item;
    }
    allData = Object.values(unique);
  }
  return allData;
};

export const scoreBalanceSheet = (item) => {
  let score = 50;
  let reasons = [];
  
  if (item.pe && item.pe > 0 && item.pe < 10) { score += 15; reasons.push('Cazip F/K'); }
  else if (item.pe > 25) { score -= 15; reasons.push('Yüksek F/K'); }
  
  if (item.pb && item.pb > 0 && item.pb < 2) { score += 10; reasons.push('Uygun PD/DD'); }
  else if (item.pb > 5) { score -= 10; reasons.push('Primli PD/DD'); }
  
  if (item.roe && item.roe > 20) { score += 15; reasons.push('Yüksek Özsermaye Kârlılığı'); }
  else if (item.roe && item.roe < 0) { score -= 10; reasons.push('Negatif Kârlılık'); }

  if (item.analystScore > 0.5) { score += 10; reasons.push('Güçlü Analist Görünümü'); }
  else if (item.analystScore < -0.1) { score -= 10; reasons.push('Zayıf Beklenti'); }

  score = Math.min(Math.max(score, 0), 100);
  
  let sentiment = 'Nötr';
  let color = 'gray';
  if (score >= 70) { sentiment = 'Güçlü Pozitif'; color = 'emerald'; }
  else if (score >= 55) { sentiment = 'Pozitif'; color = 'emerald'; }
  else if (score < 40) { sentiment = 'Negatif'; color = 'rose'; }
  
  const aiComment = `${reasons.length > 0 ? reasons.join(', ') : 'Standart finansallar'} baz alındığında, yapay zeka modelimiz bu bilanço için ${sentiment.toLowerCase()} bir görünüm tespit etti.`;
  
  return { score, sentiment, color, aiComment };
};
