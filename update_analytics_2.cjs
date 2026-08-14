const fs = require('fs');
let content = fs.readFileSync('src/components/AnalyticsDashboard.jsx', 'utf8');

const oldLineKatilim1 = `<Line isAnimationActive={false} type="monotone" dataKey="cumKatilim" name="KATILIM" stroke={COLORS.katilim} strokeWidth={3} dot={{ r: 4, fill: COLORS.katilim }} activeDot={{ r: 6 }} />`;
const newLineKatilim1 = `{marketMode !== 'ABD' && <Line isAnimationActive={false} type="monotone" dataKey="cumKatilim" name="KATILIM" stroke={COLORS.katilim} strokeWidth={3} dot={{ r: 4, fill: COLORS.katilim }} activeDot={{ r: 6 }} />}`;

const oldLineKatilim2 = `<Line isAnimationActive={false} type="monotone" dataKey="dKatilim" name="KATILIM" stroke={COLORS.katilim} strokeWidth={2} dot={false} />`;
const newLineKatilim2 = `{marketMode !== 'ABD' && <Line isAnimationActive={false} type="monotone" dataKey="dKatilim" name="KATILIM" stroke={COLORS.katilim} strokeWidth={2} dot={false} />}`;

const oldBenchmarkMapping = `{['alfa', 'beta', 'katilim', 'delta'].map(key => {`;
const newBenchmarkMapping = `{['alfa', 'beta', 'katilim', 'delta'].filter(k => marketMode !== 'ABD' || k !== 'katilim').map(key => {`;

content = content.replace(oldLineKatilim1, newLineKatilim1);
content = content.replace(oldLineKatilim2, newLineKatilim2);
content = content.replace(oldBenchmarkMapping, newBenchmarkMapping);

// Now for bist100 and altin vs nasdaq and sp500 in chart UI
// First find them
const oldBist1 = `{benchmarks.bist100 && <Line isAnimationActive={false} type="monotone" dataKey="cumBist100" name="BİST 100" stroke={COLORS.bist100} strokeWidth={2} strokeDasharray="5 5" dot={false} />}`;
const newBist1 = `{benchmarks.bist100 && marketMode !== 'ABD' && <Line isAnimationActive={false} type="monotone" dataKey="cumBist100" name="BİST 100" stroke={COLORS.bist100} strokeWidth={2} strokeDasharray="5 5" dot={false} />}`;

const oldNasdaq1 = `{benchmarks.nasdaq && <Line isAnimationActive={false} type="monotone" dataKey="cumNasdaq" name="NASDAQ" stroke={COLORS.nasdaq} strokeWidth={2} strokeDasharray="5 5" dot={false} />}`;
const newNasdaq1 = `{benchmarks.nasdaq && marketMode === 'ABD' && <Line isAnimationActive={false} type="monotone" dataKey="cumNasdaq" name="NASDAQ" stroke={COLORS.nasdaq} strokeWidth={2} strokeDasharray="5 5" dot={false} />}`;

const oldSp5001 = `{benchmarks.sp500 && <Line isAnimationActive={false} type="monotone" dataKey="cumSp500" name="S&P 500" stroke={COLORS.sp500} strokeWidth={2} strokeDasharray="5 5" dot={false} />}`;
const newSp5001 = `{benchmarks.sp500 && marketMode === 'ABD' && <Line isAnimationActive={false} type="monotone" dataKey="cumSp500" name="S&P 500" stroke={COLORS.sp500} strokeWidth={2} strokeDasharray="5 5" dot={false} />}`;

const oldAltin1 = `{benchmarks.altin && <Line isAnimationActive={false} type="monotone" dataKey="cumAltin" name="Altın (Gram)" stroke={COLORS.altin} strokeWidth={2} strokeDasharray="5 5" dot={false} />}`;
const newAltin1 = `{benchmarks.altin && marketMode !== 'ABD' && <Line isAnimationActive={false} type="monotone" dataKey="cumAltin" name="Altın (Gram)" stroke={COLORS.altin} strokeWidth={2} strokeDasharray="5 5" dot={false} />}`;


const oldBist2 = `{benchmarks.bist100 && <Line isAnimationActive={false} type="monotone" dataKey="dBist100" name="BİST 100" stroke={COLORS.bist100} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />}`;
const newBist2 = `{benchmarks.bist100 && marketMode !== 'ABD' && <Line isAnimationActive={false} type="monotone" dataKey="dBist100" name="BİST 100" stroke={COLORS.bist100} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />}`;

const oldAltin2 = `{benchmarks.altin && <Line isAnimationActive={false} type="monotone" dataKey="dAltin" name="Altın" stroke={COLORS.altin} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />}`;
const newAltin2 = `{benchmarks.altin && marketMode !== 'ABD' && <Line isAnimationActive={false} type="monotone" dataKey="dAltin" name="Altın" stroke={COLORS.altin} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />}`;

content = content.replace(oldBist1, newBist1);
content = content.replace(oldNasdaq1, newNasdaq1);
content = content.replace(oldSp5001, newSp5001);
content = content.replace(oldAltin1, newAltin1);

content = content.replace(oldBist2, newBist2);
content = content.replace(oldAltin2, newAltin2);

// Now the benchmark checkboxes container
const oldCheckboxes = `            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={benchmarks.bist100} onChange={() => toggleBenchmark('bist100')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">BİST 100 Kıyasla</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={benchmarks.altin} onChange={() => toggleBenchmark('altin')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Altın Kıyasla</span>
              </label>
            </div>`;

const newCheckboxes = `            <div className="flex gap-4">
              {marketMode !== 'ABD' ? (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={benchmarks.bist100} onChange={() => toggleBenchmark('bist100')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">BİST 100 Kıyasla</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={benchmarks.altin} onChange={() => toggleBenchmark('altin')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Altın Kıyasla</span>
                  </label>
                </>
              ) : (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={benchmarks.nasdaq} onChange={() => toggleBenchmark('nasdaq')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">NASDAQ Kıyasla</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={benchmarks.sp500} onChange={() => toggleBenchmark('sp500')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">S&P 500 Kıyasla</span>
                  </label>
                </>
              )}
            </div>`;

content = content.replace(oldCheckboxes, newCheckboxes);

fs.writeFileSync('src/components/AnalyticsDashboard.jsx', content);
console.log('Updated AnalyticsDashboard UI part 2');
