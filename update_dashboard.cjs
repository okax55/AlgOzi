const fs = require('fs');
let content = fs.readFileSync('src/components/MomentumSwingTradeDashboard.jsx', 'utf8');

// 1. Change hardcoded Piyasa Kapalı text to use lastUpdate
content = content.replace(
  /<span className="text-base font-bold">Piyasa Kapalı \(Tarama Beklemede\)<\/span>/g,
  '<span className="text-base font-bold">{lastUpdate}</span>'
);

// 2. Always show past trades
content = content.replace(
  /\{pastTrades && pastTrades\.length > 0 && \(/,
  '{true && ('
);

// 3. Render empty state if pastTrades is empty
const tbodyOld = `<tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pastTrades.slice(0, 15).map((trade, i) => (`;

const tbodyNew = `<tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pastTrades && pastTrades.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      Henüz geçmiş işlem bulunmamaktadır.
                    </td>
                  </tr>
                )}
                {pastTrades && pastTrades.slice(0, 15).map((trade, i) => (`;

content = content.replace(tbodyOld, tbodyNew);

fs.writeFileSync('src/components/MomentumSwingTradeDashboard.jsx', content);
console.log('Successfully updated MomentumSwingTradeDashboard.jsx');
