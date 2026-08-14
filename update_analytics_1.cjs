const fs = require('fs');
let content = fs.readFileSync('src/components/AnalyticsDashboard.jsx', 'utf8');

// Update signature
content = content.replace(
  'export default function AnalyticsDashboard({ historicalData, dailyData }) {',
  'export default function AnalyticsDashboard({ historicalData, dailyData, marketMode }) {'
);

// Update bestPortfolio logic
const oldBestPortfolio = `  const bestPortfolio = useMemo(() => {
      if(chartData.length === 0) return null;
      const last = chartData[chartData.length - 1];
      const ports = [
          { name: 'ALFA', val: parseFloat(last.cumAlfa), color: COLORS.alfa },
          { name: 'BETA', val: parseFloat(last.cumBeta), color: COLORS.beta },
          { name: 'KATILIM', val: parseFloat(last.cumKatilim), color: COLORS.katilim },
          { name: 'DELTA', val: parseFloat(last.cumDelta), color: COLORS.delta }
      ];
      ports.sort((a,b) => b.val - a.val);
      return ports[0];
  }, [chartData]);`;

const newBestPortfolio = `  const bestPortfolio = useMemo(() => {
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
  }, [chartData, marketMode]);`;

content = content.replace(oldBestPortfolio, newBestPortfolio);

// Update indexBeaters logic
const oldIndexBeaters = `  const indexBeaters = useMemo(() => {
      if(chartData.length === 0) return 0;
      const last = chartData[chartData.length - 1];
      const bist = parseFloat(last.cumBist100);
      let count = 0;
      if (parseFloat(last.cumAlfa) > bist) count++;
      if (parseFloat(last.cumBeta) > bist) count++;
      if (parseFloat(last.cumKatilim) > bist) count++;
      if (parseFloat(last.cumDelta) > bist) count++;
      return count;
  }, [chartData]);`;

const newIndexBeaters = `  const indexBeaters = useMemo(() => {
      if(chartData.length === 0) return 0;
      const last = chartData[chartData.length - 1];
      const benchmark = marketMode === 'ABD' ? parseFloat(last.cumNasdaq) : parseFloat(last.cumBist100);
      let count = 0;
      if (parseFloat(last.cumAlfa) > benchmark) count++;
      if (parseFloat(last.cumBeta) > benchmark) count++;
      if (marketMode !== 'ABD' && parseFloat(last.cumKatilim) > benchmark) count++;
      if (parseFloat(last.cumDelta) > benchmark) count++;
      return count;
  }, [chartData, marketMode]);`;

content = content.replace(oldIndexBeaters, newIndexBeaters);

// Update Benchmarks UI (check around line 250+)
// Wait, I don't know the exact lines for benchmarks UI. I should grep or view first.
fs.writeFileSync('src/components/AnalyticsDashboard.jsx', content);
console.log('Updated AnalyticsDashboard part 1');
