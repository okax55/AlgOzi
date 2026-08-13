const TYPES = [
  'Hisse Senedi Şemsiye Fonu',
  'Değişken Şemsiye Fon',
  'Fon Sepeti Şemsiye Fonu',
  'Karma Şemsiye Fon',
  'Para Piyasası Şemsiye Fonu',
  'Borçlanma Araçları Şemsiye Fonu',
  'Kıymetli Madenler Şemsiye Fonu',
  'Katılım Şemsiye Fonu',
  'Serbest Şemsiye Fon'
];

const NAMES = {
  'Hisse Senedi Şemsiye Fonu': ['HİSSE SENEDİ FONU', 'TEMETTÜ ÖDEYEN HİSSE SENEDİ FONU', 'BİST 100 DIŞI ŞİRKETLER HİSSE SENEDİ FONU', 'BİST 30 HİSSE SENEDİ FONU', 'TEKNOLOJİ HİSSE SENEDİ FONU', 'SAĞLIK SEKTÖRÜ HİSSE SENEDİ FONU'],
  'Değişken Şemsiye Fon': ['BİRİNCİ DEĞİŞKEN FON', 'İKİNCİ DEĞİŞKEN FON', 'DİNAMİK DEĞİŞKEN FON', 'ATAK DEĞİŞKEN FON', 'MUHAFAZAKAR DEĞİŞKEN FON'],
  'Fon Sepeti Şemsiye Fonu': ['SÜRDÜRÜLEBİLİRLİK FON SEPETİ FONU', 'GÜMÜŞ FON SEPETİ FONU', 'ALTIN FON SEPETİ FONU', 'YABANCI HİSSE SENEDİ FON SEPETİ FONU', 'YARI İLETKEN TEKNOLOJİLERİ FON SEPETİ FONU'],
  'Karma Şemsiye Fon': ['BİRİNCİ KARMA FON', 'İKİNCİ KARMA FON'],
  'Para Piyasası Şemsiye Fonu': ['PARA PİYASASI FONU', 'BİRİNCİ PARA PİYASASI FONU', 'KISA VADELİ PARA PİYASASI FONU'],
  'Borçlanma Araçları Şemsiye Fonu': ['BİRİNCİ BORÇLANMA ARAÇLARI FONU', 'UZUN VADELİ BORÇLANMA ARAÇLARI FONU', 'EUROBOND BORÇLANMA ARAÇLARI FONU', 'ÖZEL SEKTÖR BORÇLANMA ARAÇLARI FONU'],
  'Kıymetli Madenler Şemsiye Fonu': ['ALTIN FONU', 'GÜMÜŞ FONU', 'KIYMETLİ MADENLER FONU'],
  'Katılım Şemsiye Fonu': ['KATILIM FONU', 'ALTIN KATILIM FONU', 'HİSSE SENEDİ KATILIM FONU', 'SÜRDÜRÜLEBİLİRLİK KATILIM FONU', 'KİRA SERTİFİKALARI KATILIM FONU'],
  'Serbest Şemsiye Fon': ['BİRİNCİ SERBEST FON', 'HİSSE SENEDİ SERBEST FONU', 'ÇOKLU VARLIK SERBEST FONU', 'YABANCI TEKNOLOJİ SERBEST FON']
};

const PROVIDERS = ['AK PORTFÖY', 'YAPI KREDİ PORTFÖY', 'İŞ PORTFÖY', 'GARANTİ PORTFÖY', 'QNB FİNANS PORTFÖY', 'DENİZ PORTFÖY', 'TEB PORTFÖY', 'ZİRAAT PORTFÖY', 'VAKIF PORTFÖY', 'HALK PORTFÖY', 'İSTANBUL PORTFÖY', 'TACİRLER PORTFÖY', 'MARMARA CAPİTAL PORTFÖY', 'HEDEF PORTFÖY', 'NEO PORTFÖY', 'AZİMUT PORTFÖY', 'KUVEYT TÜRK PORTFÖY', 'ALBARAKA PORTFÖY', 'MÜKAFAT PORTFÖY', 'INFO YATIRIM PORTFÖY'];

