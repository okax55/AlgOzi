import React from 'react';
import { Activity, Clock, AlertCircle, TrendingUp, Loader2, Zap } from 'lucide-react';

export default function MomentumSwingTradeDashboard({ activeTrades, pastTrades, isScanning, lastUpdate, marketMode }) {
  const currency = marketMode === 'ABD' ? '$' : '₺';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl relative overflow-hidden">
        {isScanning && (
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gray-100 dark:bg-gray-800/50 overflow-hidden z-10">
             <div className="h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent w-1/2 animate-radar-scan drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Momentum Swing Trade
          </h2>
          <p className="text-base text-gray-800 dark:text-gray-400 mt-1">
            {marketMode === 'BIST' 
              ? 'BIST hisselerinde %5-10 Kâr hedeflenerek "Vur-Kaç" (Momentum) stratejisi uygulanır. Süre sonu (Zaman Stopu): 5 İş Günü.'
              : 'ABD hisselerinde %5-10 Kâr hedeflenerek "Vur-Kaç" (Momentum) stratejisi uygulanır. Süre sonu (Zaman Stopu): 5 İş Günü.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {isScanning && (
            <div className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-ring z-10"></div>
              <span className="text-xs font-black text-emerald-500 tracking-widest uppercase z-10">Yapay Zeka Taraması</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent w-full animate-radar-scan"></div>
            </div>
          )}
          {lastUpdate && lastUpdate.includes('Piyasa Kapalı') ? (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-500 shadow-sm">
              <AlertCircle className="w-5 h-5 animate-pulse" />
              <span className="text-base font-bold">{lastUpdate}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-base bg-gray-50 dark:bg-gray-950 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
              <Clock className="w-4 h-4 text-gray-800 dark:text-gray-400" />
              <span className="text-gray-800 dark:text-gray-400 dark:text-gray-400">Son Sinyal:</span>
              <span className="text-gray-900 dark:text-white font-mono font-medium">{lastUpdate || 'Bekleniyor...'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Aktif Momentum İşlemleri <span className="text-sm font-medium text-gray-500">({activeTrades.length}/5)</span>
          </h3>
          <div className="flex items-center gap-3">
            {isScanning && (
              <span className="text-xs text-emerald-500 animate-pulse flex items-center gap-1 font-bold">
                <Loader2 className="w-3 h-3 animate-spin"/> Taranıyor...
              </span>
            )}
            {lastUpdate && lastUpdate.includes('Piyasa Kapalı') ? (
               <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/80 border border-gray-700/50 rounded-full shadow-inner">
                 <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                 <span className="text-xs font-bold text-gray-400 tracking-wider">VERİ AKIŞI DURDURULDU</span>
               </div>
            ) : (
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                 <div className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </div>
                 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">Canlı Veri</span>
               </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px] text-base text-left">
            <thead className="text-sm text-gray-800 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50 uppercase border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Sembol</th>
                <th className="px-6 py-4 font-semibold">Giriş Fiyatı</th>
                <th className="px-6 py-4 font-semibold">Anlık Fiyat</th>
                <th className="px-6 py-4 font-semibold text-rose-600 dark:text-rose-500">Stop (Zarar Kes)</th>
                <th className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-500">Hedef (Kâr Al)</th>
                <th className="px-6 py-4 font-semibold text-right">Kâr/Zarar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {activeTrades.length > 0 ? (
                activeTrades.map((trade, i) => {
                  const pnl = (((parseFloat(trade.currentPrice) - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
                  return (
                    <tr key={i} className="hover:bg-gray-100/40 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-gray-900 dark:text-white text-xl block">{trade.ticker}</span>
                          <span className="text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-md border border-indigo-500/30 shadow-sm">{trade.signal || 'Momentum'}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Giriş: {trade.entryDate ? new Date(trade.entryDate).toLocaleDateString('tr-TR') : ''}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500">{currency}{trade.entry}</td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white">{currency}{trade.currentPrice}</td>
                      <td className="px-6 py-4 font-mono font-medium text-rose-500">{currency}{trade.stop}</td>
                      <td className="px-6 py-4 font-mono font-medium text-emerald-500">{currency}{trade.target}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex justify-center items-center gap-1 font-mono font-bold w-[90px] px-2 py-1 rounded border ${parseFloat(pnl) >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                          {parseFloat(pnl) >= 0 ? '+' : ''}{pnl}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-5">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin opacity-80"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-emerald-400 animate-[spin_1.5s_reverse_infinite] opacity-60"></div>
                            <Zap className="w-8 h-8 text-emerald-500 animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Momentum Motoru Devrede</h4>
                            <p className="text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                              AlgOzi yapay zekası patlama ihtimali yüksek hisseleri tarıyor. Fırsat bulunduğunda işleme alınacaktır.
                            </p>
                        </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {true && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg mt-8 opacity-80">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Geçmiş İşlemler</h3>
             {(() => {
                const wins = pastTrades.filter(t => t.status === 'WIN' || parseFloat(t.pnlPercent) > 0).length;
                const losses = pastTrades.filter(t => t.status === 'LOSS' && parseFloat(t.pnlPercent) <= 0).length;
                const total = wins + losses;
                const winRate = total > 0 ? ((wins / total) * 100).toFixed(0) : 0;
                
                const isUSD = marketMode === 'ABD';
                const swingCapital = isUSD ? 1000 : 2000;
                const positionSize = swingCapital / 5;
                
                let totalNetCash = 0;
                pastTrades.forEach(t => {
                   const pnl = parseFloat(t.pnlPercent) || 0;
                   totalNetCash += positionSize * (pnl / 100);
                });
                const totalNetPct = (totalNetCash / swingCapital) * 100;
                
                return (
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm ${totalNetCash >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                       <span className={`text-sm font-bold uppercase tracking-wider ${totalNetCash >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                           Kazanç:
                       </span>
                       <span className={`text-xl font-black font-mono ${totalNetCash >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                           {totalNetCash >= 0 ? '+' : ''}{currency}{totalNetCash.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                       </span>
                       <span className={`text-base font-bold ${totalNetPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                           ({totalNetPct >= 0 ? '+' : ''}%{totalNetPct.toFixed(2)})
                       </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="px-2.5 py-1 bg-gray-200 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300">İşlem: {total}</span>
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md">Kâr: {wins}</span>
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-md">Zarar: {losses}</span>
                      <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-md">Win Rate: %{winRate}</span>
                    </div>
                  </div>
                );
             })()}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Sembol</th>
                  <th className="px-4 py-3 font-medium">Giriş/Çıkış</th>
                  <th className="px-4 py-3 font-medium">Neden</th>
                  <th className="px-4 py-3 font-medium text-right">Kâr/Zarar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pastTrades && pastTrades.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      Henüz geçmiş işlem bulunmamaktadır.
                    </td>
                  </tr>
                )}
                {pastTrades && pastTrades.slice(0, 15).map((trade, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-xs text-gray-500 font-medium">
                       <div className="flex flex-col gap-0.5 whitespace-nowrap">
                           <span><span className="text-gray-400">G:</span> {trade.entryTime || (trade.entryDate ? new Date(trade.entryDate).toLocaleString('tr-TR') : '-')}</span>
                           <span><span className="text-gray-400">Ç:</span> {trade.exitDate ? new Date(trade.exitDate).toLocaleDateString('tr-TR') + ' ' + (trade.exitTime || '') : trade.exitTime || '-'}</span>
                       </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900 dark:text-gray-200">{trade.ticker}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono">
                      {currency}{trade.entry} <span className="text-gray-300 dark:text-gray-600">→</span> {currency}{trade.exitPrice}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const isProfit = parseFloat(trade.pnlPercent) > 0;
                        const label = isProfit && trade.exitReason && trade.exitReason.includes('Stop') ? 'İzleyen Stop (Kâr)' : trade.exitReason;
                        const isWin = trade.status === 'WIN' || isProfit;
                        
                        return (
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${
                            isWin ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono font-bold ${parseFloat(trade.pnlPercent) > 0 ? 'text-emerald-500' : parseFloat(trade.pnlPercent) < 0 ? 'text-rose-500' : 'text-gray-500'}`}>
                         {parseFloat(trade.pnlPercent) > 0 ? '+' : ''}{trade.pnlPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
