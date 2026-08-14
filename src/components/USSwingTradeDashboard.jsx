import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Activity, Clock, Target, ShieldAlert, Loader2
} from 'lucide-react';
import { fetchAllUSTickers, fetchTVDataForUSStocks, analyzeStock } from '../services/marketData';

export default function USSwingTradeDashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [usUniverse, setUsUniverse] = useState([]);
  
  const [activeSwingTrades, setActiveSwingTrades] = useState(() => {
    const saved = localStorage.getItem('us_activeSwingTrades');
    return saved ? JSON.parse(saved) : [];
  });
  const activeSwingTradesRef = useRef(activeSwingTrades);
  
  const [pastSwingTrades, setPastSwingTrades] = useState(() => {
    const saved = localStorage.getItem('us_pastSwingTrades');
    return saved ? JSON.parse(saved) : [];
  });
  const pastSwingTradesRef = useRef(pastSwingTrades);
  const scannerInterval = useRef(null);

  useEffect(() => {
    activeSwingTradesRef.current = activeSwingTrades;
    localStorage.setItem('us_activeSwingTrades', JSON.stringify(activeSwingTrades));
  }, [activeSwingTrades]);

  useEffect(() => {
    pastSwingTradesRef.current = pastSwingTrades;
    localStorage.setItem('us_pastSwingTrades', JSON.stringify(pastSwingTrades));
  }, [pastSwingTrades]);

  const scanMarket = async (currentUniverse, isOnlyActive = false) => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours + (minutes / 100);

    // US Market Hours in TSİ roughly: 16:30 - 23:00 (Can be adjusted for daylight savings)
    const isOpen = (day > 0 && day < 6) && (time >= 16.3 && time <= 23.0); 

    if (!isOpen) {
      setLastUpdate('Piyasa Kapalı (Tarama Durduruldu)');
      return;
    }

    setIsScanning(true);
    
    try {
      const safeUniverse = Array.isArray(currentUniverse) ? currentUniverse : [];
      const subset = isOnlyActive ? [] : [...safeUniverse].sort(() => 0.5 - Math.random()).slice(0, 30);
      const currentActive = Array.isArray(activeSwingTradesRef.current) ? activeSwingTradesRef.current : [];
      const activeTickers = currentActive.map(t => t.fullTicker || t.ticker);
      const tickersToFetch = [...new Set([...subset, ...activeTickers])];
      
      const tvDataMap = (await fetchTVDataForUSStocks(tickersToFetch)) || {};
      
      let tradesToClose = [];
      let updatedActiveTrades = [...currentActive];
      
      // 1. Process Active Trades
      for (let i = updatedActiveTrades.length - 1; i >= 0; i--) {
        const trade = updatedActiveTrades[i];
        const data = tvDataMap[trade.ticker];
        
        if (data && data.close) {
          const currentP = data.close;
          trade.currentPrice = currentP.toFixed(2);
          
          const targetP = parseFloat(trade.target);
          const stopP = parseFloat(trade.stop);
          const atr = parseFloat(trade.atr) || (currentP * 0.03);
          
          // Trailing Stop Logic: Stop loss follows the price up (Max of old stop and currentPrice - 1.5 ATR)
          const newTrailingStop = currentP - (atr * 1.5);
          if (newTrailingStop > stopP) {
              trade.stop = newTrailingStop.toFixed(2);
          }
          
          // Check exits
          if (currentP >= targetP) {
             trade.exitReason = 'Hedef (Kâr Al)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = 'WIN';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString(); // For cooldown
             tradesToClose.push(trade);
             updatedActiveTrades.splice(i, 1);
          } else if (currentP <= parseFloat(trade.stop)) {
             trade.exitReason = 'Stop (Zarar Kes)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = 'LOSS';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString(); // For cooldown
             tradesToClose.push(trade);
             updatedActiveTrades.splice(i, 1);
          }
        }
      }
      
      if (tradesToClose.length > 0) {
         setPastSwingTrades(prev => [...tradesToClose, ...prev]);
      }

      // 2. Process New Signals and Auto-Buy (Only if we fetched new subset)
      if (!isOnlyActive) {
          for (const ticker of subset) {
            // we use the symbol (e.g. AAPL) to lookup in tvDataMap
            const parts = ticker.split(':');
            const symbol = parts[1] || ticker;
            const data = tvDataMap[symbol];
            if (data) {
              const signal = analyzeStock(data);
              if (signal) {
                // Auto-buy logic (Max 5 trades)
                if (signal.strength === 'Güçlü Al' && updatedActiveTrades.length < 5) {
                    if (!updatedActiveTrades.find(t => t.ticker === signal.ticker)) {
                        
                        // Cooldown Check: Son 24 saatte satılan hisseyi tekrar alma!
                        const currentPastTrades = pastSwingTradesRef.current;
                        const isCooldown = currentPastTrades.some(past => 
                            past.ticker === signal.ticker && 
                            past.exitDate && 
                            (new Date() - new Date(past.exitDate)) < 24 * 60 * 60 * 1000
                        );
                        
                        if (!isCooldown) {
                            updatedActiveTrades.push({
                                ...signal,
                                currentPrice: signal.entry
                            });
                        }
                    }
                }
              }
            }
          }
      }
      
      setActiveSwingTrades(updatedActiveTrades);
      setLastUpdate(new Date().toLocaleTimeString('tr-TR'));
    } catch (error) {
      console.error("ABD Tarama hatası:", error);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const allTickers = await fetchAllUSTickers();
      setUsUniverse(allTickers);
      
      // Start scanner
      scanMarket(allTickers, false);
      
      scannerInterval.current = setInterval(() => {
        const currentActiveTrades = activeSwingTradesRef.current;
        if (currentActiveTrades.length < 5) {
           // Boşluk var: Tüm evreni tara (30'luk rastgele parça)
           scanMarket(allTickers, false);
        } else {
           // Kontenjan dolu: SADECE elimizdeki hisseleri (hedef/stop için) tara
           scanMarket(currentActiveTrades.map(t => t.fullTicker || t.ticker), true);
        }
      }, 10000);
    };

    init();
    return () => clearInterval(scannerInterval.current);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl relative overflow-hidden">
        {isScanning && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 overflow-hidden">
             <div className="h-full bg-blue-500 w-1/3 animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            ABD Swing Trade Fırsatları
          </h2>
          <p className="text-base text-gray-800 dark:text-gray-400 mt-1">
            S&P 500 ve NASDAQ evrenindeki hisseler <strong>GERÇEK PİYASA VERİLERİ (15dk gecikmeli)</strong> ile taranır. İndikatör kırılımları ve mum formasyonları analiz edilerek listelenir.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isScanning && <span className="text-sm text-blue-400 animate-pulse flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Piyasa Taranıyor...</span>}
          <div className="flex items-center gap-2 text-base bg-gray-50 dark:bg-gray-950 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
            <Clock className="w-4 h-4 text-gray-800 dark:text-gray-400" />
            <span className="text-gray-800 dark:text-gray-400">Son Sinyal:</span>
            <span className="text-gray-900 dark:text-white font-mono font-medium">{lastUpdate || 'Bekleniyor...'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Aktif Swing İşlemleri <span className="text-sm font-medium text-gray-500">({activeSwingTrades.length}/5)</span>
          </h3>
          {isScanning && <span className="text-xs text-blue-500 animate-pulse flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> İzleniyor...</span>}
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px] text-base text-left">
            <thead className="text-sm text-gray-800 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50 uppercase border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Sembol</th>
                <th className="px-6 py-4 font-semibold">Giriş Fiyatı ($)</th>
                <th className="px-6 py-4 font-semibold">Anlık Fiyat ($)</th>
                <th className="px-6 py-4 font-semibold text-rose-600 dark:text-rose-500">Stop (İzleyen)</th>
                <th className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-500">Hedef</th>
                <th className="px-6 py-4 font-semibold text-right">Kâr/Zarar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {activeSwingTrades.length > 0 ? (
                activeSwingTrades.map((trade, i) => {
                  const pnl = (((parseFloat(trade.currentPrice) - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
                  const isProfit = parseFloat(pnl) >= 0;
                  return (
                    <tr key={i} className="hover:bg-gray-100/40 dark:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-gray-900 dark:text-white text-xl block">{trade.ticker}</span>
                          <span className="text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-md border border-blue-500/30 shadow-sm">{trade.signal}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500">{trade.entry}</td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white">{trade.currentPrice}</td>
                      <td className="px-6 py-4 font-mono font-medium text-rose-500">{trade.stop}</td>
                      <td className="px-6 py-4 font-mono font-medium text-emerald-500">{trade.target}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex justify-center items-center gap-1 font-mono font-bold w-[90px] px-2 py-1 rounded border ${parseFloat(pnl) > 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : parseFloat(pnl) < 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                          {parseFloat(pnl) > 0 ? '+' : ''}{pnl}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Aktif işlem bulunmuyor. Piyasa taranıyor, güçlü bir sinyal geldiğinde otomatik alım yapılacaktır...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg opacity-90">
         <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            İşlem Geçmişi & Performans
          </h3>
          {pastSwingTrades.length > 0 && (() => {
            const wins = pastSwingTrades.filter(t => t.status === 'WIN').length;
            const losses = pastSwingTrades.length - wins;
            const winRate = ((wins / pastSwingTrades.length) * 100).toFixed(0);
            return (
              <div className="flex flex-wrap gap-2 text-sm font-bold">
                <span className="px-3 py-1 bg-gray-800 rounded-md text-white">İşlem: {pastSwingTrades.length}</span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-md">Kâr: {wins}</span>
                <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-md">Zarar: {losses}</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-md">Kazanma Oranı: %{winRate}</span>
              </div>
            );
          })()}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-700 dark:text-gray-500 bg-gray-100 dark:bg-gray-950/30 uppercase border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Sembol</th>
                <th className="px-6 py-3 font-semibold">Sonuç</th>
                <th className="px-6 py-3 font-semibold">Giriş / Çıkış</th>
                <th className="px-6 py-3 font-semibold">Kâr/Zarar</th>
                <th className="px-6 py-3 font-semibold text-right">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {pastSwingTrades.length > 0 ? (
                pastSwingTrades.map((trade, i) => (
                  <tr key={i} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-3 font-bold text-gray-900 dark:text-gray-300">{trade.ticker}</td>
                    <td className="px-6 py-3">
                      {trade.status === 'WIN' ? (
                        <span className="text-emerald-500 flex items-center gap-1"><Target className="w-3 h-3"/> {trade.exitReason}</span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> {trade.exitReason}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-600 dark:text-gray-400">{trade.entry} ➔ {trade.exitPrice}</td>
                    <td className="px-6 py-3">
                       <span className={`font-mono font-bold ${parseFloat(trade.pnlPercent) > 0 ? 'text-emerald-500' : parseFloat(trade.pnlPercent) < 0 ? 'text-rose-500' : 'text-blue-500'}`}>
                         {parseFloat(trade.pnlPercent) > 0 ? '+' : ''}{trade.pnlPercent}%
                       </span>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-500">{trade.exitTime}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Henüz tamamlanmış bir işlem bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
