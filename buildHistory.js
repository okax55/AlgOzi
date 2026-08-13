import fs from 'fs';

const BIST100 = ['THYAO', 'TUPRS', 'FROTO', 'SISE', 'KCHOL', 'SAHOL', 'AKBNK', 'ISCTR', 'YKBNK', 'GARAN'];
const GROWTH = ['ASTOR', 'CWENE', 'ALFAS', 'SMRTG', 'GESAN', 'MIATK', 'YEOTK', 'KONT', 'EUPWR'];

const generateRandomStocks = (pool, count, expectedRet, vol) => {
    const selected = [];
    const poolCopy = [...pool].sort(() => 0.5 - Math.random());
    for(let i=0; i<count; i++) {
        const ret = Number((expectedRet + (Math.random() * vol * 2 - vol)).toFixed(2));
        selected.push({ ticker: poolCopy[i % poolCopy.length], weight: 100 / count, return: ret });
    }
    return selected;
};

const indicesData = JSON.parse(fs.readFileSync('src/data/historicalIndices.json', 'utf-8'));
const dailyData = JSON.parse(fs.readFileSync('src/data/historicalIndicesDaily.json', 'utf-8'));

const monthsStr = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const getYearMonth = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getYearMonthDay = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${monthsStr[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDay = (dateString) => {
    const d = new Date(dateString);
    return `${d.getDate()} ${monthsStr[d.getMonth()]}`;
};

const buildMap = (arr) => {
    const map = {};
    arr.forEach(item => { map[getYearMonth(item.date)] = item.close; });
    return map;
};

const buildDailyMap = (arr) => {
    const map = {};
    if (!arr) return map;
    arr.forEach(item => { map[getYearMonthDay(item.date)] = item.close; });
    return map;
};

const bistMap = buildMap(indicesData.bist100);
const nasdaqMap = buildMap(indicesData.nasdaq);
const sp500Map = buildMap(indicesData.sp500);
const altinMap = buildMap(indicesData.altin);

const calcRet = (curr, prev) => {
    if (!curr || !prev) return 0;
    return Number((((curr - prev) / prev) * 100).toFixed(2));
};

const MOCK_DAILY_HISTORY = [];
let prevBistD = null, prevAltinD = null, prevNasdaqD = null, prevSp500D = null;

const bistDMap = buildDailyMap(dailyData.bist100);
const altinDMap = buildDailyMap(dailyData.altin);
const nasdaqDMap = buildDailyMap(dailyData.nasdaq);
const sp500DMap = buildDailyMap(dailyData.sp500);

// Generate Daily History First
if(dailyData.bist100) {
    dailyData.bist100.forEach((bistD, i) => {
        const ymd = getYearMonthDay(bistD.date);
        const day = formatDay(bistD.date);
        
        const currBist = bistDMap[ymd];
        const currAltin = altinDMap[ymd];
        const currNasdaq = nasdaqDMap[ymd];
        const currSp500 = sp500DMap[ymd];
        
        const retBist = calcRet(currBist, prevBistD);
        const retAltin = calcRet(currAltin, prevAltinD);
        const retNasdaq = calcRet(currNasdaq, prevNasdaqD);
        const retSp500 = calcRet(currSp500, prevSp500D);

        if (currBist) prevBistD = currBist;
        if (currAltin) prevAltinD = currAltin;
        if (currNasdaq) prevNasdaqD = currNasdaq;
        if (currSp500) prevSp500D = currSp500;

        if (i === 0) return;

        const dateObj = new Date(bistD.date);
        const isAug2026OrLater = dateObj.getFullYear() > 2026 || (dateObj.getFullYear() === 2026 && dateObj.getMonth() >= 7);
        
        MOCK_DAILY_HISTORY.push({
            dateISO: ymd,
            day: day,
            monthStr: formatDate(bistD.date),
            bist100: retBist,
            nasdaq: retNasdaq,
            sp500: retSp500,
            altin: retAltin,
            alfa: isAug2026OrLater ? Number((retBist * 1.5 + (Math.random() * 1.5 - 0.75)).toFixed(2)) : null,
            beta: isAug2026OrLater ? Number((retBist * 1.2 + (Math.random() * 1.0 - 0.5)).toFixed(2)) : null,
            katilim: isAug2026OrLater ? Number((retBist * 0.9 + (Math.random() * 0.6 - 0.3)).toFixed(2)) : null,
            delta: isAug2026OrLater ? Number((retBist * 0.7 + (Math.random() * 0.4 - 0.2)).toFixed(2)) : null
        });
    });
}

// Generate Monthly History by Compounding Daily
const MOCK_MONTHLY_HISTORY = [];
const monthlyGroups = {};

MOCK_DAILY_HISTORY.forEach(day => {
    if (!monthlyGroups[day.monthStr]) {
        monthlyGroups[day.monthStr] = {
            bist100: 0, nasdaq: 0, sp500: 0, altin: 0,
            alfa: day.alfa !== null ? 0 : null,
            beta: day.beta !== null ? 0 : null,
            katilim: day.katilim !== null ? 0 : null,
            delta: day.delta !== null ? 0 : null
        };
    }
    const group = monthlyGroups[day.monthStr];
    const compound = (cum, ret) => {
        if (cum === null && ret === null) return null;
        return (((1 + (cum || 0) / 100) * (1 + (ret || 0) / 100)) - 1) * 100;
    };
    
    group.bist100 = compound(group.bist100, day.bist100);
    group.nasdaq = compound(group.nasdaq, day.nasdaq);
    group.sp500 = compound(group.sp500, day.sp500);
    group.altin = compound(group.altin, day.altin);
    
    if (day.alfa !== null) group.alfa = compound(group.alfa, day.alfa);
    if (day.beta !== null) group.beta = compound(group.beta, day.beta);
    if (day.katilim !== null) group.katilim = compound(group.katilim, day.katilim);
    if (day.delta !== null) group.delta = compound(group.delta, day.delta);
});

Object.keys(monthlyGroups).forEach(monthStr => {
    const group = monthlyGroups[monthStr];
    MOCK_MONTHLY_HISTORY.push({
        month: monthStr,
        bist100: Number(group.bist100.toFixed(2)),
        nasdaq: Number(group.nasdaq.toFixed(2)),
        sp500: Number(group.sp500.toFixed(2)),
        altin: Number(group.altin.toFixed(2)),
        alfa: group.alfa !== null ? Number(group.alfa.toFixed(2)) : null,
        beta: group.beta !== null ? Number(group.beta.toFixed(2)) : null,
        katilim: group.katilim !== null ? Number(group.katilim.toFixed(2)) : null,
        delta: group.delta !== null ? Number(group.delta.toFixed(2)) : null,
        details: {
            alfa: group.alfa !== null ? generateRandomStocks(GROWTH, 5, group.alfa, 8) : [],
            beta: group.beta !== null ? generateRandomStocks(GROWTH, 5, group.beta, 6) : [],
            katilim: group.katilim !== null ? generateRandomStocks(BIST100, 5, group.katilim, 4) : [],
            delta: group.delta !== null ? generateRandomStocks(BIST100, 5, group.delta, 3) : []
        }
    });
});

const content = `// Real historical data for indices, portfolios start from Aug 2026
export const MOCK_MONTHLY_HISTORY = ${JSON.stringify(MOCK_MONTHLY_HISTORY, null, 2)};
export const MOCK_DAILY_HISTORY = ${JSON.stringify(MOCK_DAILY_HISTORY, null, 2)};
`;

fs.writeFileSync('src/data/mockHistory.js', content);
console.log('Successfully built mockHistory.js from real indices data.');