function generateRandomFund(index) {
  const type = TYPES[index % TYPES.length];
  const nameSuffix = NAMES[type][Math.floor(Math.random() * NAMES[type].length)];
  const provider = PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)];
  
  // Create a somewhat unique 3-letter ticker
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const ticker = provider.substring(0, 1) + chars.charAt(Math.floor(Math.random() * 26)) + chars.charAt(Math.floor(Math.random() * 26));

  const fullName = `${provider} ${nameSuffix}`;

  // Generate realistic returns based on fund type
  let baseYearly = 0;
  let volatility = 0;
  
  switch(type) {
    case 'Hisse Senedi Şemsiye Fonu': baseYearly = 80; volatility = 40; break;
    case 'Para Piyasası Şemsiye Fonu': baseYearly = 45; volatility = 2; break;
    case 'Borçlanma Araçları Şemsiye Fonu': baseYearly = 55; volatility = 10; break;
    case 'Kıymetli Madenler Şemsiye Fonu': baseYearly = 65; volatility = 20; break;
    case 'Değişken Şemsiye Fon': baseYearly = 70; volatility = 30; break;
    case 'Katılım Şemsiye Fonu': baseYearly = 50; volatility = 15; break;
    default: baseYearly = 60; volatility = 25;
  }

  const yearly = baseYearly + (Math.random() * volatility * 2 - volatility);
  const ytd = yearly * (Math.random() * 0.4 + 0.3); // YTD is roughly 30-70% of yearly
  const monthly = yearly / 12 + (Math.random() * (volatility/4) - (volatility/8));
  const weekly = monthly / 4 + (Math.random() * (volatility/10) - (volatility/20));
  const daily = weekly / 5 + (Math.random() * (volatility/20) - (volatility/40));

  const aum = Math.floor(Math.random() * 9500000000) + 50000000; // 50M to 9.5B TRY
  const price = Math.random() * 10 + 0.1;

  return {
    ticker,
    name: fullName,
    type,
    price,
    aum,
    returns: {
      daily,
      weekly,
      monthly,
      ytd,
      yearly
    }
  };
}

// Generate ~400 funds
const generatedFunds = [];
for (let i = 0; i < 400; i++) {
  generatedFunds.push(generateRandomFund(i));
}

// Also include our core realistic ones at the beginning so they show up consistently in searches
const coreFunds = [
  { ticker: 'MAC', name: 'MARMARA CAPİTAL PORTFÖY HİSSE SENEDİ FONU', type: 'Hisse Senedi Şemsiye Fonu', price: 0.854, aum: 4500000000, returns: { daily: 1.2, weekly: 3.5, monthly: 12.4, ytd: 45.2, yearly: 110.5 } },
  { ticker: 'NNF', name: 'HEDEF PORTFÖY BİRİNCİ HİSSE SENEDİ FONU', type: 'Hisse Senedi Şemsiye Fonu', price: 1.245, aum: 3200000000, returns: { daily: 0.8, weekly: 2.1, monthly: 8.5, ytd: 38.4, yearly: 95.2 } },
  { ticker: 'IPB', name: 'İSTANBUL PORTFÖY BİRİNCİ DEĞİŞKEN FON', type: 'Değişken Şemsiye Fon', price: 0.432, aum: 2100000000, returns: { daily: 0.5, weekly: 1.8, monthly: 6.2, ytd: 25.1, yearly: 85.0 } },
  { ticker: 'YAT', name: 'YAPI KREDİ PORTFÖY KOÇ HOLDİNG İŞTİRAK VE HİSSE SENEDİ FONU', type: 'Hisse Senedi Şemsiye Fonu', price: 2.150, aum: 8500000000, returns: { daily: 1.5, weekly: 4.2, monthly: 15.0, ytd: 55.0, yearly: 130.2 } },
  { ticker: 'TI3', name: 'İŞ PORTFÖY İŞ BANKASI İŞTİRAKLERİ ENDEKSİ HİSSE SENEDİ FONU', type: 'Hisse Senedi Şemsiye Fonu', price: 2.450, aum: 12000000000, returns: { daily: 1.8, weekly: 5.2, monthly: 14.5, ytd: 60.1, yearly: 140.5 } },
  { ticker: 'AFT', name: 'AK PORTFÖY YENİ TEKNOLOJİLER YABANCI HİSSE SENEDİ FONU', type: 'Hisse Senedi Şemsiye Fonu', price: 0.785, aum: 6200000000, returns: { daily: 2.1, weekly: 5.5, monthly: 18.2, ytd: 48.5, yearly: 145.2 } },
  { ticker: 'TCA', name: 'ZİRAAT PORTFÖY ALTIN FONU', type: 'Kıymetli Madenler Şemsiye Fonu', price: 0.280, aum: 9500000000, returns: { daily: 0.6, weekly: 1.4, monthly: 4.8, ytd: 16.0, yearly: 68.2 } },
  { ticker: 'PPZ', name: 'AZİMUT PORTFÖY PARA PİYASASI FONU', type: 'Para Piyasası Şemsiye Fonu', price: 1.050, aum: 12500000000, returns: { daily: 0.12, weekly: 0.85, monthly: 3.8, ytd: 15.0, yearly: 45.2 } }
];

export const TEFAS_FUNDS = [...coreFunds, ...generatedFunds];
