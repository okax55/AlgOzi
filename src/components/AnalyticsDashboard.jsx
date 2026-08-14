import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, LabelList 
} from 'recharts';
import { Calendar, TrendingUp, BarChart2, Activity, Trophy, Target, CheckCircle2, Circle } from 'lucide-react';

let globalBenchmarks = {
  bist100: false,
  nasdaq: false,
  sp500: false,
  altin: false
};

const COLORS = {
  alfa: '#f59e0b', // amber-500
  beta: '#06b6d4', // cyan-500
  katilim: '#10b981', // emerald-500
  delta: '#ec4899', // pink-500
  bist100: '#ef4444', // red-500
  nasdaq: '#8b5cf6', // purple-500
  sp500: '#14b8a6', // teal-500
  altin: '#eab308' // yellow-500
};

export default function AnalyticsDashboard({ historicalData, dailyData, marketMode }) {
  const [timeRange, setTimeRange] = useState('YTD');
  const [selectedMonthData, setSelectedMonthData] = useState(null);
  const [benchmarks, setBenchmarks] = useState(globalBenchmarks);

  const toggleBenchmark = (key) => {
    setBenchmarks(prev => {
        const next = { ...prev, [key]: !prev[key] };
        globalBenchmarks = next; // Update global state
        return next;
    });
  };

  // Filter historical data based on timeRange
  const processedData = useMemo(() => {
    let data = [...historicalData];
    
    if (timeRange === '1H') data = data.slice(-1); // 1 Hafta (Aylık grafikte son ay gösterilir)
    else if (timeRange === '1A') data = data.slice(-1);
    else if (timeRange === '3A') data = data.slice(-3);
    else if (timeRange === '6A') data = data.slice(-6);
    else if (timeRange === '1Y') data = data.slice(-12);
    else if (timeRange === '2Y') data = data.slice(-24);
    else if (timeRange === 'MAKS') data = data;
    else if (timeRange === 'YTD') {
      const currentYearStr = new Date().getFullYear().toString();
      const ocaIndex = data.findIndex(d => d.month.includes('Oca') && d.month.includes(currentYearStr));
      if (ocaIndex !== -1) {
        data = data.slice(ocaIndex);
      }
    }
    
    return data;
  }, [historicalData, timeRange]);

  // Calculate Cumulative (Compound) Returns for the Line Chart
  const chartData = useMemo(() => {
    let cumulative = { alfa: 0, beta: 0, katilim: 0, delta: 0, bist100: 0, nasdaq: 0, sp500: 0, altin: 0 };

    return processedData.map(monthData => {
      const calcCum = (oldVal, ret) => {
        if (oldVal === null && ret === null) return null;
        const o = oldVal === null ? 0 : oldVal;
        const r = ret === null ? 0 : ret;
        return (((1 + o / 100) * (1 + r / 100)) - 1) * 100;
      };
      
      cumulative.alfa = monthData.alfa !== null ? calcCum(cumulative.alfa, monthData.alfa) : null;
      cumulative.beta = monthData.beta !== null ? calcCum(cumulative.beta, monthData.beta) : null;
      cumulative.katilim = monthData.katilim !== null ? calcCum(cumulative.katilim, monthData.katilim) : null;
      cumulative.delta = monthData.delta !== null ? calcCum(cumulative.delta, monthData.delta) : null;
      
      cumulative.bist100 = calcCum(cumulative.bist100 === null ? 0 : cumulative.bist100, monthData.bist100);
      cumulative.nasdaq = calcCum(cumulative.nasdaq === null ? 0 : cumulative.nasdaq, monthData.nasdaq);
      cumulative.sp500 = calcCum(cumulative.sp500 === null ? 0 : cumulative.sp500, monthData.sp500);
      cumulative.altin = calcCum(cumulative.altin === null ? 0 : cumulative.altin, monthData.altin);

      return {
        month: monthData.month,
        // Cumulative
        cumAlfa: cumulative.alfa !== null ? cumulative.alfa.toFixed(2) : null,
        cumBeta: cumulative.beta !== null ? cumulative.beta.toFixed(2) : null,
        cumKatilim: cumulative.katilim !== null ? cumulative.katilim.toFixed(2) : null,
        cumDelta: cumulative.delta !== null ? cumulative.delta.toFixed(2) : null,
        cumBist100: cumulative.bist100.toFixed(2),
        cumNasdaq: cumulative.nasdaq.toFixed(2),
        cumSp500: cumulative.sp500.toFixed(2),
        cumAltin: cumulative.altin.toFixed(2),
        // Monthly
        mAlfa: monthData.alfa,
        mBeta: monthData.beta,
        mKatilim: monthData.katilim,
        mDelta: monthData.delta
      };
    });
  }, [processedData]);

  // Filter daily data based on timeRange
  const processedDailyData = useMemo(() => {
    let data = [...dailyData];
    
    if (timeRange === '1H') data = data.slice(-5);
    else if (timeRange === '1A') data = data.slice(-21);
    else if (timeRange === '3A') data = data.slice(-63);
    else if (timeRange === '6A') data = data.slice(-126);
    else if (timeRange === '1Y') data = data.slice(-252);
    else if (timeRange === '2Y') data = data.slice(-504);
    else if (timeRange === 'MAKS') data = data;
    else if (timeRange === 'YTD') {
      const currentYearStr = new Date().getFullYear().toString();
      const ocaIndex = data.findIndex(d => d.dateISO && d.dateISO.startsWith(currentYearStr));
      if (ocaIndex !== -1) {
        data = data.slice(ocaIndex);
      } else {
        data = data.slice(-150); // fallback roughly
      }
    }
    
    return data;
  }, [dailyData, timeRange]);

  // Daily Chart processing
  const dailyChartData = useMemo(() => {
    let cumBist = 0;
    let cumAltin = 0;
    let cumAlfa = 0, cumBeta = 0, cumKatilim = 0, cumDelta = 0;
    
    return processedDailyData.map(dayData => {
        const calcCum = (oldVal, ret) => {
            if (oldVal === null && ret === null) return null;
            return (((1 + (oldVal || 0) / 100) * (1 + (ret || 0) / 100)) - 1) * 100;
        };
        
        cumBist = calcCum(cumBist, dayData.bist100);
        cumAltin = calcCum(cumAltin, dayData.altin);
        
        cumAlfa = dayData.alfa !== null ? calcCum(cumAlfa, dayData.alfa) : null;
        cumBeta = dayData.beta !== null ? calcCum(cumBeta, dayData.beta) : null;
        cumKatilim = dayData.katilim !== null ? calcCum(cumKatilim, dayData.katilim) : null;
        cumDelta = dayData.delta !== null ? calcCum(cumDelta, dayData.delta) : null;
        
        return {
            day: dayData.day,
            dAlfa: cumAlfa !== null ? parseFloat(cumAlfa.toFixed(2)) : null,
            dBeta: cumBeta !== null ? parseFloat(cumBeta.toFixed(2)) : null,
            dKatilim: cumKatilim !== null ? parseFloat(cumKatilim.toFixed(2)) : null,
            dDelta: cumDelta !== null ? parseFloat(cumDelta.toFixed(2)) : null,
            dBist100: parseFloat(cumBist.toFixed(2)),
            dAltin: parseFloat(cumAltin.toFixed(2))
        };
    });
  }, [processedDailyData]);

  // KPI Calculations
  const bestPortfolio = useMemo(() => {
      if(chartData.length === 0) return null;
      const last = chartData[chartData.length - 1];
      let ports = [
          { name: 'ALFA', val: parseFloat(last.cumAlfa), color: COLORS.alfa },
          { name: 'BETA', val: parseFloat(last.cumBeta), color: COLORS.beta },
          { name: 'KATILIM', val: parseFloat(last.cumKatilim), color: COLORS.katilim },
          { name: 'DELTA', val: parseFloat(last.cumDelta), color: COLORS.delta }
      ];
      if (marketMode === 'ABD') {
          ports = ports.filter(p => p.name !== 'KATILIM');
      }
      ports.sort((a,b) => b.val - a.val);
      return ports[0];
  }, [chartData, marketMode]);

  const indexBeaters = useMemo(() => {
      if(chartData.length === 0) return 0;
      const last = chartData[chartData.length - 1];
      const benchmark = marketMode === 'ABD' ? parseFloat(last.cumNasdaq) : parseFloat(last.cumBist100);
      let count = 0;
      if (parseFloat(last.cumAlfa) > benchmark) count++;
      if (parseFloat(last.cumBeta) > benchmark) count++;
      if (marketMode !== 'ABD' && parseFloat(last.cumKatilim) > benchmark) count++;
      if (parseFloat(last.cumDelta) > benchmark) count++;
      return count;
  }, [chartData, marketMode]);


  const CustomTooltip = ({ active, payload, label, suffix = '%' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl z-50">
          <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => {
            
            const cleanName = entry.name.replace('cum', '').replace('m', '').replace('d', '').replace('Bist100', 'BIST 100').replace('Sp500', 'S&P 500').replace('Altin', 'Altın');
            return (
              <div key={index} className="flex items-center gap-2 text-base">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-600 dark:text-gray-300 capitalize">{cleanName}:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{entry.value}{suffix}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            Performans Analizi (Bileşik & Günlük)
          </h2>
          <p className="text-base text-gray-800 dark:text-gray-400 dark:text-gray-400 mt-1">
            Algoritmik portföylerin endekslerle kıyası ve zamana yayılan <strong>Bileşik (Compound) Getiri</strong> büyümesi.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 p-1 rounded-lg border border-gray-200 dark:border-gray-800 flex-wrap">
          {['1H', '1A', '3A', '6A', 'YTD', '1Y', '2Y', 'MAKS'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === range 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-gray-800'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards & Benchmark Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
                  <Trophy className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm text-gray-800 dark:text-gray-400 dark:text-gray-400 font-medium uppercase tracking-wider">En Kârlı Portföy ({timeRange})</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1" style={{ color: bestPortfolio?.color }}>
                      {bestPortfolio ? `${bestPortfolio.name} (+%${bestPortfolio.val})` : '-'}
                  </p>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-500">
                  <Target className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm text-gray-800 dark:text-gray-400 dark:text-gray-400 font-medium uppercase tracking-wider">BIST 100'ü Yenen Portföyler</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {indexBeaters} / 4
                  </p>
              </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl flex flex-col justify-center gap-2">
              <p className="text-sm text-gray-800 dark:text-gray-400 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Karşılaştırma Endeksleri</p>
              <div className="flex flex-wrap gap-2">
                  <button onClick={() => toggleBenchmark('bist100')} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors ${benchmarks.bist100 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'}`}>
                      {benchmarks.bist100 ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />} BIST 100
                  </button>
                  <button onClick={() => toggleBenchmark('nasdaq')} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors ${benchmarks.nasdaq ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'}`}>
                      {benchmarks.nasdaq ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />} NASDAQ
                  </button>
                  <button onClick={() => toggleBenchmark('sp500')} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors ${benchmarks.sp500 ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'}`}>
                      {benchmarks.sp500 ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />} S&P 500
                  </button>
                  <button onClick={() => toggleBenchmark('altin')} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors ${benchmarks.altin ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'}`}>
                      {benchmarks.altin ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />} ALTIN
                  </button>
              </div>
          </div>
      </div>

      {/* Cumulative Line Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Kümülatif Bileşik Getiri (%)
          </h3>
          <div className="text-sm text-gray-800 dark:text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Her ay sonu kârın ana paraya eklenmesiyle hesaplanır
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `${val}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
                              <ReferenceLine y={0} stroke="#4B5563" strokeWidth={0.5} strokeOpacity={0.5} />
              {/* Portfolios */}
              <Line isAnimationActive={false} type="monotone" dataKey="cumAlfa" name="ALFA" stroke={COLORS.alfa} strokeWidth={3} dot={{ r: 4, fill: COLORS.alfa }} activeDot={{ r: 6 }} />
              <Line isAnimationActive={false} type="monotone" dataKey="cumBeta" name="BETA" stroke={COLORS.beta} strokeWidth={3} dot={{ r: 4, fill: COLORS.beta }} activeDot={{ r: 6 }} />
              {marketMode !== 'ABD' && <Line isAnimationActive={false} type="monotone" dataKey="cumKatilim" name="KATILIM" stroke={COLORS.katilim} strokeWidth={3} dot={{ r: 4, fill: COLORS.katilim }} activeDot={{ r: 6 }} />}
              <Line isAnimationActive={false} type="monotone" dataKey="cumDelta" name="DELTA" stroke={COLORS.delta} strokeWidth={3} dot={{ r: 4, fill: COLORS.delta }} activeDot={{ r: 6 }} />
              
              {/* Benchmarks (Dashed) */}
              {benchmarks.bist100 && <Line isAnimationActive={false} type="monotone" dataKey="cumBist100" name="BIST 100" stroke={COLORS.bist100} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />}
              {benchmarks.nasdaq && <Line isAnimationActive={false} type="monotone" dataKey="cumNasdaq" name="NASDAQ" stroke={COLORS.nasdaq} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />}
              {benchmarks.sp500 && <Line isAnimationActive={false} type="monotone" dataKey="cumSp500" name="S&P 500" stroke={COLORS.sp500} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />}
              {benchmarks.altin && <Line isAnimationActive={false} type="monotone" dataKey="cumAltin" name="ALTIN" stroke={COLORS.altin} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Returns Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              Günlük Performans Kıyaslaması (%)
            </h3>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                
                                <ReferenceLine y={0} stroke="#4B5563" strokeWidth={0.5} strokeOpacity={0.5} />
                <Line isAnimationActive={false} type="monotone" dataKey="dAlfa" name="ALFA" stroke={COLORS.alfa} strokeWidth={2} dot={false} />
                <Line isAnimationActive={false} type="monotone" dataKey="dBeta" name="BETA" stroke={COLORS.beta} strokeWidth={2} dot={false} />
                {marketMode !== 'ABD' && <Line isAnimationActive={false} type="monotone" dataKey="dKatilim" name="KATILIM" stroke={COLORS.katilim} strokeWidth={2} dot={false} />}
                <Line isAnimationActive={false} type="monotone" dataKey="dDelta" name="DELTA" stroke={COLORS.delta} strokeWidth={2} dot={false} />
                
                {benchmarks.bist100 && <Line isAnimationActive={false} type="monotone" dataKey="dBist100" name="BIST 100" stroke={COLORS.bist100} strokeWidth={2} strokeDasharray="3 3" dot={false} />}
                {benchmarks.altin && <Line isAnimationActive={false} type="monotone" dataKey="dAltin" name="ALTIN" stroke={COLORS.altin} strokeWidth={2} strokeDasharray="3 3" dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Bar Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              Aylık Performans Kıyaslaması (%)
            </h3>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 13 }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 13 }} tickFormatter={(val) => `${val}%`} domain={['auto', dataMax => Math.max(Math.ceil(dataMax * 1.25), dataMax + 5)]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: document.documentElement.classList.contains('dark') ? '#1F2937' : '#F3F4F6' }} />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                
                                <ReferenceLine y={0} stroke="#4B5563" strokeWidth={0.5} strokeOpacity={0.5} />
                {['mAlfa', 'mBeta', 'mKatilim', 'mDelta'].map((key, i) => {
                    const portName = key.substring(1).toUpperCase();
                    return (
                        <Bar isAnimationActive={false} 
                          key={key}
                          dataKey={key} 
                          name={portName} 
                          fill={COLORS[portName.toLowerCase()]} 
                          radius={[4, 4, 0, 0]} 
                          className="cursor-pointer" 
                          onClick={(data) => {
                              const monthStr = data?.payload?.month || data?.month;
                              if (monthStr) {
                                  const detailed = historicalData.find(d => d.month === monthStr);
                                  if (detailed && detailed.details) {
                                      setSelectedMonthData(detailed);
                                  }
                              }
                          }}
                        >
                          {['1H', '1A'].includes(timeRange) && (
                              <LabelList dataKey={key} position="top" fill={document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#000000'} fontSize={16} fontWeight="bold" formatter={(val) => val > 0 ? `+%${val}` : `%${val}`} />
                          )}
                        </Bar>
                    )
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-indigo-400 animate-pulse">Sütunlara tıklayarak o ayın portföy hisselerini inceleyebilirsiniz.</p>
          </div>
        </div>
      </div>

      {/* Drill-down Detailed Month View */}
      {selectedMonthData && selectedMonthData.details && (
        <div className="bg-white dark:bg-gray-900 border border-indigo-500/30 p-6 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.1)] animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-500" />
                {selectedMonthData.month} Detaylı Portföy Raporu
              </h3>
              <p className="text-base text-gray-800 dark:text-gray-400 dark:text-gray-400 mt-1">O ay içinde algoritmamız tarafından seçilen hisseler ve net kâr/zarar performansları.</p>
            </div>
            <button 
              onClick={() => setSelectedMonthData(null)}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-base transition-colors"
            >
              Kapat
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {['alfa', 'beta', 'katilim', 'delta'].filter(k => marketMode !== 'ABD' || k !== 'katilim').map(key => {
              const stocks = selectedMonthData.details[key];
              const monthReturn = selectedMonthData[key];
              if (!stocks) return null;
              
              return (
                <div key={key} className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <div className={`p-3 text-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900`}>
                    <h4 className="font-bold text-gray-900 dark:text-white uppercase" style={{ color: COLORS[key] }}>{key} Portföyü</h4>
                    <div className={`text-xl font-bold mt-1 ${monthReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Net Getiri: {monthReturn >= 0 ? '+' : ''}{monthReturn}%
                    </div>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="text-gray-800 dark:text-gray-400 bg-white/50 dark:bg-gray-900/50 uppercase">
                      <tr>
                        <th className="px-3 py-2 font-medium">Hisse</th>
                        <th className="px-3 py-2 font-medium text-right">Getiri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {stocks.map((stock, i) => (
                        <tr key={i} className="hover:bg-gray-100/50 dark:bg-gray-800/50 transition-colors">
                          <td className="px-3 py-2.5 font-mono text-gray-700 dark:text-gray-200">{stock.ticker}</td>
                          <td className={`px-3 py-2.5 text-right font-bold ${stock.return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stock.return >= 0 ? '+' : ''}{stock.return}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  );
}
