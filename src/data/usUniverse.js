export const US_ALFA = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'META', 'GOOGL', 'AMZN', 'AVGO', 'AMD', 'NFLX', 'PLTR', 'SNOW', 'CRWD', 'DDOG', 'ZS', 'MDB', 'NET', 'TEAM', 'SHOP', 'UBER']; // Tech & Growth Heavy
export const US_BETA = ['V', 'MA', 'JPM', 'UNH', 'JNJ', 'PG', 'HD', 'CVX', 'ABBV', 'MRK', 'PEP', 'KO', 'COST', 'WMT', 'MCD', 'DIS', 'NKE', 'CRM', 'ADBE', 'CSCO']; // Quality Momentum & Mega Caps
export const US_DELTA = ['PFE', 'BMY', 'AMGN', 'GILD', 'CVS', 'TGT', 'WBA', 'K', 'GIS', 'CPB', 'SJM', 'CAG', 'SO', 'DUK', 'D', 'EXC', 'AEP', 'SRE', 'PEG', 'WEC']; // Defensive (Health, Staples, Utilities)
export const US_KATILIM = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'INTC', 'CSCO', 'ADBE', 'CRM', 'ORCL', 'QCOM', 'TXN', 'AMD', 'IBM', 'NOW', 'INTU', 'AMAT', 'ADI', 'MU']; // Tech & Halal sectors (No Banks/Alcohol/Gambling)

export const US_UNIVERSE_ALL = [...new Set([...US_ALFA, ...US_BETA, ...US_DELTA, ...US_KATILIM, 
  // Add some more liquid S&P 500 stocks for swing trading
  'BA', 'CAT', 'DE', 'HON', 'LMT', 'MMM', 'RTX', 'UNP', 'UPS', 'GE',
  'AXP', 'BAC', 'C', 'GS', 'MS', 'WFC', 'BLK', 'SPGI', 'CME', 'SCHW',
  'ABT', 'TMO', 'DHR', 'MDT', 'SYK', 'ISRG', 'BDX', 'BSX', 'EW', 'ZTS'
])];
