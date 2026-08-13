import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, Search, Shield, Zap, Target, Star, ArrowUpRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchTefasFunds, scoreTefasFund } from '../services/marketData';

const CATEGORIES = [
  'Tümü', 
  'Hisse Senedi Fonları', 
  'Kıymetli Madenler (Altın/Gümüş)', 
  'Borçlanma Araçları', 
  'Para Piyasası Fonları', 
  'Değişken Fonlar', 
  'Fon Sepeti', 
  'Katılım Fonları', 
  'Karma Fonlar', 
  'Gayrimenkul / GSYF', 
  'Teknoloji / Tematik',
  'Sürdürülebilirlik / Temiz Enerji',
  'Sağlık / Tarım',
  'Diğer Fonlar'
];

const FundsDashboard = () => {
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'ai'
  const [searchQuery, setSearchQuery] = useState('');
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'getiriyb', direction: 'desc' });
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
      if (expandedRow === id) setExpandedRow(null);
      else setExpandedRow(id);
  };

  useEffect(() => {
    const loadFunds = async () => {
      setLoading(true);
      const data = await fetchTefasFunds();
      
      const mapped = data.map(fund => {
        const aiEvaluation = scoreTefasFund(fund);
        
        const nameLower = fund.name.toLocaleLowerCase('tr-TR');
        const typeLower = (fund.type || '').toLocaleLowerCase('tr-TR');
        let category = 'Diğer Fonlar';
        if (nameLower.includes('teknoloji') || nameLower.includes('yarı iletken') || nameLower.includes('dijital') || nameLower.includes('blokzincir') || nameLower.includes('oyun') || nameLower.includes('metaverse') || nameLower.includes('robotik')) {
          category = 'Teknoloji / Tematik';
        } else if (nameLower.includes('sürdürülebilirlik') || nameLower.includes('temiz enerji') || nameLower.includes('esg') || nameLower.includes('iklim')) {
          category = 'Sürdürülebilirlik / Temiz Enerji';
        } else if (nameLower.includes('sağlık') || nameLower.includes('tarım') || nameLower.includes('gıda') || nameLower.includes('yaşam')) {
          category = 'Sağlık / Tarım';
        } else if (nameLower.includes('katılım') || nameLower.includes('kira sertifikası') || nameLower.includes('faizsiz')) {
          category = 'Katılım Fonları';
        } else if (nameLower.includes('fon sepeti')) {
          category = 'Fon Sepeti';
        } else if (nameLower.includes('gayrimenkul') || nameLower.includes('gyf') || nameLower.includes('girişim sermayesi') || nameLower.includes('gsyf')) {
          category = 'Gayrimenkul / GSYF';
        } else if (nameLower.includes('değişken')) {
          category = 'Değişken Fonlar';
        } else if (nameLower.includes('karma')) {
          category = 'Karma Fonlar';
        } else if (nameLower.includes('para piyasası') || nameLower.includes('likit') || nameLower.includes('kısa vadeli borçlanma')) {
          category = 'Para Piyasası Fonları';
        } else if (nameLower.includes('borçlanma') || nameLower.includes('tahvil') || nameLower.includes('bono') || nameLower.includes('eurobond') || nameLower.includes('dış borçlanma')) {
          category = 'Borçlanma Araçları';
        } else if (nameLower.includes('kıymetli madenler') || nameLower.includes('altın') || nameLower.includes('gümüş') || fund.ticker.includes('GLD') || fund.ticker.includes('GMSTR') || fund.ticker.includes('GOLD') || typeLower.includes('kıymetli maden')) {
          category = 'Kıymetli Madenler (Altın/Gümüş)';
        } else if (nameLower.includes('hisse senedi') || nameLower.includes('bist') || nameLower.includes('endeks') || fund.ticker.includes('YAT') || fund.ticker.includes('SY') || typeLower.includes('hisse senedi')) {
          category = 'Hisse Senedi Fonları';
        } else if (typeLower.includes('serbest')) {
          category = 'Diğer Fonlar'; // Or we could add a Serbest category, but let's keep it simple
        }

        return {
          ...fund,
          id: fund.ticker,
          category,
          aiScore: aiEvaluation.score,
          aiSignal: aiEvaluation.signal,
          aiComment: aiEvaluation.aiComment,
          shortTermOutlook: aiEvaluation.shortTermOutlook,
          longTermOutlook: aiEvaluation.longTermOutlook
        };
      });

      setFunds(mapped);
      setLoading(false);
    };
    loadFunds();
  }, []);

  const filteredFunds = React.useMemo(() => {
    let result = funds.filter(fund => {
      const matchCategory = activeCategory === 'Tümü' || fund.category === activeCategory;
      const searchLower = searchQuery.toLowerCase().trim();
      const matchSearch = searchLower === '' || 
        fund.name.toLowerCase().includes(searchLower) || 
        fund.id.toLowerCase().includes(searchLower);
      const matchAi = viewMode === 'all' || (fund.aiSignal === 'Güçlü Al' || fund.aiSignal === 'Al');
      return matchCategory && matchSearch && matchAi;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'aiSignal') {
            const getScore = (s) => s === 'Güçlü Al' ? 4 : s === 'Al' ? 3 : s === 'Tut' ? 2 : 1;
            aVal = getScore(a.aiSignal);
            bVal = getScore(b.aiSignal);
        }
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (sortConfig.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    return result;
  }, [funds, activeCategory, searchQuery, viewMode, sortConfig]);

  const handleSort = (key) => {
      let direction = 'desc';
      if (sortConfig.key === key && sortConfig.direction === 'desc') {
          direction = 'asc';
      }
      setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent border border-purple-500/20 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="z-10">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <PieChart className="w-8 h-8 text-purple-500" />
            Yapay Zeka Destekli Fon Tarayıcı
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-400 mt-2 max-w-2xl">
            TEFAS platformundaki en yüksek getirili ve algoritmik skoru en yüksek yatırım fonlarını saniyeler içinde analiz edin. Yapay zeka, trendleri ve fon yönetim kalitesini değerlendirerek en cazip fırsatları sizin için sıralar.
          </p>
        </div>
        <div className="z-10 flex flex-col md:flex-row gap-3">
            {loading && (
              <div className="flex items-center gap-2.5 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl shadow-lg backdrop-blur-md">
                 <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                 <span className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Canlı Veri Çekiliyor...</span>
              </div>
            )}
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Yapay Zeka Aktif</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-all flex items-center gap-4 group">
          <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform"><TrendingUp className="w-6 h-6 text-emerald-500" /></div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Hisse Senedi (BIST)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">+156% <span className="text-xs font-normal text-gray-500">Yıllık Ort. Getiri</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-all flex items-center gap-4 group">
          <div className="p-3 bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform"><Star className="w-6 h-6 text-amber-500" /></div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Altın / Gümüş</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">+85% <span className="text-xs font-normal text-gray-500">Yıllık Ort. Getiri</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-all flex items-center gap-4 group">
          <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform"><Zap className="w-6 h-6 text-blue-500" /></div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Teknoloji & Tematik</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">+165% <span className="text-xs font-normal text-gray-500">Yıllık Ort. Getiri</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-all flex items-center gap-4 group">
          <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform"><Shield className="w-6 h-6 text-indigo-500" /></div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Değişken Fonlar</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">+110% <span className="text-xs font-normal text-gray-500">Yıllık Ort. Getiri</span></p>
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
                  Tüm Fonlar
                </button>
                <button 
                  onClick={() => setViewMode('ai')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${viewMode === 'ai' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 scale-105' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <Zap className="w-4 h-4" /> Yapay Zeka Seçimleri
                </button>
              </div>
              <div className="relative w-full lg:w-96 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className={`h-5 w-5 transition-colors duration-300 ${searchQuery ? 'text-purple-500' : 'text-gray-400 group-focus-within:text-purple-500'}`} />
                  </div>
                  <input
                      type="text"
                      placeholder="Fon Kodu veya Adı Ara... (Örn: YAT)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-12 pr-12 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-0 focus:border-purple-500 transition-all duration-300 text-sm font-medium shadow-sm hover:border-purple-300 dark:hover:border-purple-700"
                  />
                  {searchQuery && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md">
                        {filteredFunds.length} sonuç
                      </span>
                    </div>
                  )}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pb-2 pt-1 px-1">
                {CATEGORIES.map(cat => {
                    const count = cat === 'Tümü' ? funds.length : funds.filter(f => f.category === cat).length;
                    if (count === 0) return null;
                    const isActive = activeCategory === cat;
                    return (
                        <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 snap-start flex items-center gap-1.5 ${
                                isActive
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 scale-105 ring-2 ring-purple-500/50 ring-offset-2 dark:ring-offset-gray-900' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400 border border-transparent'
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
                        <th className="px-6 py-4 font-bold tracking-wider">Fon Bilgisi</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Kategori</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right cursor-pointer hover:text-purple-600 transition-colors select-none" onClick={() => handleSort('getiri1a')}>
                            1 Aylık {sortConfig.key === 'getiri1a' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right cursor-pointer hover:text-purple-600 transition-colors select-none" onClick={() => handleSort('getiri3a')}>
                            3 Aylık {sortConfig.key === 'getiri3a' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right text-purple-600 dark:text-purple-400 cursor-pointer hover:text-purple-800 transition-colors select-none" onClick={() => handleSort('getiriyb')}>
                            YTD (Yılbaşı) {sortConfig.key === 'getiriyb' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        {viewMode === 'ai' && (
                          <th className="px-6 py-4 font-bold tracking-wider text-center cursor-pointer hover:text-purple-600 transition-colors select-none" onClick={() => handleSort('aiSignal')}>
                              Yapay Zeka Sinyali {sortConfig.key === 'aiSignal' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </th>
                        )}
                        <th className="px-6 py-4 font-bold tracking-wider text-center"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60 bg-white dark:bg-gray-900">
                    {filteredFunds.map((fund, idx) => (
                        <React.Fragment key={fund.id}>
                            <tr 
                                onClick={() => viewMode === 'ai' && toggleRow(fund.id)}
                                className={`transition-all duration-200 group ${viewMode === 'ai' ? 'cursor-pointer hover:bg-purple-50/80 dark:hover:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'} ${expandedRow === fund.id ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}
                            >
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center font-black text-purple-700 dark:text-purple-400 tracking-wider shadow-sm">
                                            {fund.id}
                                        </div>
                                        <div className="max-w-[250px] lg:max-w-[400px]">
                                            <p className="font-bold text-gray-900 dark:text-white truncate">{fund.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                <Shield className="w-3 h-3" /> Risk Değeri: <span className="font-bold text-gray-700 dark:text-gray-200">{fund.riskDegeri || '-'} / 7</span>
                                            </p>
                                            {viewMode === 'ai' && (
                                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1.5 font-medium flex items-center gap-1 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                                                    {expandedRow === fund.id ? 'Detayları gizle' : 'Yapay Zeka Analizini Gör'} {expandedRow === fund.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                        {fund.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`font-bold text-sm ${fund.getiri1a >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {fund.getiri1a >= 0 ? '+' : ''}{fund.getiri1a !== undefined && fund.getiri1a !== null ? fund.getiri1a.toFixed(2) : '0'}%
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`font-bold text-sm ${fund.getiri3a >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {fund.getiri3a >= 0 ? '+' : ''}{fund.getiri3a !== undefined && fund.getiri3a !== null ? fund.getiri3a.toFixed(2) : '0'}%
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-black text-base shadow-sm ${fund.getiriyb < 0 && 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                        <TrendingUp className="w-4 h-4" /> {fund.getiriyb >= 0 ? '+' : ''}{fund.getiriyb !== undefined && fund.getiriyb !== null ? fund.getiriyb.toFixed(2) : '0'}%
                                    </span>
                                </td>
                                {viewMode === 'ai' && (
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black text-sm shadow-sm ${
                                          fund.aiSignal === 'Güçlü Al' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                                          fund.aiSignal === 'Al' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' :
                                          fund.aiSignal === 'Sat / Uzak Dur' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                                          'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30'
                                        }`}>
                                            {fund.aiSignal === 'Güçlü Al' ? <Zap className="w-4 h-4" /> : 
                                             fund.aiSignal === 'Sat / Uzak Dur' ? <Target className="w-4 h-4 rotate-180" /> : null}
                                            {fund.aiSignal}
                                        </span>
                                    </td>
                                )}
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fund.id}`, '_blank');
                                        }}
                                        className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors relative z-10"
                                        title="TEFAS Detay Sayfasını Aç"
                                    >
                                        <ArrowUpRight className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                            {viewMode === 'ai' && expandedRow === fund.id && (
                                <tr>
                                    <td colSpan="8" className="px-0 py-0 border-b-2 border-purple-500/20">
                                        <div className="bg-gradient-to-r from-purple-50/90 to-indigo-50/90 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500"/> Kısa Vade Outlook</h4>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{fund.shortTermOutlook || 'Beklemede'}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500"/> Uzun Vade Outlook</h4>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{fund.longTermOutlook || 'Beklemede'}</p>
                                                </div>
                                                <div className="md:col-span-2 bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                                                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-400 mb-1">AI Özeti:</h4>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200">{fund.aiComment}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                    {!loading && filteredFunds.length === 0 && (
                        <tr>
                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                                <p className="text-lg font-medium">Eşleşen fon bulunamadı.</p>
                                <p className="text-sm mt-1">Farklı bir kategori veya arama terimi deneyin.</p>
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

export default FundsDashboard;
