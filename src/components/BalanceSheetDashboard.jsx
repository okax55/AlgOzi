import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, TrendingDown, Minus, Zap, ChevronDown, ChevronUp, Users, MessageSquare, Target, Activity, Loader2 } from 'lucide-react';
import { fetchRealBalanceSheet, scoreBalanceSheet } from '../services/marketData';
import { BIST100 } from '../data/bistUniverse';
import { US_UNIVERSE_ALL } from '../data/usUniverse';

const formatLargeNumber = (num, isUS) => {
  if (num === null || num === undefined) return '-';
  const currency = isUS ? '$' : '₺';
  const val = Math.abs(num);
  let formatted = '';
  if (val >= 1e9) {
    formatted = (val / 1e9).toFixed(1) + ' Milyar';
  } else if (val >= 1e6) {
    formatted = (val / 1e6).toFixed(1) + ' Milyon';
  } else {
    formatted = val.toLocaleString();
  }
  
  return num < 0 ? `-${formatted} ${currency}` : `${formatted} ${currency}`;
};

export default function BalanceSheetDashboard({ marketMode }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const isUS = marketMode === 'ABD';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const tickersToFetch = isUS ? US_UNIVERSE_ALL : BIST100;
      // Sadece 50 tane çekelim hızı artırmak için, ya da tamamı
      const fetched = await fetchRealBalanceSheet(marketMode, tickersToFetch.slice(0, 50));
      
      const processed = fetched.map(item => {
        const score = scoreBalanceSheet(item);
        const formatNum = (n) => formatLargeNumber(n, isUS);
        
        return {
          ticker: item.ticker,
          name: item.name,
          pe: item.pe ? item.pe.toFixed(2) : '-',
          pb: item.pb ? item.pb.toFixed(2) : '-',
          netProfit: formatNum(item.netProfit),
          totalRevenue: formatNum(item.totalRevenue),
          ebitda: formatNum(item.ebitda),
          roe: item.roe ? item.roe.toFixed(2) + '%' : '-',
          trend: score.score > 60 ? 'up' : (score.score < 40 ? 'down' : 'neutral'),
          analystSentiment: score.sentiment,
          aiComment: score.aiComment
        };
      });
      
      // Kârlılığa göre sırala
      processed.sort((a, b) => {
         const getVal = (s) => parseFloat(s.replace(/[^0-9.-]+/g,"")) || 0;
         return getVal(b.netProfit) - getVal(a.netProfit);
      });
      
      setData(processed);
      setLoading(false);
    };
    loadData();
  }, [marketMode, isUS]);

  const toggleRow = (id) => {
      if (expandedRow === id) setExpandedRow(null);
      else setExpandedRow(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent border border-purple-500/20 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="z-10">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-500" />
            Bilanço ve Finansal Analiz ({isUS ? 'ABD' : 'TR'})
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-400 mt-2 max-w-2xl">
            {isUS 
              ? 'S&P 500 ve NASDAQ 100 şirketlerinin canlı finansal verileri, çarpanları ve yapay zeka analizleri.' 
              : 'BIST 100 şirketlerinin canlı finansal verileri, çarpanları ve yapay zeka beklenti analizleri.'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-purple-600 dark:text-purple-400 font-bold animate-pulse">Canlı Bilanço Verileri Çekiliyor...</p>
          </div>
        )}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse relative min-w-[1000px]">
            <thead className="bg-gray-50 dark:bg-gray-900/90 backdrop-blur-md text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Hisse Bilgisi</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Net Kâr</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">F/K</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">PD/DD</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Trend</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">AI Puanı</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.map((item) => (
                <React.Fragment key={item.ticker}>
                  <tr 
                    onClick={() => toggleRow(item.ticker)}
                    className={`group hover:bg-purple-50/50 dark:hover:bg-purple-900/10 cursor-pointer transition-all duration-200 ${expandedRow === item.ticker ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                          <span className="font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-500">
                            {item.ticker.substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                            {item.ticker}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5 truncate max-w-[150px]">
                            {item.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 text-right">
                      <div className="font-bold text-gray-900 dark:text-white text-base">{item.netProfit}</div>
                      <div className="text-xs text-gray-500 mt-1">Ciro: {item.totalRevenue}</div>
                    </td>
                    
                    <td className="px-6 py-5 text-right">
                      <div className="font-bold text-gray-900 dark:text-white">{item.pe}</div>
                    </td>
                    
                    <td className="px-6 py-5 text-right">
                      <div className="font-bold text-gray-900 dark:text-white">{item.pb}</div>
                    </td>
                    
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        <div className={`p-2 rounded-lg ${
                          item.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' :
                          item.trend === 'down' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-gray-500/10 text-gray-500'
                        }`}>
                          {item.trend === 'up' && <TrendingUp className="w-5 h-5" />}
                          {item.trend === 'down' && <TrendingDown className="w-5 h-5" />}
                          {item.trend === 'neutral' && <Minus className="w-5 h-5" />}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                        item.analystSentiment.includes('Pozitif') || item.analystSentiment.includes('Olumlu') ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        item.analystSentiment.includes('Negatif') || item.analystSentiment.includes('Kötü') ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {item.analystSentiment}
                      </span>
                    </td>
                    
                    <td className="px-6 py-5 text-center">
                      <button className="text-gray-400 hover:text-purple-500 transition-colors">
                        {expandedRow === item.ticker ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                  
                  {expandedRow === item.ticker && (
                    <tr>
                      <td colSpan="7" className="px-0 py-0 border-b-2 border-purple-500/20">
                        <div className="bg-gradient-to-r from-purple-50/90 to-indigo-50/90 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Bilanço Özeti */}
                            <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                <Target className="w-4 h-4" /> Kârlılık Özetleri
                              </h4>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-300">FAVÖK (EBITDA):</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{item.ebitda}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">ROE (Özsermaye Kârı):</span>
                                <span className="font-black text-gray-900 dark:text-white">{item.roe}</span>
                              </div>
                            </div>

                            {/* AI Yorumu */}
                            <div className="md:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-xl border-l-4 border-l-purple-500 shadow-sm relative overflow-hidden">
                              <Zap className="absolute right-0 top-0 w-24 h-24 text-purple-500/5 -mr-4 -mt-4" />
                              <h4 className="text-sm font-black text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                                <Zap className="w-4 h-4 fill-current" /> Ozi Algo Bilanço Analizi
                              </h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed relative z-10">
                                {item.aiComment}
                              </p>
                            </div>

                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {data.length === 0 && !loading && (
             <div className="p-8 text-center text-gray-500">Veri bulunamadı. Lütfen daha sonra tekrar deneyin.</div>
          )}
        </div>
      </div>
    </div>
  );
}
