import React, { useMemo, useState } from 'react';
import { Wallet, TrendingUp, Target, Zap, Shield, Sparkles, PieChart, Activity, DollarSign, LayoutDashboard, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, ReferenceLine } from 'recharts';

const STRATEGIES = {
  alfa: { name: 'ALFA', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', fill: '#f59e0b' },
  beta: { name: 'BETA', icon: Sparkles, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', fill: '#06b6d4' },
  katilim: { name: 'KATILIM', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', fill: '#10b981' },
  delta: { name: 'DELTA', icon: Shield, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', fill: '#ec4899' }
};

const CustomTooltip = ({ active, payload, label, currency: tooltipCurrency }) => {
  if (active && payload && payload.length) {
    const cur = tooltipCurrency || (payload[0].payload.market === 'ABD' ? '$' : '₺');
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
        <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="text-sm font-mono text-gray-600 dark:text-gray-300">
          Değer: <span className="font-bold">{cur}{payload[0].value.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </p>
        {payload[0].payload.profit !== undefined && (
           <p className={`text-sm font-mono font-bold mt-1 ${payload[0].payload.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
             Kâr: {payload[0].payload.profit >= 0 ? '+' : ''}{cur}{payload[0].payload.profit.toLocaleString('tr-TR', {minimumFractionDigits: 2})}
           </p>
        )}
      </div>
    );
  }
  return null;
};

const WalletDashboard = ({ portfolios, activeSwingTrades, pastSwingTrades, marketMode }) => {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const isUSD = marketMode === 'ABD';
  const currency = isUSD ? '$' : '₺';
  const MONTHLY_CAPITAL = isUSD ? 2000 : 100000;
  const SWING_CAPITAL = isUSD ? 1000 : 2000;

  const realizedSwingProfit = useMemo(() => {
      if (!pastSwingTrades || pastSwingTrades.length === 0) return 0;
      const targetPerStock = SWING_CAPITAL / 5;
      return pastSwingTrades.reduce((sum, trade) => {
          const pnl = parseFloat(trade.pnlPercent) || 0;
          return sum + (targetPerStock * (pnl / 100));
      }, 0);
  }, [pastSwingTrades, SWING_CAPITAL]);

  const currentTotalSwingCapital = SWING_CAPITAL + realizedSwingProfit;

  // Swing verilerini hazırla (Eşit Dağılım)
  const swingData = useMemo(() => {
      if (!activeSwingTrades || activeSwingTrades.length === 0) return { list: [], chart: [], totalCost: 0, currentValue: 0, cash: currentTotalSwingCapital };
      
      const targetPerStock = SWING_CAPITAL / 5; // Kasayı 5'e böl (Maksimum 5 hisse kuralına göre)
      let list = [];
      let chart = [];
      let totalCost = 0;
      let currentValue = 0;

      activeSwingTrades.forEach(trade => {
          const entry = parseFloat(trade.entry);
          const current = parseFloat(trade.currentPrice);
          let lots = Math.floor(targetPerStock / entry);
          
          if (lots === 0 && (currentTotalSwingCapital - totalCost) >= entry) {
             lots = 1;
          }
          
          if (lots * entry > (currentTotalSwingCapital - totalCost)) {
              lots = Math.floor((currentTotalSwingCapital - totalCost) / entry);
          }
          
          if (lots > 0) {
              const cost = lots * entry;
              let value = lots * current;
              
              // 4 dolar komisyonu hesaba kat
              const commission = isUSD ? 4 : 0;
              const profit = value - cost - commission;
              const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
              
              totalCost += cost;
              currentValue += value - commission; // Portföy değerinden komisyonu düşerek yansıt

              list.push({ ticker: trade.ticker, lots, cost, value, profit });
              chart.push({ name: trade.ticker, value, profit, profitPct: parseFloat(profitPct.toFixed(1)) });
          }
      });

      return {
          list,
          chart,
          totalCost,
          currentValue,
          cash: currentTotalSwingCapital - totalCost
      };
  }, [activeSwingTrades, SWING_CAPITAL, currentTotalSwingCapital]);

      // --- GLOBAL SUMMARIES ---
      let totalPortfolioCost = 0;
      let totalPortfolioValue = 0;
      let portfolioSummaries = [];
      
      ['alfa', 'beta', 'katilim', 'delta'].forEach(key => {
        const p = portfolios[key];
        if (p) {
           let cost = 0;
           let val = 0;
           p.forEach(s => {
              const lots = s.lots || 0;
              if(lots > 0) {
                 cost += lots * parseFloat(s.costPrice || 0);
                 val += lots * parseFloat(s.price || 0);
              }
           });
           totalPortfolioCost += cost;
           totalPortfolioValue += val;
           
           const cash = MONTHLY_CAPITAL - cost;
           const finalVal = val + cash;
           const prof = finalVal - MONTHLY_CAPITAL;
           portfolioSummaries.push({
               id: key,
               name: STRATEGIES[key].name,
               profit: prof,
               profitPct: (prof / MONTHLY_CAPITAL) * 100,
               value: finalVal,
               color: STRATEGIES[key].color,
               bg: STRATEGIES[key].bg,
               fill: STRATEGIES[key].fill,
               icon: STRATEGIES[key].icon
           });
        }
      });
    
      const totalMonthlyAllocated = MONTHLY_CAPITAL * 4; 
      const totalMonthlyCurrent = (totalMonthlyAllocated - totalPortfolioCost) + totalPortfolioValue;
    
      const swingFinalValue = swingData.currentValue + swingData.cash;
      const globalTotalAllocated = totalMonthlyAllocated + SWING_CAPITAL;
      const globalTotalCurrent = totalMonthlyCurrent + swingFinalValue;
      const globalProfit = globalTotalCurrent - globalTotalAllocated;
      const globalProfitPct = (globalProfit / globalTotalAllocated) * 100;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* GLOBAL HEADER & TABS */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20"><Wallet className="w-6 h-6 text-indigo-500" /></div>
              Portföy Yönetimi
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
              Sistemdeki toplam yatırımlarınızın güncel durumunu tek ekranda takip edin.
            </p>
          </div>
          
          {/* Global Net Worth Badge */}
          <div className="bg-gray-50/80 dark:bg-gray-950/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-4 rounded-xl flex items-center gap-6 min-w-[280px]">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Toplam Bakiye</p>
              <p className="text-2xl font-black font-mono text-gray-900 dark:text-white">{currency}{globalTotalCurrent.toLocaleString('tr-TR', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
            </div>
            <div className={`flex flex-col items-end px-3 py-1.5 rounded-lg border ${globalProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              <span className={`text-sm font-bold font-mono ${globalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {globalProfit >= 0 ? '+' : ''}{globalProfitPct.toFixed(2)}%
              </span>
              <span className={`text-xs font-bold font-mono ${globalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {globalProfit >= 0 ? '+' : ''}{currency}{globalProfit.toLocaleString('tr-TR', {minimumFractionDigits:2, maximumFractionDigits:2})}
              </span>
            </div>
          </div>
        </div>

        {/* SUB TABS */}
        <div className="flex items-center gap-2 mt-8 border-b border-gray-100 dark:border-gray-800 pb-0">
          <button 
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'overview' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
            <LayoutDashboard className="w-4 h-4" />
            Genel Bakış
          </button>
          <button 
            onClick={() => setActiveSubTab('portfolios')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'portfolios' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
            <Briefcase className="w-4 h-4" />
            Aylık Portföyler
          </button>
          <button 
            onClick={() => setActiveSubTab('swing')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'swing' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
            <TrendingUp className="w-4 h-4" />
            Swing Trade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* =========================================
            OVERVIEW TAB 
        ========================================= */}
        {activeSubTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {portfolioSummaries.map(p => {
               const Icon = p.icon;
               return (
                 <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden" onClick={() => setActiveSubTab('portfolios')}>
                    <div className={`absolute top-0 right-0 w-24 h-24 ${p.bg} rounded-full blur-2xl -mr-10 -mt-10 opacity-40`}></div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                       <div className="flex items-center gap-2">
                           <div className={`p-2 rounded-lg ${p.bg}`}><Icon className={`w-4 h-4 ${p.color}`} /></div>
                           <span className="font-bold text-gray-900 dark:text-white">{p.name}</span>
                       </div>
                       <span className={`text-xs font-bold font-mono px-2 py-1 rounded-md ${p.profit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                         {p.profit >= 0 ? '+' : ''}{p.profitPct.toFixed(2)}%
                       </span>
                    </div>
                    <div className="relative z-10">
                       <p className="text-2xl font-black font-mono text-gray-900 dark:text-white">{currency}{p.value.toLocaleString('tr-TR', {minimumFractionDigits:0, maximumFractionDigits:0})}</p>
                       <p className="text-xs text-gray-500 font-medium mt-1">Hedef: {currency}{MONTHLY_CAPITAL.toLocaleString('tr-TR')}</p>
                    </div>
                 </div>
               )
             })}
             
             {/* SWING SUMMARY CARD */}
             <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden" onClick={() => setActiveSubTab('swing')}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-40`}></div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                   <div className="flex items-center gap-2">
                       <div className={`p-2 rounded-lg bg-blue-500/10`}><TrendingUp className={`w-4 h-4 text-blue-500`} /></div>
                       <span className="font-bold text-gray-900 dark:text-white">SWING</span>
                   </div>
                   <span className={`text-xs font-bold font-mono px-2 py-1 rounded-md ${(swingFinalValue - SWING_CAPITAL) >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                     {(swingFinalValue - SWING_CAPITAL) >= 0 ? '+' : ''}{(((swingFinalValue - SWING_CAPITAL) / SWING_CAPITAL)*100).toFixed(2)}%
                   </span>
                </div>
                <div className="relative z-10">
                   <p className="text-2xl font-black font-mono text-gray-900 dark:text-white">{currency}{swingFinalValue.toLocaleString('tr-TR', {minimumFractionDigits:0, maximumFractionDigits:0})}</p>
                   <p className="text-xs text-gray-500 font-medium mt-1">Hedef: {currency}{SWING_CAPITAL.toLocaleString('tr-TR')}</p>
                </div>
             </div>
          </div>
        )}

        {/* =========================================
            PORTFOLIOS TAB 
        ========================================= */}
        {activeSubTab === 'portfolios' && ['alfa', 'beta', 'katilim', 'delta'].map(key => {
          const portfolio = portfolios[key];
          if (!portfolio) return null;
          const info = STRATEGIES[key];
          const Icon = info.icon;
          
          let currentValue = 0;
          let totalCost = 0;
          let chartData = [];
          
          portfolio.forEach(stock => {
              const lots = stock.lots || 0;
              if (lots === 0) return; // Sıfır lotlu hisseleri yoksay
              const cost = lots * parseFloat(stock.costPrice || 0);
              const current = lots * parseFloat(stock.price || 0);
              const profit = current - cost;
              const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
              totalCost += cost;
              currentValue += current;
              
              chartData.push({ name: stock.ticker, value: current, profit, profitPct: parseFloat(profitPct.toFixed(1)) });
          });
          
          const cash = MONTHLY_CAPITAL - totalCost;
          const finalValue = currentValue + cash;
          const profit = finalValue - MONTHLY_CAPITAL;
          const profitPct = (profit / MONTHLY_CAPITAL) * 100;

          return (
            <div key={key} className={`bg-white dark:bg-gray-900 border ${info.border} rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${info.bg} rounded-full blur-3xl -mr-10 -mt-10 opacity-50`}></div>
              
              {/* Sol Taraf: Liste ve Özet */}
              <div className="relative z-10 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${info.bg}`}><Icon className={`w-5 h-5 ${info.color}`} /></div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.name} Portföyü</h3>
                      </div>
                      <div className={`text-sm font-bold w-[90px] flex justify-center px-3 py-1.5 rounded-lg border ${profit >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'}`}>
                          {profit >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Başlangıç</p>
                          <p className="text-lg font-mono font-medium text-gray-900 dark:text-white">{currency}{MONTHLY_CAPITAL.toLocaleString('tr-TR')}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Güncel Değer</p>
                          <p className={`text-lg font-mono font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {currency}{finalValue.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </p>
                      </div>
                  </div>

                  <div className="flex-1 overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl mb-4 bg-white dark:bg-gray-950/30">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 uppercase">
                              <tr>
                                  <th className="px-3 py-2">Hisse</th>
                                  <th className="px-3 py-2 text-right">Adet (Lot)</th>
                                  <th className="px-3 py-2 text-right">Maliyet Tutarı</th>
                                  <th className="px-3 py-2 text-right">Güncel Değer</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {portfolio.filter(s => (s.lots || 0) > 0).map((stock, i) => {
                                  const cost = (stock.lots || 0) * parseFloat(stock.costPrice || 0);
                                  const curr = (stock.lots || 0) * parseFloat(stock.price || 0);
                                  return (
                                      <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                          <td className="px-3 py-2 font-bold">{stock.ticker}</td>
                                          <td className="px-3 py-2 text-right font-mono text-gray-600 dark:text-gray-300">{stock.lots}</td>
                                          <td className="px-3 py-2 text-right font-mono">{currency}{cost.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                                          <td className={`px-3 py-2 text-right font-mono font-bold ${curr >= cost ? 'text-emerald-500' : 'text-rose-500'}`}>
                                              {currency}{curr.toLocaleString('tr-TR', {minimumFractionDigits:2})}
                                          </td>
                                      </tr>
                                  );
                              })}
                              {portfolio.filter(s => (s.lots || 0) > 0).length === 0 && (
                                  <tr>
                                      <td colSpan="4" className="px-3 py-6 text-center text-gray-500">
                                          Bakiye yetersizliğinden dolayı bu portföye henüz hisse alınamadı. Nakitte bekliyor.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm px-1">
                      <span className="text-gray-600 dark:text-gray-300 font-mono">Boştaki Nakit: {currency}{cash.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                      <span className={`font-bold font-mono ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          Net Kâr/Zarar: {profit >= 0 ? '+' : ''}{currency}{profit.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                  </div>
              </div>

              {/* Sağ Taraf: Sütun Grafiği */}
              <div className="flex-1 min-h-[250px] lg:min-h-full border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-900/30 p-2 relative z-10 flex flex-col">
                  <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2 ml-2">Net Kâr/Zarar Dağılımı ({currency})</h4>
                  <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 35, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.3} />
                              <ReferenceLine y={0} stroke="#4b5563" strokeWidth={0.5} strokeOpacity={0.5} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} tickFormatter={(value) => `${currency}${value.toLocaleString('tr-TR')}`} />
                              <Tooltip content={<CustomTooltip currency={currency} />} cursor={{fill: 'rgba(107, 114, 128, 0.1)'}} />
                              <Bar isAnimationActive={false} dataKey="profit" radius={[4, 4, 4, 4]} minPointSize={8} maxBarSize={60}>
                                  <LabelList dataKey="profitPct" position="top" formatter={(val) => {
                                      if (val === undefined || isNaN(val)) return '';
                                      return val > 0 ? `+%${val}` : (val < 0 ? `-%${Math.abs(val)}` : `%0`);
                                  }} fontSize={15} fontWeight="900" fill={document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#374151'} />
                                  {chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={info.fill} opacity={entry.profit >= 0 ? 1 : 0.6} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

            </div>
          );
        })}

        {/* =========================================
            SWING TRADE TAB 
        ========================================= */}
        {activeSubTab === 'swing' && (() => {
            const finalValue = swingData.currentValue + swingData.cash;
            const profit = finalValue - currentTotalSwingCapital;
            const profitPct = (profit / currentTotalSwingCapital) * 100;
            const totalReturn = finalValue - SWING_CAPITAL;
            const totalReturnPct = (totalReturn / SWING_CAPITAL) * 100;
            
            return (
                <div className="bg-white dark:bg-gray-900 border border-blue-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col lg:flex-row gap-6 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
                    
                    <div className="relative z-10 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/10"><TrendingUp className="w-5 h-5 text-blue-500" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Swing Trade Kasası</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`text-sm font-bold w-[90px] flex justify-center px-3 py-1.5 rounded-lg border ${profit >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'}`}>
                                    {profit >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Başlangıç Kasası</p>
                                <p className="text-lg font-mono font-medium text-gray-900 dark:text-white">{currency}{SWING_CAPITAL.toLocaleString('tr-TR')}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Toplam Büyüme</p>
                                <p className={`text-lg font-mono font-bold ${realizedSwingProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {realizedSwingProfit >= 0 ? '+' : ''}{currency}{realizedSwingProfit.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Güncel Kasa</p>
                                <p className={`text-lg font-mono font-bold ${totalReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {currency}{finalValue.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </p>
                                <span className={`text-xs font-bold ${totalReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Getiri: {totalReturn >= 0 ? '+' : ''}%{totalReturnPct.toFixed(2)}</span>
                            </div>
                        </div>


                        <div className="flex-1 overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl mb-4 bg-white dark:bg-gray-950/30">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 uppercase">
                                    <tr>
                                        <th className="px-3 py-2">Hisse</th>
                                        <th className="px-3 py-2 text-right">Adet</th>
                                        <th className="px-3 py-2 text-right">Maliyet Tutarı</th>
                                        <th className="px-3 py-2 text-right">Güncel Değer</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {swingData.list.map((stock, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                            <td className="px-3 py-2 font-bold">{stock.ticker}</td>
                                            <td className="px-3 py-2 text-right font-mono text-gray-600 dark:text-gray-300">{stock.lots}</td>
                                            <td className="px-3 py-2 text-right font-mono">{currency}{stock.cost.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                                            <td className={`px-3 py-2 text-right font-mono font-bold ${stock.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {currency}{stock.value.toLocaleString('tr-TR', {minimumFractionDigits:2})}
                                            </td>
                                        </tr>
                                    ))}
                                    {swingData.list.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-3 py-6 text-center text-gray-500">
                                                Şu an aktif hisse yok. Tüm bakiye nakitte bekliyor.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm px-1">
                            <span className="text-gray-600 dark:text-gray-300 font-mono">Boştaki Nakit: {currency}{swingData.cash.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                            <span className={`font-bold font-mono ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                Net Kâr/Zarar: {profit >= 0 ? '+' : ''}{currency}{profit.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[250px] lg:min-h-full border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-900/30 p-2 relative z-10 flex flex-col">
                        <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2 ml-2">Swing Net Kâr/Zarar Dağılımı ({currency})</h4>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={swingData.chart} margin={{ top: 35, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.3} />
                                    <ReferenceLine y={0} stroke="#4b5563" strokeWidth={0.5} strokeOpacity={0.5} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} tickFormatter={(value) => `${currency}${value.toFixed(0)}`} />
                                    <Tooltip content={<CustomTooltip currency={currency} />} cursor={{fill: 'rgba(107, 114, 128, 0.1)'}} />
                                    <Bar isAnimationActive={false} dataKey="profit" radius={[4, 4, 4, 4]} minPointSize={8} maxBarSize={60}>
                                        <LabelList dataKey="profitPct" position="top" formatter={(val) => {
                                            if (val === undefined || isNaN(val)) return '';
                                            return val > 0 ? `+%${val}` : (val < 0 ? `-%${Math.abs(val)}` : `%0`);
                                        }} fontSize={15} fontWeight="900" fill={document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#374151'} />
                                        {swingData.chart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#3b82f6" opacity={entry.profit >= 0 ? 1 : 0.6} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            );
        })()}
      </div>
    </div>
  );
};

export default WalletDashboard;
