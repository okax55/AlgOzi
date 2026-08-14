const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add fetchExplosiveUSStocks to imports
content = content.replace(
  /fetchTVDataForUSStocks, analyzeUSStock, scoreUSStock \} from '.\/services\/marketData';/,
  "fetchTVDataForUSStocks, fetchExplosiveUSStocks, analyzeUSStock, scoreUSStock } from './services/marketData';"
);

// 2. Replace scanUSMarket
const oldScanUSStart = "  const scanUSMarket = useCallback(async (currentUniverse, isOnlyActive = false) => {";
const oldScanUSEndStr = "  }, [isScanning]);\n\n  useEffect(() => {\n    const init = async () => {"; 
const startIndex = content.indexOf(oldScanUSStart);
const endIndex = content.indexOf(oldScanUSEndStr);

if (startIndex === -1 || endIndex === -1) {
  console.log('Failed to find scanUSMarket boundaries.');
  console.log('Start index:', startIndex, 'End index:', endIndex);
  process.exit(1);
}

const newScanUSMarket = `  const scanUSMarket = useCallback(async (currentUniverse, isOnlyActive = false) => {
    if (isScanning) return;
    
    // US Market Hours Check
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() + (now.getMinutes() / 60);
    const isOpen = (day > 0 && day < 6) && (time >= 16.5 && time <= 23.0); // 16:30 - 23:00 TR

    if (!isOpen) {
      return;
    }

    try {
      const currentActive = Array.isArray(activeUsSwingTradesRef.current) ? activeUsSwingTradesRef.current : [];
      const isCapacityFull = currentActive.length >= 5;
      
      let tvDataMap = {};
      const activeTickers = currentActive.map(t => t.ticker);
      
      // 1. Önce aktif hisselerin güncel verilerini çek
      if (activeTickers.length > 0) {
         const activeData = await fetchTVDataForUSStocks(activeTickers);
         if (activeData) {
             Object.assign(tvDataMap, activeData);
         }
      }

      // 2. Eğer kapasite dolu değilse patlayıcı hisseleri tara (dinamik)
      let newSubset = [];
      if (!isOnlyActive && !isCapacityFull) {
          const nowMs = Date.now();
          if (!window._lastUsExplosiveScan || nowMs - window._lastUsExplosiveScan > 5 * 60 * 1000) {
              window._lastUsExplosiveScan = nowMs;
              const explosiveData = await fetchExplosiveUSStocks();
              if (explosiveData) {
                  Object.assign(tvDataMap, explosiveData);
                  newSubset = Object.keys(explosiveData);
              }
          }
      }
      
      if (Object.keys(tvDataMap).length === 0) return;
      
      let historyEventsUS = [];
      let updatedActiveTrades = [...currentActive];
      
      // 1. Process Active Trades
      for (let i = updatedActiveTrades.length - 1; i >= 0; i--) {
        const trade = updatedActiveTrades[i];
        const data = tvDataMap[trade.ticker];
        
        if (data && data.close) {
          const currentP = data.close;
          trade.currentPrice = currentP.toFixed(2);
          
          const atr = parseFloat(trade.atr) || (currentP * 0.04);
          const entryP = parseFloat(trade.entry);

          // Momentum Sıkı İzleyen Stop: Sınırsız Kâr (Kârı Koru), %3 Başlangıç Stopu
          if (!trade.highestPrice || currentP > parseFloat(trade.highestPrice)) {
              trade.highestPrice = currentP.toFixed(2);
          }
          const highestP = parseFloat(trade.highestPrice);
          const profitPct = ((highestP - entryP) / entryP) * 100;
          
          let trailingDistance;
          if (profitPct >= 2.0) {
              trailingDistance = highestP * 0.015;
          } else {
              trailingDistance = highestP * 0.03;
          }
          
          const newStop = highestP - trailingDistance;
          if (!trade.stop || newStop > parseFloat(trade.stop)) {
              trade.stop = newStop.toFixed(2);
          }
          const stopP = parseFloat(trade.stop);
          
          trade.target = (entryP * 2.0).toFixed(2);
          
          let isTimeStop = false;
          if (trade.entryDate) {
              const entryDate = new Date(trade.entryDate).getTime();
              const nowTime = new Date().getTime();
              const diffDays = (nowTime - entryDate) / (1000 * 60 * 60 * 24);
              if (diffDays >= 7) {
                  isTimeStop = true;
              }
          }
          
          if (currentP <= stopP) {
             const actualProfitPct = ((currentP - entryP) / entryP) * 100;
             trade.exitReason = actualProfitPct > 0 ? 'İzleyen Stop (Kâr)' : 'Stop (Zarar Kes)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = actualProfitPct.toFixed(2);
             trade.status = actualProfitPct > 0 ? 'WIN' : 'LOSS';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString();
             historyEventsUS.push(trade);
             updatedActiveTrades.splice(i, 1);
          } else if (isTimeStop) {
             trade.exitReason = 'Süre Sonu (Zaman Stopu)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = parseFloat(trade.pnlPercent) > 0 ? 'WIN' : 'LOSS';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString();
             historyEventsUS.push(trade);
             updatedActiveTrades.splice(i, 1);
          }
        }
      }
      
      if (historyEventsUS.length > 0) {
         setPastUsSwingTrades(prev => {
             const newHistory = [...historyEventsUS, ...prev];
             pastUsSwingTradesRef.current = newHistory;
             saveToFirebase('pastUsSwingTrades', newHistory);
             return newHistory;
         });
      }

      // 2. Process New Signals and Auto-Buy
      if (newSubset.length > 0) {
          const newSignals = [];
          for (const ticker of newSubset) {
            const data = tvDataMap[ticker];
            if (data) {
              const signal = analyzeUSStock(data);
              if (signal) {
                signal.score = scoreUSStock(data, 'alfa').score;
                newSignals.push(signal);
              }
            }
          }
          
          newSignals.sort((a, b) => b.score - a.score);

          for (const signal of newSignals) {
              if (updatedActiveTrades.length >= 5) break;
              
              if (signal.strength === 'Güçlü Al' || signal.strength === 'Al') {
                  if (!updatedActiveTrades.find(t => t.ticker === signal.ticker)) {
                      const currentPastTrades = pastUsSwingTradesRef.current;
                      const isCooldown = currentPastTrades.some(past => 
                          past.ticker === signal.ticker && 
                          past.exitDate && 
                          (new Date() - new Date(past.exitDate)) < 24 * 60 * 60 * 1000
                      );
                      
                      if (!isCooldown) {
                          const nowObj = new Date();
                          updatedActiveTrades.push({
                              ...signal,
                              currentPrice: signal.entry,
                              entryTime: nowObj.toLocaleDateString('tr-TR') + ' ' + nowObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                              entryDate: nowObj.toISOString(),
                              highestPrice: signal.entry
                          });
                      }
                  }
              }
          }
      }
      
      setActiveUsSwingTrades(updatedActiveTrades);
      
    } catch (error) {
      console.error("US Tarama hatası:", error);
    }
`;

