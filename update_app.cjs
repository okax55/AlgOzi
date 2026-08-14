const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add import
content = content.replace(
  /import IpoDashboard from '.\/components\/IpoDashboard';/,
  "import IpoDashboard from './components/IpoDashboard';\nimport MomentumSwingTradeDashboard from './components/MomentumSwingTradeDashboard';"
);

// 2. Tab name
content = content.replace(
  /Swing Trade Sinyalleri<\/button>/g,
  'Momentum Swing Trade</button>'
);

// 3. scanMarket logic (BIST)
const bistOld = `          // Dinamik hedef ve max-stop güncellemesi (Eski işlemlere de yeni kuralı uygulamak için)
          trade.target = (entryP + (atr * 3.5)).toFixed(2);
          const targetP = parseFloat(trade.target);
          
          if (parseFloat(trade.stop) < entryP * (1 - 0.07)) {
              trade.stop = (entryP * (1 - 0.07)).toFixed(2);
          }
          const stopP = parseFloat(trade.stop);
          const profitPct = ((currentP - entryP) / entryP) * 100;
          
          let trailingDistance = atr * 2.0;
          if (profitPct >= 4.0 && profitPct < 7.0) {
              // Breakeven (Kârı koruma)
              if (stopP < entryP) trade.stop = entryP.toFixed(2);
              trailingDistance = atr * 1.5;
          } else if (profitPct >= 7.0) {
              // Kârı kilitleme (Profit Lock)
              trailingDistance = atr * 1.0;
          }
          
          const newTrailingStop = currentP - trailingDistance;
          if (newTrailingStop > parseFloat(trade.stop)) {
              trade.stop = newTrailingStop.toFixed(2);
          }
          
          // Check exits
          if (currentP >= targetP) {
             trade.exitReason = 'Hedef (Kâr Al)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = 'WIN';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString(); // For cooldown
             historyEvents.push(trade);
             updatedActiveTrades.splice(i, 1);
          } else if (currentP <= parseFloat(trade.stop)) {
             trade.exitReason = 'Stop (Zarar Kes)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = 'LOSS';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString(); // For cooldown
             historyEvents.push(trade);
             updatedActiveTrades.splice(i, 1);
          }`;

const bistNew = `          // Momentum Vur-Kaç hedefleri: %8 Kâr, %3 Zarar Kes
          trade.target = (entryP * 1.08).toFixed(2);
          const targetP = parseFloat(trade.target);
          
          if (parseFloat(trade.stop) < entryP * 0.97) {
              trade.stop = (entryP * 0.97).toFixed(2);
          }
          const stopP = parseFloat(trade.stop);
          
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
          
          // Check exits
          if (currentP >= targetP) {
             trade.exitReason = 'Hedef (Kâr Al)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = 'WIN';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString(); // For cooldown
             historyEvents.push(trade);
             updatedActiveTrades.splice(i, 1);
          } else if (currentP <= stopP) {
             trade.exitReason = 'Stop (Zarar Kes)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = 'LOSS';
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
          }`;

content = content.replace(bistOld, bistNew);

// 4. scanUSMarket logic (US)
const usOld = `          // Dinamik hedef ve max-stop güncellemesi (Eski işlemlere de yeni kuralı uygulamak için)
          trade.target = (entryP + (atr * 6)).toFixed(2);
          const targetP = parseFloat(trade.target);

          if (parseFloat(trade.stop) < entryP * (1 - 0.08)) {
              trade.stop = (entryP * (1 - 0.08)).toFixed(2);
          }
          const stopP = parseFloat(trade.stop);
          const profitPct = ((currentP - entryP) / entryP) * 100;
          
          let trailingDistance = atr * 4.0;
          if (profitPct >= 5.0 && profitPct < 10.0) {
              if (stopP < entryP) trade.stop = entryP.toFixed(2);
              trailingDistance = atr * 2.5;
          } else if (profitPct >= 10.0) {
              trailingDistance = atr * 1.5;
          }
          
          const newTrailingStop = currentP - trailingDistance;
          if (newTrailingStop > stopP) {
              trade.stop = newTrailingStop.toFixed(2);
          }
          
          if (currentP >= targetP) {
             trade.exitReason = 'Hedef (Kâr Al)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = 'WIN';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString();
             historyEventsUS.push(trade);
             updatedActiveTrades.splice(i, 1);
          } else if (currentP <= parseFloat(trade.stop)) {
             trade.exitReason = 'Stop (Zarar Kes)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = 'LOSS';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString();
             historyEventsUS.push(trade);
             updatedActiveTrades.splice(i, 1);
          }`;

const usNew = `          // Momentum Vur-Kaç hedefleri: %8 Kâr, %3 Zarar Kes
          trade.target = (entryP * 1.08).toFixed(2);
          const targetP = parseFloat(trade.target);
          
          if (parseFloat(trade.stop) < entryP * 0.97) {
              trade.stop = (entryP * 0.97).toFixed(2);
          }
          const stopP = parseFloat(trade.stop);
          
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
          
          if (currentP >= targetP) {
             trade.exitReason = 'Hedef (Kâr Al)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = 'WIN';
             trade.exitTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
             trade.exitDate = new Date().toISOString();
             historyEventsUS.push(trade);
             updatedActiveTrades.splice(i, 1);
          } else if (currentP <= stopP) {
             trade.exitReason = 'Stop (Zarar Kes)';
             trade.exitPrice = currentP.toFixed(2);
             trade.pnlPercent = (((currentP - parseFloat(trade.entry)) / parseFloat(trade.entry)) * 100).toFixed(2);
             trade.status = 'LOSS';
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
          }`;

content = content.replace(usOld, usNew);

// 5. Replace Component Rendering Block
const startIndex = content.indexOf("{activeTab === 'scanner' && (");
const endIndex = content.indexOf("{activeTab === 'analytics' && (");

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `{activeTab === 'scanner' && (
            <MomentumSwingTradeDashboard
              activeTrades={currentActiveSwingTrades}
              pastTrades={currentPastSwingTrades}
              isScanning={isScanning}
              lastUpdate={lastUpdate}
              marketMode={marketMode}
            />
          )}\n\n          `;
  content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
} else {
  console.log('Failed to find block boundaries.');
  process.exit(1);
}

fs.writeFileSync('src/App.jsx', content);
console.log('Successfully updated App.jsx');
