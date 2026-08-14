const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const bistOld = `          // Momentum Vur-Kaç hedefleri: %8 Kâr, %3 Zarar Kes
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

const bistNew = `          // Momentum Sıkı İzleyen Stop: Sınırsız Kâr (Kârı Koru), %3 Başlangıç Stopu
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
          }`;

content = content.replace(bistOld, bistNew);

const usOld = `          // Momentum Vur-Kaç hedefleri: %8 Kâr, %3 Zarar Kes
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

const usNew = `          // Momentum Sıkı İzleyen Stop: Sınırsız Kâr (Kârı Koru), %3 Başlangıç Stopu
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
          }`;

content = content.replace(usOld, usNew);

fs.writeFileSync('src/App.jsx', content);
console.log('Successfully updated App.jsx');