content = content.substring(0, startIndex) + newScanUSMarket + content.substring(endIndex);

// 3. Update the UI rendering bug
const oldDashboardRender = `<MomentumSwingTradeDashboard
              activeTrades={currentActiveSwingTrades}
              pastTrades={currentPastSwingTrades}
              isScanning={isScanning}
              lastUpdate={lastUpdate}
              marketMode={marketMode}
            />`;

const newDashboardRender = `{(() => {
              // US piyasası kapalıysa lastUpdate'i eziyoruz
              const now = new Date();
              const day = now.getDay();
              const time = now.getHours() + (now.getMinutes() / 60);
              const isUsOpen = (day > 0 && day < 6) && (time >= 16.5 && time <= 23.0);
              const displayLastUpdate = marketMode === 'ABD' && !isUsOpen 
                  ? 'ABD Piyasası Kapalı (Tarama Durduruldu)' 
                  : lastUpdate;

              return (
                <MomentumSwingTradeDashboard
                  activeTrades={marketMode === 'BIST' ? currentActiveSwingTrades : currentActiveUsSwingTrades}
                  pastTrades={marketMode === 'BIST' ? currentPastSwingTrades : currentPastUsSwingTrades}
                  isScanning={isScanning}
                  lastUpdate={displayLastUpdate}
                  marketMode={marketMode}
                />
              );
            })()}`;

content = content.replace(oldDashboardRender, newDashboardRender);

fs.writeFileSync('src/App.jsx', content);
console.log('Successfully updated App.jsx for US explosive screener');
