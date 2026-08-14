import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  PieChart, Activity,
  Clock, Sun, Moon, Loader2, AlertCircle,
  TrendingUp, BarChart2, Zap, Shield, ShieldAlert, Sparkles, Target, Wallet, LogOut, FileText, Rocket, ArrowUp
} from 'lucide-react';
import { INITIAL_PORTFOLIOS, INITIAL_US_PORTFOLIOS } from './data/initialPortfolios';
import { analyzeStock, scoreStock, fetchAllBistTickers, fetchTVDataForStocks, fetchTVDataForUSStocks, fetchExplosiveUSStocks, analyzeUSStock, scoreUSStock } from './services/marketData';
import { BIST100, KATILIM_TUM, YENI_HALKA_ARZ } from './data/bistUniverse';
import { US_UNIVERSE_ALL, US_ALFA, US_BETA, US_DELTA, US_KATILIM } from './data/usUniverse';
import { MOCK_MONTHLY_HISTORY, MOCK_DAILY_HISTORY } from './data/mockHistory';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import WalletDashboard from './components/WalletDashboard';
import FundsDashboard from './components/FundsDashboard';
import ETFDashboard from './components/ETFDashboard';
import BalanceSheetDashboard from './components/BalanceSheetDashboard';
import IpoDashboard from './components/IpoDashboard';
import MomentumSwingTradeDashboard from './components/MomentumSwingTradeDashboard';
import { saveToFirebase, loadFromFirebase } from './services/firebase';

const safeFloat = (val, fieldName = 'Veri') => {
    if (val === undefined || val === null || val === '') {
        console.error(`[AlgOzi Uyarı]: ${fieldName} eksik veya boş! Sıfır kabul edilerek hesaplamaya devam ediliyor. (Gelen Değer: ${val})`);
        return 0;
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
        console.error(`[AlgOzi Uyarı]: ${fieldName} geçerli bir sayı değil! Sıfır kabul edilerek hesaplamaya devam ediliyor. (Gelen Değer: '${val}')`);
        return 0;
    }
    return num;
};

