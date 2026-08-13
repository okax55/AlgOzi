import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Search, Globe, Cpu, Droplet, Stethoscope, ArrowUpRight, BarChart2, Loader2, Zap, Star, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchUSEtfs, scoreETF } from '../services/marketData';

const CATEGORIES = [
  'Tümü', 
  'Geniş Piyasa Endeksi', 
  'Teknoloji / Büyüme', 
  'Yarı İletken / Çip', 
  'Sağlık / Biyoteknoloji', 
  'Enerji / Petrol', 
  'Kıymetli Madenler / Emtia', 
  'Finans / Bankacılık', 
  'Temettü / Değer', 
  'İnovasyon / Kripto (Yüksek Risk)', 
  'Sanayi / Endüstriyel', 
  'Altyapı (Utilities)', 
  'Gayrimenkul (REIT)', 
  'Tahvil / Bono'
];

const ETFDashboard = () => {
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'ai'
  const [searchQuery, setSearchQuery] = useState('');
  const [etfs, setEtfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
      if (expandedRow === id) setExpandedRow(null);
      else setExpandedRow(id);
  };

  useEffect(() => {
    const loadETFs = async () => {
      setLoading(true);
      const data = await fetchUSEtfs();
      
      const mapped = data.map(etf => {
        const aiEvaluation = scoreETF(etf);
        
        const nameLower = etf.name.toLowerCase();
        let category = 'Geniş Piyasa Endeksi';
        let icon = Globe;
        let color = 'text-blue-500';
        let bg = 'bg-blue-500/10';
        
        if (etf.ticker.includes('QQQ') || nameLower.includes('tech') || nameLower.includes('information')) {
          category = 'Teknoloji / Büyüme'; icon = Cpu; color = 'text-purple-500'; bg = 'bg-purple-500/10';
        } else if (etf.ticker.includes('SMH') || etf.ticker.includes('SOXX') || nameLower.includes('semi')) {
          category = 'Yarı İletken / Çip'; icon = Cpu; color = 'text-purple-600'; bg = 'bg-purple-600/10';
        } else if (etf.ticker.includes('XLV') || nameLower.includes('health') || nameLower.includes('bio')) {
          category = 'Sağlık / Biyoteknoloji'; icon = Stethoscope; color = 'text-rose-500'; bg = 'bg-rose-500/10';
        } else if (etf.ticker.includes('XLE') || nameLower.includes('energy') || nameLower.includes('oil')) {
          category = 'Enerji / Petrol'; icon = Droplet; color = 'text-amber-600'; bg = 'bg-amber-600/10';
        } else if (etf.ticker === 'GLD' || etf.ticker === 'SLV' || nameLower.includes('gold') || nameLower.includes('silver') || nameLower.includes('commodity')) {
          category = 'Kıymetli Madenler / Emtia'; icon = Star; color = 'text-amber-500'; bg = 'bg-amber-500/10';
        } else if (etf.ticker.includes('XLF') || nameLower.includes('financ') || nameLower.includes('bank')) {
          category = 'Finans / Bankacılık'; icon = BarChart2; color = 'text-blue-600'; bg = 'bg-blue-600/10';
        } else if (etf.ticker.includes('SCHD') || etf.ticker.includes('VYM') || nameLower.includes('dividend') || nameLower.includes('value')) {
          category = 'Temettü / Değer'; icon = Target; color = 'text-emerald-500'; bg = 'bg-emerald-500/10';
        } else if (etf.name.includes('ARK') || nameLower.includes('innovation') || nameLower.includes('crypto') || nameLower.includes('bitcoin')) {
          category = 'İnovasyon / Kripto (Yüksek Risk)'; icon = TrendingUp; color = 'text-pink-500'; bg = 'bg-pink-500/10';
        } else if (etf.ticker.includes('XLI') || nameLower.includes('industr') || nameLower.includes('aerospace')) {
          category = 'Sanayi / Endüstriyel'; icon = Shield; color = 'text-gray-500'; bg = 'bg-gray-500/10';
        } else if (etf.ticker.includes('XLU') || nameLower.includes('utilit')) {
          category = 'Altyapı (Utilities)'; icon = Zap; color = 'text-yellow-500'; bg = 'bg-yellow-500/10';
        } else if (etf.ticker.includes('XLRE') || etf.ticker.includes('VNQ') || nameLower.includes('real estate') || nameLower.includes('reit')) {
          category = 'Gayrimenkul (REIT)'; icon = Globe; color = 'text-teal-500'; bg = 'bg-teal-500/10';
        } else if (nameLower.includes('bond') || nameLower.includes('treasury') || etf.ticker.includes('TLT') || etf.ticker.includes('BND')) {
          category = 'Tahvil / Bono'; icon = Target; color = 'text-slate-500'; bg = 'bg-slate-500/10';
        }

        return {
          ...etf,
          category, icon, color, bg,
          aiScore: aiEvaluation.score,
          aiSignal: aiEvaluation.signal,
          aiComment: aiEvaluation.aiComment,
          shortTermOutlook: aiEvaluation.shortTermOutlook,
          longTermOutlook: aiEvaluation.longTermOutlook
        };
      });

      setEtfs(mapped);
      setLoading(false);
    };
    loadETFs();
  }, []);

  const filteredETFs = React.useMemo(() => {
    return etfs.filter(etf => {
      const matchCategory = activeCategory === 'Tümü' || etf.category === activeCategory;
      const searchLower = searchQuery.toLowerCase().trim();
      const matchSearch = searchLower === '' || 
        etf.name.toLowerCase().includes(searchLower) || 
        etf.ticker.toLowerCase().includes(searchLower);
      const matchAi = viewMode === 'all' || (etf.aiSignal === 'Güçlü Al' || etf.aiSignal === 'Al');
      return matchCategory && matchSearch && matchAi;
    });
  }, [etfs, activeCategory, searchQuery, viewMode]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-indigo-900/40 via-blue-900/20 to-transparent border border-blue-500/20 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="z-10">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-500" />
            ABD ETF Analizi & Sektörel Fırsatlar
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-400 mt-2 max-w-2xl">
            Dünyanın en büyük fon yöneticilerinin ETF'lerini (Borsa Yatırım Fonları) tarayın. Temettü, büyüme, teknoloji veya defansif sektörlerdeki global fırsatları algoritmik skorlarla keşfedin.
          </p>
        </div>
        <div className="z-10 flex flex-col md:flex-row gap-3">
            {loading && (
              <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl shadow-lg backdrop-blur-md">
                 <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                 <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Canlı Veri Çekiliyor...</span>
              </div>
            )}
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Yapay Zeka Aktif</span>
            </div>
        </div>
      </div>



      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-visible relative">
        <div className="p-3 sm:px-5 sm:py-4 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl flex flex-col gap-3 sm:gap-4 z-30 shadow-sm rounded-t-3xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 w-full">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
                <button 
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 ${viewMode === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Tüm ETF'ler
                </button>
                <button 
                  onClick={() => setViewMode('ai')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${viewMode === 'ai' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/30 scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <Zap className="w-4 h-4" /> Yapay Zeka Seçimleri
                </button>
              </div>
              <div className="relative w-full lg:w-96 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className={`h-5 w-5 transition-colors duration-300 ${searchQuery ? 'text-blue-500' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                  </div>
                  <input
                      type="text"
                      placeholder="Sembol veya ETF Adı... (Örn: QQQ)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-12 pr-12 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-0 focus:border-blue-500 transition-all duration-300 text-sm font-medium shadow-sm hover:border-blue-300 dark:hover:border-blue-700"
                  />
                  {searchQuery && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md">
                        {filteredETFs.length} sonuç
                      </span>
                    </div>
                  )}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pb-2 pt-1 px-1">
                {CATEGORIES.map(cat => {
                    const count = cat === 'Tümü' ? etfs.length : etfs.filter(f => f.category === cat).length;
                    if (count === 0) return null;
                    const isActive = activeCategory === cat;
                    return (
                        <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 snap-start flex items-center gap-1.5 ${
                                isActive 
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105 ring-2 ring-blue-500/50 ring-offset-2 dark:ring-offset-gray-900' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent'
                            }`}
                        >
                            {cat} 
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left border-collapse relative">
                <thead className="bg-gray-50 dark:bg-gray-900/90 backdrop-blur-md text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">Sembol & İsim</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Kategori</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Fon Büyüklüğü</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Fiyat</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Haftalık</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">3 Aylık</th>
                        {viewMode === 'ai' && (
                          <th className="px-6 py-4 font-bold tracking-wider text-center">Yapay Zeka Sinyali</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60 bg-white dark:bg-gray-900">
                    {filteredETFs.map((etf, idx) => {
                        const Icon = etf.icon;
                        return (
                            <React.Fragment key={etf.ticker}>
                                <tr 
                                    onClick={() => viewMode === 'ai' && toggleRow(etf.ticker)}
                                    className={`transition-all duration-200 group ${viewMode === 'ai' ? 'cursor-pointer hover:bg-blue-50/80 dark:hover:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'} ${expandedRow === etf.ticker ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm ${etf.bg} ${etf.color} border-current/20`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 dark:text-white text-lg tracking-wide">{etf.ticker}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
                                                    {etf.name}
                                                </p>
                                                {viewMode === 'ai' && (
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium flex items-center gap-1 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                                        {expandedRow === etf.ticker ? 'Detayları gizle' : 'Yapay Zeka Analizini Gör'} {expandedRow === etf.ticker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                            {etf.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-300">
                                        ${etf.aum || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white font-bold">
                                        ${etf.close ? etf.close.toFixed(2) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-bold text-sm ${etf.perfW >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {etf.perfW >= 0 ? '+' : ''}{etf.perfW ? etf.perfW.toFixed(2) : '0'}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-bold text-sm ${etf.perf3M >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {etf.perf3M >= 0 ? '+' : ''}{etf.perf3M ? etf.perf3M.toFixed(2) : '0'}%
                                        </span>
                                    </td>
                                    {viewMode === 'ai' && (
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black text-sm shadow-sm ${
                                              etf.aiSignal === 'Güçlü Al' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                                              etf.aiSignal === 'Al' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' :
                                              etf.aiSignal === 'Sat / Uzak Dur' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                                              'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30'
                                            }`}>
                                                {etf.aiSignal === 'Güçlü Al' ? <TrendingUp className="w-4 h-4" /> : 
                                                 etf.aiSignal === 'Sat / Uzak Dur' ? <Target className="w-4 h-4 rotate-180" /> : null}
                                                {etf.aiSignal}
                                            </span>
                                        </td>
                                    )}
                                </tr>
                                {viewMode === 'ai' && expandedRow === etf.ticker && (
                                    <tr>
                                        <td colSpan="7" className="px-0 py-0 border-b-2 border-blue-500/20">
                                            <div className="bg-gradient-to-r from-blue-50/90 to-cyan-50/90 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500"/> Kısa Vade Outlook</h4>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{etf.shortTermOutlook || 'Beklemede'}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500"/> Uzun Vade Outlook</h4>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{etf.longTermOutlook || 'Beklemede'}</p>
                                                    </div>
                                                    <div className="md:col-span-2 bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                                                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-1">AI Özeti:</h4>
                                                        <p className="text-sm text-gray-800 dark:text-gray-200">{etf.aiComment}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                    {!loading && filteredETFs.length === 0 && (
                        <tr>
                            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                                <p className="text-lg font-medium">Eşleşen ETF bulunamadı.</p>
                                <p className="text-sm mt-1">Farklı bir kategori veya sembol deneyin.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ETFDashboard;
