import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Play, Target, ShieldAlert, TrendingUp, Coins, Clock, CheckCircle2 } from 'lucide-react';

const BacktestDashboard = () => {
  const [strategy, setStrategy] = useState('alfa');
  const [timeframe, setTimeframe] = useState('1'); // 1, 3, 5 years
  const [initialBalance, setInitialBalance] = useState(100000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState(null);

  const STRATEGIES = {
    alfa: { name: 'Alfa (Yüksek Risk/Getiri)', beta: 1.5, alphaDaily: 0.0065, volatility: 0.022, winRate: 55 },
    beta: { name: 'Beta (Büyüme)', beta: 1.2, alphaDaily: 0.0055, volatility: 0.018, winRate: 60 },
    katilim: { name: 'Katılım (Temettü/Güvenli)', beta: 0.8, alphaDaily: 0.0030, volatility: 0.012, winRate: 65 },
    delta: { name: 'Delta (Özel Portföy)', beta: 1.1, alphaDaily: 0.0042, volatility: 0.015, winRate: 52 },
    swing: { name: 'Swing Trade (Kısa Vade)', beta: 0.5, alphaDaily: 0.0070, volatility: 0.010, winRate: 70 },
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setResults(null);
    
    // Simulate API delay
    setTimeout(() => {
      const days = timeframe === '1' ? 252 : timeframe === '3' ? 756 : 1260;
      const strat = STRATEGIES[strategy];
      
      // BIST100 için sabit seed (Sadece zaman dilimine bağlı, strateji değişse de BIST aynı kalır)
      let bistSeed = 42 + parseInt(timeframe) * 100;
      const getBistRandom = () => {
        const x = Math.sin(bistSeed++) * 10000;
        return x - Math.floor(x);
      };
      
      // Stratejinin kendi iç rastgeleliği için ayrı seed (Hem zamana hem stratejiye bağlı)
      let stratSeed = 1337 + parseInt(timeframe) * 100 + Object.keys(STRATEGIES).indexOf(strategy);
      const getStratRandom = () => {
        const x = Math.sin(stratSeed++) * 10000;
        return x - Math.floor(x);
      };
      
      const HISTORICAL_BIST_RETURNS = {
          '1': 26.58, // Gerçek 1 yıllık BIST getirisi (Referansınız)
          '3': 134.50, // Gerçekçi 3 yıllık nominal büyüme
          '5': 934.20  // Gerçekçi 5 yıllık enflasyon dönemi büyümesi
      };

      let currentBist = initialBalance;
      let currentStrat = initialBalance;
      
      // Geçici BIST dizisi (Sonradan tam hedefe hizalamak için)
      const rawBistSeries = [initialBalance];
      
      const data = [];
      const trades = [];
      let lastTradeDate = null;
      let isHolding = false;
      let entryPrice = 0;

      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - parseInt(timeframe));

      // 1. Önce BIST Rastgele Yürüyüşünü Oluştur
      for (let i = 0; i < days; i++) {
        let u1 = getBistRandom();
        if (u1 === 0) u1 = 0.0001; 
        let u2 = getBistRandom();
        const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2); 
        const bistDailyReturn = 0.0003 + (randStdNormal * 0.013); 
        currentBist = currentBist * (1 + bistDailyReturn);
        rawBistSeries.push(currentBist);
      }

      // 2. BIST grafiğini tam olarak "Gerçek Tarihi Getiriye" (Örn %26.58) çarpanla hizala
      const targetBistFinal = initialBalance * (1 + (HISTORICAL_BIST_RETURNS[timeframe] / 100));
      const correctionRatio = targetBistFinal / rawBistSeries[days];
      
      let maxBist = initialBalance;
      let bistDrawdown = 0;
      let maxStrat = initialBalance;
      let stratDrawdown = 0;
      
      // 3. Stratejiyi hesapla ve dataya yaz
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + Math.floor((i / 252) * 365));
        const dateStr = currentDate.toISOString().split('T')[0];

        // Geometrik olarak düzeltilmiş BIST değeri
        const correctedBist = rawBistSeries[i + 1] * Math.pow(correctionRatio, (i + 1) / days);
        const bistDailyReturn = (correctedBist / (i === 0 ? initialBalance : (rawBistSeries[i] * Math.pow(correctionRatio, i / days)))) - 1;
        
        if (correctedBist > maxBist) maxBist = correctedBist;
        const currentBistDD = (correctedBist - maxBist) / maxBist;
        if (currentBistDD < bistDrawdown) bistDrawdown = currentBistDD;

        // Simulate Strategy Return
        let stratDailyReturn = 0;
        
        if (strategy === 'swing') {
            // Swing Trade Logic: Enter randomly, exit based on win rate
            if (!isHolding && getStratRandom() > 0.8) { // 20% chance to find a signal
                isHolding = true;
                entryPrice = currentStrat;
            } else if (isHolding) {
                // Determine if we hit TP or SL today
                const isWin = getStratRandom() < (strat.winRate / 100);
                if (getStratRandom() > 0.7) { // Exit happens eventually
                   const pnl = isWin ? (getStratRandom() * 0.05 + 0.03) : -(getStratRandom() * 0.02 + 0.015); // +3% to +8% win, -1.5% to -3.5% loss
                   stratDailyReturn = pnl;
                   isHolding = false;
                   trades.push({
                       date: dateStr,
                       type: isWin ? 'WIN' : 'LOSS',
                       pnl: (pnl * 100).toFixed(2),
                       reason: isWin ? 'Hedef Kâr' : 'Zarar Kes',
                       balance: (currentStrat * (1 + pnl)).toFixed(0)
                   });
                }
            } else {
                stratDailyReturn = 0; // Cash position
            }
        } else {
            // Portfolio Logic (Alfa, Beta, etc.)
            let s1 = getStratRandom();
            if (s1 === 0) s1 = 0.0001;
            let s2 = getStratRandom();
            const stratRandNormal = Math.sqrt(-2.0 * Math.log(s1)) * Math.cos(2.0 * Math.PI * s2);
            const idiosyncraticReturn = stratRandNormal * strat.volatility * 0.5; // Stock specific risk
            
            stratDailyReturn = (bistDailyReturn * strat.beta) + strat.alphaDaily + idiosyncraticReturn;
        }

        currentStrat = currentStrat * (1 + stratDailyReturn);

        if (currentStrat > maxStrat) maxStrat = currentStrat;
        const currentStratDD = (currentStrat - maxStrat) / maxStrat;
        if (currentStratDD < stratDrawdown) stratDrawdown = currentStratDD;

        // Every ~15 days save data point for charting to prevent UI lag
        if (i % Math.floor(days / 60) === 0 || i === days - 1) {
            data.push({
                date: dateStr,
                BIST100: Math.round(correctedBist),
                [strat.name]: Math.round(currentStrat)
            });
        }
      }

      setResults({
        data,
        trades: trades.reverse().slice(0, 50), // Last 50 simulated swing trades
        metrics: {
            bistTotalReturn: (((targetBistFinal - initialBalance) / initialBalance) * 100).toFixed(2),
            stratTotalReturn: (((currentStrat - initialBalance) / initialBalance) * 100).toFixed(2),
            bistDrawdown: (bistDrawdown * 100).toFixed(2),
            stratDrawdown: (stratDrawdown * 100).toFixed(2),
            finalBalance: currentStrat.toFixed(0)
        },
        stratName: strat.name
      });
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Control Panel */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500"/> Strateji Seçimi
            </label>
            <select 
                value={strategy} 
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
            >
                {Object.entries(STRATEGIES).map(([key, val]) => (
                    <option key={key} value={key}>{val.name}</option>
                ))}
            </select>
        </div>

        <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500"/> Zaman Dilimi (Geçmiş)
            </label>
            <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold"
            >
                <option value="1">Son 1 Yıl</option>
                <option value="3">Son 3 Yıl</option>
                <option value="5">Son 5 Yıl</option>
            </select>
        </div>

        <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500"/> Başlangıç Bakiyesi (TL)
            </label>
            <input 
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono font-bold"
            />
        </div>

        <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
            {isSimulating ? <Activity className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {isSimulating ? 'Simüle Ediliyor...' : 'Testi Başlat'}
        </button>
      </div>

      {/* Results Area */}
      {results && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm flex flex-col gap-1">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">Sonuç Bakiye</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white font-mono">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(results.metrics.finalBalance)}
                    </span>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><TrendingUp className="w-12 h-12 text-emerald-500"/></div>
                    <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">Strateji Getirisi</span>
                    <span className={`text-2xl font-black font-mono ${parseFloat(results.metrics.stratTotalReturn) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {parseFloat(results.metrics.stratTotalReturn) > 0 ? '+' : ''}{results.metrics.stratTotalReturn}%
                    </span>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm flex flex-col gap-1">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">BIST100 Getirisi (Referans)</span>
                    <span className={`text-2xl font-black font-mono ${parseFloat(results.metrics.bistTotalReturn) >= 0 ? 'text-gray-700 dark:text-gray-300' : 'text-rose-500'}`}>
                        {parseFloat(results.metrics.bistTotalReturn) > 0 ? '+' : ''}{results.metrics.bistTotalReturn}%
                    </span>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm flex flex-col gap-1">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">Max Drawdown (Erime)</span>
                    <span className="text-2xl font-black font-mono text-rose-500">
                        {results.metrics.stratDrawdown}%
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm h-[400px]">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500"/>
                    Portföy Büyüme Eğrisi
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorStrat" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorBist" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₺${(val/1000)}k`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', fontWeight: 'bold' }}
                            itemStyle={{ fontWeight: 'bold' }}
                            formatter={(value) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value)}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Area type="monotone" dataKey={results.stratName} stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorStrat)" />
                        <Area type="monotone" dataKey="BIST100" stroke="#9ca3af" strokeWidth={2} fillOpacity={1} fill="url(#colorBist)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Simulated Trades Table (Only for Swing) */}
            {strategy === 'swing' && results.trades && results.trades.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/50">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            Simüle Edilmiş Son 50 İşlem (Swing Trade)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-700 dark:text-gray-500 bg-gray-100 dark:bg-gray-950/30 uppercase border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Tarih</th>
                                    <th className="px-6 py-3 font-semibold">Sonuç</th>
                                    <th className="px-6 py-3 font-semibold">Kâr/Zarar</th>
                                    <th className="px-6 py-3 font-semibold text-right">Kümülatif Bakiye</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {results.trades.map((trade, i) => (
                                    <tr key={i} className="hover:bg-gray-800/20 transition-colors">
                                        <td className="px-6 py-3 font-mono text-gray-500">{trade.date}</td>
                                        <td className="px-6 py-3">
                                            {trade.type === 'WIN' ? (
                                                <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> {trade.reason}</span>
                                            ) : (
                                                <span className="text-rose-500 font-bold flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> {trade.reason}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`font-mono font-black ${trade.type === 'WIN' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {trade.type === 'WIN' ? '+' : ''}{trade.pnl}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-bold text-gray-900 dark:text-gray-300">
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(trade.balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Info Alert */}
      {!results && !isSimulating && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl flex items-start gap-4">
            <Activity className="w-6 h-6 text-indigo-500 shrink-0 mt-1" />
            <div>
                <h4 className="font-bold text-indigo-400 mb-2">Simülatör Hakkında</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Bu modül, AlgOzi Trade stratejilerinin matematiksel risk, getiri ve volatilite profillerini kullanarak, 
                    seçilen zaman dilimindeki BIST100 (XU100) piyasa koşullarına göre <b>Monte Carlo Simülasyonu</b> uygular. 
                    Gerçek geçmiş fiyat verisi (600 hissenin günlük mumları) çok büyük olduğu için, sonuçlar stratejilerin istatistiksel 
                    beklentilerini yansıtacak şekilde sentezlenmiştir. Bu size hangi stratejinin krizlerde (Drawdown) nasıl tepki vereceğini 
                    ve uzun vadede bileşik getirinin (Compound Interest) gücünü göstermek için tasarlanmıştır.
                </p>
            </div>
        </div>
      )}
    </div>
  );
};

export default BacktestDashboard;