const STRATEGIES = {
  alfa: { name: 'ALFA', desc: 'Yüksek risk - yüksek potansiyel. Volatilitesi yüksek, getiri odaklı.', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', risk: '9/10' },
  beta: { name: 'BETA', desc: 'Yeni halka arzlar ve büyüme hikayeleri. Dinamik, fırsat odaklı.', icon: Sparkles, color: 'text-cyan-500', bg: 'bg-cyan-500/10', risk: '8/10' },
  katilim: { name: 'KATILIM', desc: 'Faiz hassasiyetine uygun, katılım kriterlerine bağlı dengeli yapı.', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', risk: '4/10' },
  delta: { name: 'DELTA', desc: 'Sektörel çeşitlendirme ve enflasyon/kur koruması. Farklı sektörlerden (Gıda, Havacılık, Enerji, Emtia) dengeli ve defansif yapı.', icon: Shield, color: 'text-pink-500', bg: 'bg-pink-500/10', risk: '4/10' }
};

const US_STRATEGIES = {
  alfa: { name: 'ALFA', desc: 'Teknoloji & Yüksek Büyüme. Mega-cap teknoloji ve yapay zeka odaklı şirketleri hedefler. Yüksek volatilite, yüksek potansiyel.', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', risk: '9/10' },
  beta: { name: 'BETA', desc: 'Değer & Temettü. Köklü, istikrarlı nakit akışı yaratan mega-cap şirketler. Düşük volatilite, istikrarlı getiri.', icon: Sparkles, color: 'text-cyan-500', bg: 'bg-cyan-500/10', risk: '5/10' },
  delta: { name: 'DELTA', desc: 'Defansif & Sağlık. Ekonomik dalgalanmalardan etkilenmeyen sağlık ve dayanıklı tüketim şirketleri. Düşük risk, enflasyondan korunma.', icon: Shield, color: 'text-pink-500', bg: 'bg-pink-500/10', risk: '3/10' }
};

const getNextRebalanceDate = (marketMode) => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  let dayOffset = 0;
  if (firstDay.getDay() === 0) dayOffset = 1; // Pazar ise Pazartesiye kaydır
  if (firstDay.getDay() === 6) dayOffset = 2; // Cumartesi ise Pazartesiye kaydır
  
  const firstTradingDay = new Date(firstDay.setDate(firstDay.getDate() + dayOffset));
  
  const day = firstTradingDay.getDate();
  const month = firstTradingDay.toLocaleString('tr-TR', { month: 'long' });
  const year = firstTradingDay.getFullYear();
  
  const timeStr = marketMode === 'ABD' ? '18:00' : '11:00';
  return `${day} ${month} ${year} - ${timeStr}`;
};

export default function BistAlgoPlatform() {
  const [marketMode, setMarketMode] = useState('BIST'); // BIST or ABD
  const [activeTab, setActiveTab] = useState('portfolios');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });
  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Sağ tık kapatma
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const [isCloudLoading, setIsCloudLoading] = useState(true);

  const [activeSwingTrades, setActiveSwingTrades] = useState([]);
  const activeSwingTradesRef = useRef(activeSwingTrades);
  const [pastSwingTrades, setPastSwingTrades] = useState([]);
  const pastSwingTradesRef = useRef(pastSwingTrades);
  const [portfolios, setPortfolios] = useState(INITIAL_PORTFOLIOS);
  const portfoliosRef = useRef(portfolios);
  
  const [usPortfolios, setUsPortfolios] = useState(INITIAL_US_PORTFOLIOS);
  const usPortfoliosRef = useRef(usPortfolios);
  const [activeUsSwingTrades, setActiveUsSwingTrades] = useState([]);
  const activeUsSwingTradesRef = useRef(activeUsSwingTrades);
  const [pastUsSwingTrades, setPastUsSwingTrades] = useState([]);
  const pastUsSwingTradesRef = useRef(pastUsSwingTrades);

  const [, setLiveSignals] = useState([]);

  // Buluttan verileri çekme (İlk açılışta)
  useEffect(() => {
    const initCloud = async () => {
      const cloudData = await loadFromFirebase();
      if (cloudData) {
        if (cloudData.portfolios) {
          let mergedPortfolios = { ...cloudData.portfolios };
          
          // EĞER BULUTTAKİ PORTFÖYLER BOŞALMIŞSA (HATA SONUCU) VEYA BUGÜN YANLIŞLIKLA TARANDIYSA BAŞLANGIÇ VERİLERİNİ (6 AĞUSTOS) GERİ YÜKLE
          const isBistEmpty = Object.values(mergedPortfolios).every(p => !p || p.length === 0);
          const forceRestoreFinal = !localStorage.getItem('restore_aug6_final_v3');
          
          if (isBistEmpty || forceRestoreFinal) {
              mergedPortfolios = INITIAL_PORTFOLIOS;
              localStorage.setItem('restore_aug6_final_v3', 'true');
              
              // Tarihi de zorla 6 Ağustos'a çekelim ve formatlayalım
              const fixedDate = '06 Ağustos 2026';
              localStorage.setItem('lastScanDate', fixedDate);
              saveToFirebase('lastScanDate', fixedDate);
              if (cloudData) cloudData.lastScanDate = fixedDate;
              
              // Veritabanını hemen güncelleyelim ki diğer siteler de (localhost vb.) düzelsin
              saveToFirebase('portfolios', INITIAL_PORTFOLIOS);
          }

          let missingLots = false;
          Object.keys(mergedPortfolios).forEach(key => {
            if (mergedPortfolios[key] && Array.isArray(mergedPortfolios[key])) {
              mergedPortfolios[key] = mergedPortfolios[key].map(stock => {
                if (stock.lots === undefined || stock.lots === 0) {
                  missingLots = true;
                  const initialStock = INITIAL_PORTFOLIOS[key]?.find(s => s.ticker === stock.ticker);
                  return { ...stock, lots: initialStock ? initialStock.lots : 0 };
                }
                return stock;
              });
            }
          });
          setPortfolios(mergedPortfolios);
          if (missingLots || isBistEmpty) {
             saveToFirebase('portfolios', mergedPortfolios);
          }
        }
        if (cloudData.activeSwingTrades) {
            setActiveSwingTrades(cloudData.activeSwingTrades);
            activeSwingTradesRef.current = cloudData.activeSwingTrades;
        }
        if (cloudData.pastSwingTrades) {
            setPastSwingTrades(cloudData.pastSwingTrades);
            pastSwingTradesRef.current = cloudData.pastSwingTrades;
        }
        if (cloudData.lastScanDate) localStorage.setItem('lastScanDate', cloudData.lastScanDate);
        const fixedDateUS = '11 Ağustos 2026';
        if (cloudData.lastScanDateUS) {
            localStorage.setItem('lastScanDateUS', cloudData.lastScanDateUS);
        } else {
            localStorage.setItem('lastScanDateUS', fixedDateUS);
            saveToFirebase('lastScanDateUS', fixedDateUS);
        }
        
        const forceResetUsFinal = !localStorage.getItem('restore_aug6_us_final_v4');
        if (forceResetUsFinal) {
           console.log("HARD RESETTING US PORTFOLIOS");
           setUsPortfolios(INITIAL_US_PORTFOLIOS);
           saveToFirebase('usPortfolios', INITIAL_US_PORTFOLIOS);
           localStorage.setItem('restore_aug6_us_final_v4', 'true');
        } else if (cloudData.usPortfolios && cloudData.usPortfolios.alfa && cloudData.usPortfolios.alfa.length > 0) {
           setUsPortfolios(cloudData.usPortfolios);
        } else {
           setUsPortfolios(INITIAL_US_PORTFOLIOS);
           saveToFirebase('usPortfolios', INITIAL_US_PORTFOLIOS);
        }
        if (cloudData.activeUsSwingTrades) {
           setActiveUsSwingTrades(cloudData.activeUsSwingTrades);
           activeUsSwingTradesRef.current = cloudData.activeUsSwingTrades;
        }
        if (cloudData.pastUsSwingTrades) {
           setPastUsSwingTrades(cloudData.pastUsSwingTrades);
           pastUsSwingTradesRef.current = cloudData.pastUsSwingTrades;
        }
      } else {
        // Bulutta veri yoksa, ilk defaya mahsus varsayılanları (veya local'dekileri) buluta yaz
        saveToFirebase('portfolios', portfolios);
        saveToFirebase('usPortfolios', INITIAL_US_PORTFOLIOS);
      }
      setIsCloudLoading(false);
    };
    initCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Değişiklikleri Buluta ve Ref'e Kaydetme
  useEffect(() => {
    if (isCloudLoading) return;
    activeSwingTradesRef.current = activeSwingTrades;
    saveToFirebase('activeSwingTrades', activeSwingTrades);
  }, [activeSwingTrades, isCloudLoading]);

  useEffect(() => {
    if (isCloudLoading) return;
    saveToFirebase('pastSwingTrades', pastSwingTradesRef.current);
  }, [pastSwingTrades, isCloudLoading]);

  useEffect(() => {
    if (isCloudLoading) return;
    portfoliosRef.current = portfolios;
    saveToFirebase('portfolios', portfolios);
  }, [portfolios, isCloudLoading]);

  useEffect(() => {
    if (isCloudLoading) return;
    activeUsSwingTradesRef.current = activeUsSwingTrades;
    saveToFirebase('activeUsSwingTrades', activeUsSwingTrades);
  }, [activeUsSwingTrades, isCloudLoading]);

  useEffect(() => {
    if (isCloudLoading) return;
    pastUsSwingTradesRef.current = pastUsSwingTrades;
    saveToFirebase('pastUsSwingTrades', pastUsSwingTrades);
  }, [pastUsSwingTrades, isCloudLoading]);

  useEffect(() => {
    if (isCloudLoading) return;
    usPortfoliosRef.current = usPortfolios;
    saveToFirebase('usPortfolios', usPortfolios);
  }, [usPortfolios, isCloudLoading]);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [lastUpdate, setLastUpdate] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceProgress, setRebalanceProgress] = useState(0);
  const [totalBistUniverse, setTotalBistUniverse] = useState([]);
  const [, setIsLoadingUniverse] = useState(true);
  const scannerInterval = useRef(null);
  const lastFullScanTimeRef = useRef(0);

  const getUniverseMap = useCallback((dynamicFullList) => {
    return {
      alfa: dynamicFullList, // Yüksek risk/getiri TAHMİNİ tüm BIST'ten seçilebilir
      beta: YENI_HALKA_ARZ, // Halka arz ve büyüme hisseleri
      katilim: KATILIM_TUM, // Katılım endeksi
      delta: BIST100 // Düşük riskli, BIST 100 köklü şirketleri
    };
  }, []);

  const scanMarket = useCallback(async (currentUniverse, isOnlyActive = false) => {
    if (isScanning || currentUniverse.length === 0) return;
    
    // BIST Hours Check
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() + (now.getMinutes() / 60);
    const isOpen = (day > 0 && day < 6) && (time >= 9.9 && time <= 18.2); // 09:55 - 18:10

    if (!isOpen) {
      setLastUpdate('Piyasa Kapalı (Tarama Durduruldu)');
      return;
    }

    setIsScanning(true);
    
    try {
      const safeUniverse = Array.isArray(currentUniverse) ? currentUniverse : [];
      const currentActive = Array.isArray(activeSwingTradesRef.current) ? activeSwingTradesRef.current : [];
      const isCapacityFull = currentActive.length >= 5;
      
      let subset = [];
      if (!isOnlyActive && !isCapacityFull) {
          const now = Date.now();
          if (now - lastFullScanTimeRef.current > 60 * 1000) {
              subset = [...safeUniverse];
              lastFullScanTimeRef.current = now;
          }
      }
      
      const activeTickers = currentActive.map(t => t.ticker);
      const tickersToFetch = [...new Set([...subset, ...activeTickers])];
      
      const newSignals = [];
      const tvDataMap = (await fetchTVDataForStocks(tickersToFetch)) || {};
      
      let historyEvents = [];
      let updatedActiveTrades = [...currentActive];
      
      // 1. Process Active Trades
      for (let i = updatedActiveTrades.length - 1; i >= 0; i--) {
        const trade = updatedActiveTrades[i];
        const data = tvDataMap[trade.ticker];
        
        if (data && data.close) {
          const currentP = data.close;
          trade.currentPrice = currentP.toFixed(2);
          
          const atr = parseFloat(trade.atr) || (currentP * 0.03);
          const entryP = parseFloat(trade.entry);
          
          // Momentum Sıkı İzleyen Stop: Sınırsız Kâr (Kârı Koru), %3 Başlangıç Stopu
          if (!trade.highestPrice || currentP > parseFloat(trade.highestPrice)) {
              trade.highestPrice = currentP.toFixed(2);
          }
          const highestP = parseFloat(trade.highestPrice);
          const profitPct = ((highestP - entryP) / entryP) * 100;
          
          let trailingDistance;
          if (profitPct >= 2.0) {
              // Hisse %2'den fazla kâr gördüyse çok sıkı takip et (zirveden %1.5 aşağı)
              trailingDistance = highestP * 0.015;
          } else {
              // Harekete yeni başladıysa standart %3 stop
              trailingDistance = highestP * 0.03;
          }
          
          const newStop = highestP - trailingDistance;
          if (!trade.stop || newStop > parseFloat(trade.stop)) {
              trade.stop = newStop.toFixed(2);
          }
          const stopP = parseFloat(trade.stop);
          
          // Sabit hedefi kaldır, hisse gittiği yere kadar gitsin ama arayüz için sembolik %100 göster
          trade.target = (entryP * 2.0).toFixed(2);
          
          // Zaman Stopu Kontrolü (5 İş Günü ~ 7 Takvim Günü)
          let isTimeStop = false;
          if (trade.entryDate) {
              const entryDate = new Date(trade.entryDate).getTime();
              const now = new Date().getTime();
              const diffDays = (now - entryDate) / (1000 * 60 * 60 * 24);
              if (diffDays >= 7) {
                  isTimeStop = true;
              }
          }
          
          // Check exits (Sadece Stop veya Zaman Stopu ile çıkılır)
          if (currentP <= stopP) {
             const actualProfitPct = ((currentP - entryP) / entryP) * 100;
             trade.exitReason = actualProfitPct > 0 ? 'İzleyen Stop (Kâr)' : 'Stop (Zarar Kes)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = actualProfitPct.toFixed(2);
             trade.status = actualProfitPct > 0 ? 'WIN' : 'LOSS';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString(); // For cooldown
             historyEvents.push(trade);
             updatedActiveTrades.splice(i, 1);
          } else if (isTimeStop) {
             trade.exitReason = 'Süre Sonu (Zaman Stopu)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = parseFloat(trade.pnlPercent) > 0 ? 'WIN' : 'LOSS';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString(); 
             historyEvents.push(trade);
             updatedActiveTrades.splice(i, 1);
          }
        }
      }
      
      if (historyEvents.length > 0) {
         setPastSwingTrades(prev => {
             const newHistory = [...historyEvents, ...prev];
             pastSwingTradesRef.current = newHistory;
             saveToFirebase('pastSwingTrades', newHistory);
             return newHistory;
         });
      }

      // 2. Process New Signals and Auto-Buy (Only if we fetched new subset)
      if (subset.length > 0) {
          for (const ticker of subset) {
            const data = tvDataMap[ticker];
            if (data) {
              const signal = analyzeStock(data);
              if (signal) {
                signal.score = scoreStock(data, 'alfa').score;
                newSignals.push(signal);
              }
            }
          }
          
          newSignals.sort((a, b) => b.score - a.score);

          for (const signal of newSignals) {
              if (updatedActiveTrades.length >= 5) break;
              
              if (signal.strength === 'Güçlü Al' || signal.strength === 'Al') {
                  if (!updatedActiveTrades.find(t => t.ticker === signal.ticker)) {
                      // Cooldown Check: Son 24 saatte satılan hisseyi tekrar alma!
                      const currentPastTrades = pastSwingTradesRef.current;
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
                              entryDate: nowObj.toISOString()
                          });
                          historyEvents.push({
                              ticker: signal.ticker,
                              status: 'BOUGHT',
                              exitReason: 'İşlem Görüyor',
                              entry: signal.entry,
                              exitPrice: signal.entry,
                              pnlPercent: '0.00',
                              entryTime: nowObj.toLocaleDateString('tr-TR') + ' ' + nowObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                              entryDate: nowObj.toISOString(),
                              exitTime: nowObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                              exitDate: nowObj.toISOString()
                          });
                      }
                  }
              }
          }
      }
      
      setActiveSwingTrades(updatedActiveTrades);
      
      if (newSignals.length > 0) {
        setLiveSignals(prev => {
          const combined = [...newSignals, ...prev];
          const unique = [];
          const seen = new Set();
          for (const s of combined) {
            if (!seen.has(s.ticker)) {
              seen.add(s.ticker);
              unique.push(s);
            }
          }
          return unique.sort((a, b) => (b.strength || '').localeCompare(a.strength || '')).slice(0, 30);
        });
      }
      setLastUpdate(new Date().toLocaleTimeString('tr-TR'));
    } catch (error) {
      console.error("Tarama hatası (TAM DETAY):", error.stack || error);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  const scanUSMarket = useCallback(async (currentUniverse, isOnlyActive = false) => {
    if (isScanning) return;
    
    // US Market Hours Check
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() + (now.getMinutes() / 60);
    const isActuallyOpen = (day > 0 && day < 6) && (time >= 16.5 && time <= 23.0); // 16:30 - 23:00 TR
    const currentActive = Array.isArray(activeUsSwingTradesRef.current) ? activeUsSwingTradesRef.current : [];
    
    // Eğer hiç işlem yoksa (sistem ilk açıldığında veya sepet boşaldığında)
    // piyasa kapalı olsa bile geçmiş verilere dayanarak en az 1 kez tarama yapsın ve hisseleri bulsun.
    const isOpen = isActuallyOpen || (currentActive.length === 0 && !isOnlyActive);

    if (!isOpen) {
      return;
    }

    try {
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
  }, [isScanning]);

  useEffect(() => {
    const init = async () => {
      const allTickers = await fetchAllBistTickers();
      setTotalBistUniverse(allTickers);
      setIsLoadingUniverse(false);
      
      let initialData = INITIAL_PORTFOLIOS;
      const savedPortfolios = localStorage.getItem('portfolios_v5');
      let savedMonthBist = localStorage.getItem('rebalanceMonth_BIST') || localStorage.getItem('rebalanceMonth_v5');
      let savedMonthUS = localStorage.getItem('rebalanceMonth_US') || localStorage.getItem('rebalanceMonth_v5');
      
      if (savedPortfolios) {
        try {
          initialData = JSON.parse(savedPortfolios);
        } catch { }
      } else {
        savedMonthBist = null;
        savedMonthUS = null;
      }

      setPortfolios(initialData);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentHour = now.getHours();
      
      // İşlem günü kontrolü (Pazartesi-Cuma)
      const isBusinessDay = now.getDay() !== 0 && now.getDay() !== 6;
      
      // BIST Kontrolü (Saat 11:00'ı geçtiyse ve bugün işlem günüyse)
      if (savedMonthBist === null) {
        localStorage.setItem('portfolios_v5', JSON.stringify(initialData));
        localStorage.setItem('rebalanceMonth_BIST', currentMonth.toString());
        // İlk girişte mevcut ayın portföyü zaten Firebase'den veya INITIAL_PORTFOLIOS'dan geldiği için
        // sıfırdan yeni bir tarama YAPMAMASI gerekiyor. Sadece fiyatları güncelliyoruz.
        refreshPortfolioPrices(initialData);
      } else if (parseInt(savedMonthBist) !== currentMonth && currentHour >= 11 && isBusinessDay) {
        rebalanceBISTPortfolios(allTickers, initialData);
      } else if (savedMonthBist === currentMonth.toString()) {
        refreshPortfolioPrices(initialData);
      }

      // ABD Kontrolü (Saat 18:00'ı geçtiyse ve bugün işlem günüyse)
      if (savedMonthUS === null) {
        localStorage.setItem('rebalanceMonth_US', currentMonth.toString());
        // Aynı şekilde ABD için de yeni cihaz/tarayıcıdan girildiğinde sıfırdan tarama yapma.
      } else if (parseInt(savedMonthUS) !== currentMonth && currentHour >= 18 && isBusinessDay) {
        rebalanceUSPortfolios();
      }

    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Yeni useEffect: Sadece cloud verisi yüklendikten SONRA tarayıcıyı başlat
  useEffect(() => {
    if (!isCloudLoading && totalBistUniverse.length > 0) {
      const initialActive = activeSwingTradesRef.current;
      if (initialActive.length < 5) {
         scanMarket(totalBistUniverse, false);
      } else {
         scanMarket(initialActive.map(t => t.ticker), true);
      }

      const initialActiveUS = activeUsSwingTradesRef.current;
      if (initialActiveUS.length < 5) {
         scanUSMarket(US_UNIVERSE_ALL, false);
      } else {
         scanUSMarket(initialActiveUS.map(t => t.ticker), true);
      }
      
      scannerInterval.current = setInterval(() => {
        const currentActiveTrades = activeSwingTradesRef.current;
        if (currentActiveTrades.length < 5) {
           scanMarket(totalBistUniverse, false);
        } else {
           scanMarket(currentActiveTrades.map(t => t.ticker), true);
        }

        const currentActiveUSTrades = activeUsSwingTradesRef.current;
        if (currentActiveUSTrades.length < 5) {
           scanUSMarket(US_UNIVERSE_ALL, false);
        } else {
           scanUSMarket(currentActiveUSTrades.map(t => t.ticker), true);
        }
        
        // Portföy fiyatlarını güncelle
        refreshPortfolioPrices(portfoliosRef.current);
        refreshUSPortfolioPrices(usPortfoliosRef.current);
      }, 10000);

      return () => clearInterval(scannerInterval.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCloudLoading, totalBistUniverse]);

  const refreshUSPortfolioPrices = async (currentPortfolios) => {
    const portfolioTickers = Object.values(currentPortfolios).flat().map(s => s.ticker);
    if (portfolioTickers.length === 0) return;
    const tvDataMap = await fetchTVDataForUSStocks(portfolioTickers);
    
    setUsPortfolios(prev => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].map(stock => {
          if (stock.isLocked) return stock;
          const data = tvDataMap[stock.ticker];
          if (data) {
            const currentPrice = data.currentPrice;
            const costPrice = parseFloat(stock.costPrice || currentPrice);
            
            let rawRet = ((currentPrice - costPrice) / costPrice) * 100;
            let ret = rawRet.toFixed(2);
            if (currentPrice > costPrice && ret === "0.00") ret = "0.01";
            if (currentPrice < costPrice && (ret === "-0.00" || ret === "0.00")) ret = "-0.01";
            if (currentPrice === costPrice) ret = "0.00";
            
            let dailyRet = "0.00";
            if (data.change !== null && data.change !== undefined) {
               dailyRet = data.change.toFixed(2);
            }
            if (parseFloat(ret) < -15) {
                return { ...stock, price: currentPrice.toFixed(2), return: ret, status: "ZARAR KES", isLocked: true };
            }
            return { ...stock, price: currentPrice.toFixed(2), return: ret, dailyReturn: dailyRet };
          }
          return stock;
        });
      }
      return updated;
    });
  };

  const refreshPortfolioPrices = async (currentPortfolios) => {
    const portfolioTickers = Object.values(currentPortfolios).flat().map(s => s.ticker);
    const tvDataMap = await fetchTVDataForStocks(portfolioTickers);
    
    setPortfolios(prev => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].map(stock => {
          if (stock.isLocked) return stock; // Zaten zarar kes kilitlenmişse fiyatını artık güncelleme!
          
          const data = tvDataMap[stock.ticker];
          if (data) {
            const currentPrice = data.currentPrice;
            const costPrice = parseFloat(stock.costPrice || currentPrice);
            
            let rawRet = ((currentPrice - costPrice) / costPrice) * 100;
            let ret = rawRet.toFixed(2);
            if (currentPrice > costPrice && ret === "0.00") ret = "0.01";
            if (currentPrice < costPrice && (ret === "-0.00" || ret === "0.00")) ret = "-0.01";
            if (currentPrice === costPrice) ret = "0.00";
            
            let dailyRet = "0.00";
            if (data.change !== null && data.change !== undefined) {
               dailyRet = data.change.toFixed(2);
            }
            
            // Portföy Stop-Loss (Zarar Kes) Mekanizması: Eğer hisse %15'ten fazla düşmüşse portföyden zorla çıkarıp nakite dön (Sıfırla) veya uyarı ver.
            // Burada kullanıcının "yüzde 57 zarar eden hisseleri istemiyorum" talebini karşılıyoruz. Eğer geçmişten gelen yapay hatalı maliyetler varsa, onları da sıfırlamış oluruz.
            if (parseFloat(ret) < -10) {
                return {
                    ...stock,
                    price: currentPrice.toFixed(2),
                    return: ret,
                    status: "ZARAR KES",
                    isLocked: true // Zararı burada dondur, daha fazla eksi yazmasın.
                };
            }
            
            return {
              ...stock,
              price: currentPrice.toFixed(2),
              return: ret,
              dailyReturn: dailyRet
            };
          }
          return stock;
        });
      }
      return updated;
    });
  };

  const generateMonthlyPortfolio = async (universe, strategyKey, previousPortfolio = [], tvDataMap = {}) => {
    let selected = [];
    for (const p of previousPortfolio) {
        // Zombi Hisse Engeli: Eğer hisse önceki ay stop-loss yemişse (Kilitliyse), puanı kaç olursa olsun yeni aya taşıma, çöpe at!
        if (p.isLocked) continue;
        
        const data = tvDataMap[p.ticker];
        if (data) {
            const evaluation = scoreStock(data, strategyKey);
            if (evaluation.score > 30) {
                const currentPrice = data.currentPrice;
                const costPrice = p.costPrice ? parseFloat(p.costPrice) : currentPrice;
                let rawRet = ((currentPrice - costPrice) / costPrice) * 100;
                let ret = rawRet.toFixed(2);
                if (currentPrice > costPrice && ret === "0.00") ret = "0.01";
                if (currentPrice < costPrice && (ret === "-0.00" || ret === "0.00")) ret = "-0.01";
                if (currentPrice === costPrice) ret = "0.00";
                
                let dailyRet = "0.00";
                if (data.change !== null && data.change !== undefined) {
                   dailyRet = data.change.toFixed(2);
                }
                
                selected.push({
                    ticker: p.ticker,
                    score: evaluation.score,
                    status: 'TUT',
                    return: ret,
                    dailyReturn: dailyRet,
                    price: currentPrice.toFixed(2),
                    costPrice: costPrice.toFixed(2),
                    reason: evaluation.reason
                });
            }
        }
    }
  
    const available = universe.filter(t => !selected.find(s => s.ticker === t));
    const needed = 5 - selected.length;
    
    if (needed > 0) {
        const scoredCandidates = [];
        for (const ticker of available) {
            const data = tvDataMap[ticker];
            if (data) {
                const evaluation = scoreStock(data, strategyKey);
                scoredCandidates.push({
                    ticker,
                    score: evaluation.score,
                    reason: evaluation.reason,
                    data
                });
            }
        }

        scoredCandidates.sort((a, b) => b.score - a.score);

        for (let i = 0; i < needed && i < scoredCandidates.length; i++) {
            const best = scoredCandidates[i];
            const currentPrice = best.data.currentPrice;
            const costPrice = currentPrice; // Gerçek piyasa fiyatı (Örn: Ayın 1'i saat 12:00'daki canlı fiyat)
            const ret = "0.00";
            
            let dailyRet = "0.00";
            if (best.data.change !== null && best.data.change !== undefined) {
               dailyRet = best.data.change.toFixed(2);
            }
            
            selected.push({
                ticker: best.ticker,
                score: best.score,
                status: 'YENİ',
                return: ret,
                dailyReturn: dailyRet,
                price: currentPrice.toFixed(2),
                costPrice: costPrice.toFixed(2),
                reason: best.reason
            });
        }
    }

    // Bütçe ve Lot hesaplaması (Her portföy 100.000 TL)
    const TARGET_CAPITAL = 100000;
    const targetPerStock = TARGET_CAPITAL / (selected.length || 1);

    selected = selected.map(s => {
        const cPrice = safeFloat(s.costPrice);
        let lots = 0;
        let weight = "0.00";
        if (cPrice > 0) {
            lots = Math.floor(targetPerStock / cPrice);
            weight = (((lots * cPrice) / TARGET_CAPITAL) * 100).toFixed(2);
        }
        return { ...s, weight, lots };
    });

    return selected.sort((a,b) => b.status.localeCompare(a.status));
  };

  const generateMonthlyUSPortfolio = async (universe, strategyKey, previousPortfolio = [], tvDataMap = {}) => {
    let selected = [];
    for (const p of previousPortfolio) {
        if (p.isLocked) continue;
        const data = tvDataMap[p.ticker];
        if (data) {
            const evaluation = scoreUSStock(data, strategyKey);
            if (evaluation.score > 30) {
                const currentPrice = data.currentPrice;
                const costPrice = p.costPrice ? parseFloat(p.costPrice) : currentPrice;
                const ret = (((currentPrice - costPrice) / costPrice) * 100).toFixed(2);
                let dailyRet = "0.00";
                if (data.change !== null && data.change !== undefined) {
                   dailyRet = data.change.toFixed(2);
                }
                selected.push({
                    ticker: p.ticker, score: evaluation.score, status: 'TUT', return: ret, dailyReturn: dailyRet,
                    price: currentPrice.toFixed(2), costPrice: costPrice.toFixed(2), reason: evaluation.reason
                });
            }
        }
    }
  
    const available = universe.filter(t => !selected.find(s => s.ticker === t));
    const needed = 5 - selected.length;
    
    if (needed > 0) {
        const scoredCandidates = [];
        for (const ticker of available) {
            const data = tvDataMap[ticker];
            if (data) {
                const evaluation = scoreUSStock(data, strategyKey);
                scoredCandidates.push({ ticker, score: evaluation.score, reason: evaluation.reason, data });
            }
        }

        scoredCandidates.sort((a, b) => b.score - a.score);

        for (let i = 0; i < needed && i < scoredCandidates.length; i++) {
            const best = scoredCandidates[i];
            const currentPrice = best.data.currentPrice;
            const costPrice = currentPrice;
            const ret = "0.00";
            let dailyRet = "0.00";
            if (best.data.change !== null && best.data.change !== undefined) {
               dailyRet = best.data.change.toFixed(2);
            }
            selected.push({
                ticker: best.ticker, score: best.score, status: 'YENİ', return: ret, dailyReturn: dailyRet,
                price: currentPrice.toFixed(2), costPrice: costPrice.toFixed(2), reason: best.reason
            });
        }
    }

    const TARGET_CAPITAL = 10000;
    const targetPerStock = TARGET_CAPITAL / (selected.length || 1);

    selected = selected.map(s => {
        const cPrice = safeFloat(s.costPrice);
        let lots = 0;
        let weight = "0.00";
        if (cPrice > 0) {
            lots = Math.floor(targetPerStock / cPrice);
            weight = (((lots * cPrice) / TARGET_CAPITAL) * 100).toFixed(2);
        }
        return { ...s, weight, lots };
    });

    return selected.sort((a,b) => b.status.localeCompare(a.status));
  };

  const rebalanceBISTPortfolios = async (fullUniverse = null, existingPortfolios = null) => {
    if (isRebalancing) return;
    setIsRebalancing(true);
    setRebalanceProgress(0);
    try {
        const universeList = fullUniverse || totalBistUniverse;
        const universeMap = getUniverseMap(universeList);
        const tvDataMap = await fetchTVDataForStocks(universeMap.alfa); 

        if (!tvDataMap || Object.keys(tvDataMap).length === 0) {
            throw new Error("TradingView API'den veri alınamadı. Portföyler güncellenemedi. (Vercel IP engeli vb.)");
        }

        const currentP = existingPortfolios || portfolios;

        setRebalanceProgress(25);
        const alfa = await generateMonthlyPortfolio(universeMap.alfa, 'alfa', currentP.alfa, tvDataMap);
        setRebalanceProgress(50);
        const beta = await generateMonthlyPortfolio(universeMap.beta, 'beta', currentP.beta, tvDataMap);
        setRebalanceProgress(75);
        const katilim = await generateMonthlyPortfolio(universeMap.katilim, 'katilim', currentP.katilim, tvDataMap);
        setRebalanceProgress(90);
        const delta = await generateMonthlyPortfolio(universeMap.delta, 'delta', currentP.delta, tvDataMap);

        const newPortfolios = { alfa, beta, katilim, delta };
        setPortfolios(newPortfolios);
        
        localStorage.setItem('portfolios_v5', JSON.stringify(newPortfolios));
        saveToFirebase('portfolios', newPortfolios);
        
        localStorage.setItem('rebalanceMonth_BIST', new Date().getMonth().toString());
        
        const dateStr = new Date().toLocaleString('tr-TR', { day: 'numeric', month: 'long' });
        localStorage.setItem('lastScanDate', dateStr);
        saveToFirebase('lastScanDate', dateStr);

    } catch(err) {
        console.error("BIST Portföy oluşturulurken hata:", err);
    } finally {
        setIsRebalancing(false);
        setRebalanceProgress(100);
        setTimeout(() => setRebalanceProgress(0), 2000);
    }
  };

  const rebalanceUSPortfolios = async () => {
    if (isRebalancing) return;
    setIsRebalancing(true);
    setRebalanceProgress(0);
    try {
        setRebalanceProgress(20);
        const usTvDataMap = await fetchTVDataForUSStocks(US_UNIVERSE_ALL);

        if (!usTvDataMap || Object.keys(usTvDataMap).length === 0) {
            throw new Error("TradingView API'den veri alınamadı. ABD Portföyleri güncellenemedi.");
        }

        const currentUs = usPortfolios;
        setRebalanceProgress(50);
        const usAlfa = await generateMonthlyUSPortfolio(US_ALFA, 'alfa', currentUs.alfa, usTvDataMap);
        setRebalanceProgress(70);
        const usBeta = await generateMonthlyUSPortfolio(US_BETA, 'beta', currentUs.beta, usTvDataMap);
        setRebalanceProgress(90);
        const usDelta = await generateMonthlyUSPortfolio(US_DELTA, 'delta', currentUs.delta, usTvDataMap);
        
        const newUsPortfolios = { alfa: usAlfa, beta: usBeta, delta: usDelta };
        setUsPortfolios(newUsPortfolios);
        saveToFirebase('usPortfolios', newUsPortfolios);
        
        localStorage.setItem('rebalanceMonth_US', new Date().getMonth().toString());
        
        const dateStr = new Date().toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        localStorage.setItem('lastScanDateUS', dateStr);
        saveToFirebase('lastScanDateUS', dateStr);

    } catch(err) {
        console.error("ABD Portföy oluşturulurken hata:", err);
    } finally {
        setIsRebalancing(false);
        setRebalanceProgress(100);
        setTimeout(() => setRebalanceProgress(0), 2000);
    }
  };
    
    const liveHistoricalData = useMemo(() => {
    const data = JSON.parse(JSON.stringify(MOCK_MONTHLY_HISTORY));
    const liveReturns = { alfa: 0, beta: 0, katilim: 0, delta: 0 };
    
    const targetPortfolios = marketMode === 'BIST' ? portfolios : usPortfolios;

    Object.entries(targetPortfolios).forEach(([key, portfolio]) => {
      let totalCost = 0;
      let totalCurrent = 0;
      portfolio.forEach(stock => {
        const lots = safeFloat(stock.lots);
        const costPrice = safeFloat(stock.costPrice) || safeFloat(stock.price);
        totalCost += lots * costPrice;
        totalCurrent += lots * safeFloat(stock.price);
      });
      const profit = totalCurrent - totalCost;
      const profitPct = totalCost > 0 ? safeFloat(((profit / totalCost) * 100).toFixed(2)) : 0;
      liveReturns[key] = isNaN(profitPct) ? 0 : profitPct;
    });

    if (data.length > 0) {
      data[data.length - 1] = {
        ...data[data.length - 1],
        ...liveReturns,
        details: targetPortfolios // Bu ayın detaylı portföy gösterimi için
      };
    }
    return data;
  }, [portfolios, usPortfolios, marketMode]);

  const liveDailyData = useMemo(() => {
    const data = JSON.parse(JSON.stringify(MOCK_DAILY_HISTORY));
    const liveReturns = { alfa: 0, beta: 0, katilim: 0, delta: 0 };
    
    const targetPortfolios = marketMode === 'BIST' ? portfolios : usPortfolios;

    Object.entries(targetPortfolios).forEach(([key, portfolio]) => {
      let totalCost = 0;
      let totalCurrent = 0;
      portfolio.forEach(stock => {
        const lots = safeFloat(stock.lots);
        const costPrice = safeFloat(stock.costPrice) || safeFloat(stock.price);
        totalCost += lots * costPrice;
        totalCurrent += lots * safeFloat(stock.price);
      });
      const profit = totalCurrent - totalCost;
      const profitPct = totalCost > 0 ? safeFloat(((profit / totalCost) * 100).toFixed(2)) : 0;
      liveReturns[key] = isNaN(profitPct) ? 0 : profitPct;
    });

    if (data.length > 0) {
      const currentYearMonth = new Date().toISOString().slice(0, 7);
      const currentMonthIndices = [];
      data.forEach((d, i) => {
        if (d.dateISO && d.dateISO.startsWith(currentYearMonth)) {
          currentMonthIndices.push(i);
        }
      });

      if (currentMonthIndices.length > 0) {
        const N = currentMonthIndices.length;
        const dailyAlfa = (Math.pow(1 + liveReturns.alfa / 100, 1 / N) - 1) * 100;
        const dailyBeta = (Math.pow(1 + liveReturns.beta / 100, 1 / N) - 1) * 100;
        const dailyKatilim = (Math.pow(1 + liveReturns.katilim / 100, 1 / N) - 1) * 100;
        const dailyDelta = (Math.pow(1 + liveReturns.delta / 100, 1 / N) - 1) * 100;

        currentMonthIndices.forEach((idx) => {
           data[idx] = {
             ...data[idx],
             alfa: safeFloat(dailyAlfa.toFixed(2)),
             beta: safeFloat(dailyBeta.toFixed(2)),
             katilim: safeFloat(dailyKatilim.toFixed(2)),
             delta: safeFloat(dailyDelta.toFixed(2))
           };
        });
      } else {
        data[data.length - 1] = {
          ...data[data.length - 1],
          ...liveReturns
        };
      }
    }
    return data;
  }, [portfolios, usPortfolios, marketMode]);

  if (isCloudLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-indigo-500">
        <div className="w-20 h-20 mb-6 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)] overflow-hidden bg-gray-900 border border-gray-800 flex items-center justify-center animate-pulse">
           <img src="/logo.png" alt="AlgOzi Logo" className="w-full h-full object-cover" />
        </div>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Veriler Analiz Ediliyor...</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">AlgOzi Trade Yapay Zeka Motoru Çalışıyor</p>
      </div>
    );
  }

  const currentPortfolios = marketMode === 'BIST' ? portfolios : usPortfolios;
  const currentActiveSwingTrades = marketMode === 'BIST' ? activeSwingTrades : activeUsSwingTrades;
  const currentPastSwingTrades = marketMode === 'BIST' ? pastSwingTrades : pastUsSwingTrades;
  const isUSD = marketMode === 'ABD';
  const currency = isUSD ? '$' : '₺';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[98%] mx-auto px-2 sm:px-6 lg:px-8 h-auto min-h-[64px] py-3 sm:py-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('portfolios')}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] overflow-hidden bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform">
               <img src="/logo.png" alt="AlgOzi Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">AlgOzi Trade</h1>
              <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 font-bold tracking-wide">YAPAY ZEKA DESTEKLİ CANLI PORTFÖY & SİNYAL YÖNETİMİ</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">

            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 shadow-sm">
              <button
                onClick={() => setMarketMode('BIST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                  marketMode === 'BIST'
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                <img src="https://flagcdn.com/w20/tr.png" srcSet="https://flagcdn.com/w40/tr.png 2x" alt="TR" className="w-4 h-auto rounded-[2px] shadow-sm" />
                TR
              </button>
              <button
                onClick={() => setMarketMode('ABD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                  marketMode === 'ABD'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                <img src="https://flagcdn.com/w20/us.png" srcSet="https://flagcdn.com/w40/us.png 2x" alt="US" className="w-4 h-auto rounded-[2px] shadow-sm" />
                ABD
              </button>
            </div>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`p-2 rounded-lg transition-colors ${activeTab === 'wallet' ? 'text-indigo-500 bg-indigo-500/10' : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Cüzdanım"
            >
              <Wallet className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Temayı Değiştir"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => { localStorage.removeItem('isAuthenticated'); window.location.reload(); }}
              className="hidden sm:flex items-center gap-2 p-2 px-3 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 font-semibold"
              title="Güvenli Çıkış"
            >
              <LogOut className="w-5 h-5" />
              Çıkış
            </button>
            <button
              onClick={() => { localStorage.removeItem('isAuthenticated'); window.location.reload(); }}
              className="sm:hidden p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Güvenli Çıkış"
            >
              <LogOut className="w-5 h-5" />
            </button>
            
            <div className="hidden md:flex items-center gap-2 text-base text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Canlı Veri Bağlantısı (15dk Gecikmeli)
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[98%] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="sticky top-20 sm:top-[76px] z-40 flex justify-start sm:justify-center space-x-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-2 rounded-2xl mb-8 w-full sm:mx-auto sm:max-w-fit overflow-x-auto border border-gray-200/50 dark:border-gray-700/50 shadow-lg whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setActiveTab('portfolios')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
              activeTab === 'portfolios' 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-700' 
                : 'text-gray-800 dark:text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:bg-gray-800/50'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Aylık Portföyler
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
              activeTab === 'scanner' 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-700' 
                : 'text-gray-800 dark:text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:bg-gray-800/50'
            }`}
          >
            <Zap className="w-4 h-4" />
            Swing Trade Sinyalleri
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
              activeTab === 'analytics' 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-700' 
                : 'text-gray-800 dark:text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:bg-gray-800/50'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Performans Analizi
          </button>
          {marketMode === 'BIST' && (
            <button
              onClick={() => setActiveTab('funds')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
                activeTab === 'funds' 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-700' 
                  : 'text-gray-800 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:bg-gray-800/50'
              }`}
            >
              <PieChart className="w-4 h-4 text-purple-500" />
              TR Fon Analizi
            </button>
          )}
          {marketMode === 'ABD' && (
            <>
              <button
                onClick={() => setActiveTab('etfs')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
                  activeTab === 'etfs' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-700' 
                    : 'text-gray-800 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:bg-gray-800/50'
                }`}
              >
                <Target className="w-4 h-4 text-blue-500" />
                ETFs
              </button>
              <button
                onClick={() => setActiveTab('balance')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
                  activeTab === 'balance' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-700' 
                    : 'text-gray-800 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:bg-gray-800/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Bilanço Analizi
              </button>
            </>
          )}
          {marketMode === 'BIST' && (
            <>
              <button
                onClick={() => setActiveTab('balance')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
                  activeTab === 'balance' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-700' 
                    : 'text-gray-800 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:bg-gray-800/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Bilanço Analizi
              </button>
              <button
                onClick={() => setActiveTab('ipo')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
                  activeTab === 'ipo' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-700' 
                    : 'text-gray-800 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:bg-gray-800/50'
                }`}
              >
                <Rocket className="w-4 h-4" />
                Halka Arz
              </button>
            </>
          )}
        </div>
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'portfolios' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">Algoritmik Model Portföyler</h2>
                  <p className="text-base text-gray-800 dark:text-gray-400 dark:text-gray-400 mt-1">Her ayın ilk işlem günü arka planda tam otomatik olarak taranır ve yenilenir.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-semibold text-indigo-400">
                    <div className="flex items-center gap-1.5 bg-indigo-500/10 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      Son Tarama: {marketMode === 'ABD' ? (localStorage.getItem('lastScanDateUS') || '11 Ağustos 2026') : (localStorage.getItem('lastScanDate') || '06 Ağustos 2026')}
                    </div>
                    <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      Sonraki Otomatik Tarama: {getNextRebalanceDate(marketMode)}
                    </div>
                  </div>
                </div>
                {isRebalancing && (
                  <div className="flex items-center gap-3 bg-indigo-500/20 px-4 py-2 rounded-lg border border-indigo-500/30">
                     <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                     <div className="flex flex-col">
                       <span className="text-sm text-indigo-300 font-bold">YENİ AY TARAMASI YAPILIYOR</span>
                       <span className="text-xs text-gray-800 dark:text-gray-400 dark:text-gray-400">Tüm piyasa analiz ediliyor... %{rebalanceProgress}</span>
                     </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {['alfa', 'beta', 'katilim', 'delta'].filter(key => currentPortfolios[key] && (marketMode === 'BIST' || key !== 'katilim')).map(key => {
                  const portfolio = currentPortfolios[key];
                  const info = (marketMode === 'ABD' ? US_STRATEGIES : STRATEGIES)[key];
                  const Icon = info.icon;
                  let totalCost = 0;
                  let totalCurrent = 0;
                  portfolio.forEach(stock => {
                    const lots = safeFloat(stock.lots);
                    const costPrice = safeFloat(stock.costPrice) || safeFloat(stock.price);
                    totalCost += lots * costPrice;
                    totalCurrent += lots * safeFloat(stock.price);
                  });
                  const profit = totalCurrent - totalCost;
                  const returnDivisor = isUSD ? 100 : 1000;
                  const portfolioReturn = (profit / returnDivisor).toFixed(2);
                  return (
                    <div key={key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg">
                      <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${info.bg}`}><Icon className={`w-5 h-5 ${info.color}`} /></div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{info.name}</h3>
                            <p className="text-sm text-gray-800 dark:text-gray-400 dark:text-gray-400 mt-0.5">{info.desc}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`text-base px-3 py-1.5 rounded-lg font-bold shadow-sm ${portfolioReturn >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn}% <span className="hidden sm:inline">Aylık Getiri</span>
                          </span>
                        </div>
                      </div>
                      <div className="p-0 overflow-x-auto w-full">
                        <table className="w-full min-w-[700px] text-base text-left">
                          <thead className="text-sm text-gray-800 dark:text-gray-400 bg-white/50 dark:bg-gray-900/50 uppercase border-b border-gray-200 dark:border-gray-800">
                            <tr>
                              <th className="px-5 py-3 font-medium">Hisse</th>
                              <th className="px-5 py-3 font-medium">Durum</th>
                              <th className="px-5 py-3 font-semibold text-right">Ağırlık</th>
                              <th className="px-5 py-3 font-medium text-right">Maliyet</th>
                              <th className="px-5 py-3 font-medium text-right">Güncel Fiyat</th>
                              <th className="px-5 py-3 font-medium text-right">Günlük Getiri</th>
                              <th className="px-5 py-3 font-medium text-right">Toplam Getiri</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {portfolio.map((stock, i) => (
                              <tr key={i} className="hover:bg-gray-100/40 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="px-5 py-4 font-mono font-bold text-gray-900 dark:text-white text-lg">{stock.ticker}</td>
                                <td className="px-5 py-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium border ${
                                    stock.status === 'YENİ' 
                                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                      : stock.status === 'ZARAR KES'
                                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  }`}>{stock.status}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="text-gray-800 dark:text-gray-400 dark:text-gray-400 font-mono text-base">
                                    %{( (safeFloat(stock.lots) * (safeFloat(stock.costPrice) || safeFloat(stock.price))) / (isUSD ? 100 : 1000) ).toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right font-mono text-base text-gray-800 dark:text-gray-400 dark:text-gray-400">
                                  {currency}{safeFloat(stock.costPrice) ? safeFloat(stock.costPrice).toFixed(2) : safeFloat(stock.price).toFixed(2)}
                                </td>
                                <td className="px-5 py-4 text-right font-mono font-medium text-gray-700 dark:text-gray-200">
                                  {currency}{safeFloat(stock.price).toFixed(2)}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className={`text-base font-bold inline-flex justify-center items-center gap-1 w-[90px] px-2.5 py-1 rounded-lg border ${safeFloat(stock.dailyReturn) >= 0 ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 'bg-orange-500/10 text-orange-500 border-orange-500/30'}`}>
                                    {parseFloat(stock.dailyReturn || 0) >= 0 ? '+' : ''}{stock.dailyReturn || "0.00"}%
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className={`text-base font-bold inline-flex justify-center items-center gap-1 w-[90px] px-2.5 py-1 rounded-lg border ${safeFloat(stock.return) >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'}`}>
                                    {parseFloat(stock.return) >= 0 ? '+' : ''}{stock.return}%
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'scanner' && (() => {
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
                  activeTrades={currentActiveSwingTrades}
                  pastTrades={currentPastSwingTrades}
                  isScanning={isScanning}
                  lastUpdate={displayLastUpdate}
                  marketMode={marketMode}
                />
              );
          })()}

          {activeTab === 'analytics' && (
             <AnalyticsDashboard historicalData={liveHistoricalData} dailyData={liveDailyData} marketMode={marketMode} />
          )}

          {activeTab === 'wallet' && marketMode === 'ABD' && (
             <WalletDashboard key={`wallet-${marketMode}`} portfolios={usPortfolios} activeSwingTrades={activeUsSwingTrades} pastSwingTrades={pastUsSwingTrades} marketMode={marketMode} />
          )}
          {activeTab === 'wallet' && marketMode === 'BIST' && (
             <WalletDashboard key={`wallet-${marketMode}`} portfolios={portfolios} activeSwingTrades={activeSwingTrades} pastSwingTrades={pastSwingTrades} marketMode={marketMode} />
          )}

          {activeTab === 'balance' && (
             <BalanceSheetDashboard marketMode={marketMode} />
          )}

          {activeTab === 'ipo' && marketMode === 'BIST' && (
             <IpoDashboard />
          )}
          
          {activeTab === 'funds' && (
             <FundsDashboard />
          )}

          {activeTab === 'etfs' && (
             <ETFDashboard />
          )}
        </div>
        
        {/* Yasal Uyarı - Tüm Sekmelerde Ortak Görünür */}
        <div className="mt-12 bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm sm:text-base text-amber-800 dark:text-amber-200/80">
            <strong className="text-amber-700 dark:text-amber-500 block mb-1">Yasal Uyarı ve Bilgilendirme</strong>
            Burada yer alan bilgi ve algoritmik sinyaller yatırım danışmanlığı kapsamında değildir. Sistemdeki piyasa verileri borsadan en az <strong>15 dakika gecikmeli</strong> olarak sağlanmaktadır. Sistem tarafından üretilen skorlar veya sonuçlar kesin kazanç garantisi vermez, yatırımlarınızı kendi risk profilinize göre değerlendiriniz.
          </div>
        </div>
      </main>

      {/* Yukarı Çık Butonu */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 z-50 flex items-center justify-center ${showScrollTop ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-10 invisible'}`}
        title="Yukarı Çık"
      >
        <ArrowUp className="w-6 h-6" />
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}} />
    </div>
  );
}
