import React, { useState, useMemo } from 'react';
import REAL_IPO from '../data/realIpoData.json';
import { Rocket, Calendar, Banknote, Layers, TrendingUp, TrendingDown, Target, Zap, ChevronDown, ChevronUp, PieChart, ShieldAlert } from 'lucide-react';

export default function IpoDashboard() {
  const [activeTab, setActiveTab] = useState('Tümü');
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  const filteredIPOs = useMemo(() => {
    if (activeTab === 'Tümü') return REAL_IPO;
    return REAL_IPO.filter(ipo => {
      if (activeTab === 'İşlem Görenler') return ipo.status === 'İşlem Görüyor';
      if (activeTab === 'SPK Onaylılar') return ipo.status === 'SPK Onaylı';
      if (activeTab === 'Taslaklar') return ipo.status === 'Taslak';
      return true;
    });
  }, [activeTab]);

  const tabs = ['Tümü', 'SPK Onaylılar', 'İşlem Görenler', 'Taslaklar'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-br from-cyan-900/40 via-blue-900/20 to-transparent border border-cyan-500/20 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="z-10">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Rocket className="w-8 h-8 text-cyan-500" />
            Halka Arz Takvimi (Canlı Veri)
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-400 mt-2 max-w-2xl">
            SPK onaylı yeni halka arzlar, taslak aşamasındaki şirketler ve borsada işlem görmeye başlayan son arzların detaylı analizleri. 
            Yapay zeka katılım önerileri ile birlikte.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-gray-100/50 dark:bg-gray-900/50 p-2 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab 
                ? 'bg-white dark:bg-gray-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-gray-200 dark:border-gray-700' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredIPOs.map((ipo) => (
          <div key={ipo.id} className={`bg-white dark:bg-gray-900 border ${expandedId === ipo.id ? 'border-cyan-500 shadow-cyan-500/20' : 'border-gray-200 dark:border-gray-800'} rounded-2xl overflow-hidden shadow-md flex flex-col transition-all duration-300`}>
            {/* Üst Kısım (Her zaman görünür) */}
            <div className="flex flex-col md:flex-row cursor-pointer" onClick={() => toggleExpand(ipo.id)}>
              <div className="p-6 md:w-2/5 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 flex flex-col justify-center relative">
                
                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-3 pr-6">{ipo.name}</h3>
                
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${
                    ipo.status === 'İşlem Görüyor' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    ipo.status === 'SPK Onaylı' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                    'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {ipo.status}
                  </span>
                  
                  {ipo.aiRecommendationType === 'Katıl' && (
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-emerald-500 text-white shadow-sm">
                       <Zap className="w-3 h-3 fill-current" /> Katıl
                     </span>
                  )}
                  {ipo.aiRecommendationType === 'İzle' && (
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-cyan-500 text-white shadow-sm">
                       <Target className="w-3 h-3" /> İzle
                     </span>
                  )}
                  {ipo.aiRecommendationType === 'Uzak Dur' && (
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-rose-500 text-white shadow-sm">
                       <ShieldAlert className="w-3 h-3" /> Uzak Dur
                     </span>
                  )}
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden">
                  {expandedId === ipo.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
              
              <div className="p-6 md:w-3/5 space-y-4 relative">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1"><Banknote className="w-3.5 h-3.5" /> Fiyat</div>
                    <div className="font-bold text-gray-900 dark:text-white">{ipo.price || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5" /> Tarih</div>
                    <div className="font-bold text-gray-900 dark:text-white">{ipo.date || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1"><Layers className="w-3.5 h-3.5" /> Büyüklük</div>
                    <div className="font-bold text-gray-900 dark:text-white">{ipo.size || '-'}</div>
                  </div>
                  {ipo.status === 'İşlem Görüyor' ? (
                    <div>
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1"><TrendingUp className="w-3.5 h-3.5" /> Anlık Fiyat</div>
                      <div className="font-bold text-emerald-500">{ipo.currentPrice || '-'} <span className="text-xs ml-1">({ipo.return > 0 ? '+' : ''}{ipo.return || 0}%)</span></div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1"><Layers className="w-3.5 h-3.5" /> Lot Miktarı</div>
                      <div className="font-bold text-gray-900 dark:text-white">{ipo.lots || '-'}</div>
                    </div>
                  )}
                </div>
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block">
                  {expandedId === ipo.id ? <ChevronUp className="w-6 h-6 text-gray-400 hover:text-cyan-500 transition-colors" /> : <ChevronDown className="w-6 h-6 text-gray-400 hover:text-cyan-500 transition-colors" />}
                </div>
              </div>
            </div>

            {/* Detay Kısmı (Genişlediğinde) */}
            {expandedId === ipo.id && (
              <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/50 p-6 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <PieChart className="w-4 h-4 text-cyan-500" /> Şirket Profili
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Borçluluk (Debt/Equity):</span>
                        <span className={`text-sm font-bold ${ipo.debtToEquity && ipo.debtToEquity.includes('Yüksek') ? 'text-rose-500' : 'text-emerald-500'}`}>{ipo.debtToEquity || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sektördeki Konumu:</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white text-right ml-4">{ipo.sectorPosition || '-'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-indigo-500" /> Fon Kullanım Yeri
                    </h4>
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">
                      {ipo.useOfFunds || '-'}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-5 rounded-xl border-l-4 border-l-cyan-500 relative overflow-hidden">
                  <Zap className="absolute right-0 top-0 w-24 h-24 text-cyan-500/5 -mr-4 -mt-4" />
                  <h4 className="text-sm font-black text-cyan-600 dark:text-cyan-400 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-current" /> Ozi Algo Halka Arz Analizi
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed relative z-10">
                    {ipo.aiRecommendation || 'Analiz verisi bulunamadı.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredIPOs.length === 0 && (
           <div className="col-span-1 xl:col-span-2 text-center p-8 text-gray-500">Bu kategoriye ait halka arz bulunamadı.</div>
        )}
      </div>
    </div>
  );
}
