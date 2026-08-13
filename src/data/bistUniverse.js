export const BIST100 = [
  'AEFES', 'AGHOL', 'AHGAZ', 'AKBNK', 'AKCNS', 'AKFGY', 'AKSA', 'AKSEN', 'ALARK', 'ALBRK', 
  'ALFAS', 'ARCLK', 'ASELS', 'ASTOR', 'BIMAS', 'BRISA', 'BRSAN', 'BUCIM', 'CANTE', 'CCOLA', 
  'CIMSA', 'CWENE', 'DOAS', 'DOHOL', 'EGEEN', 'ECILC', 'EKGYO', 'ENJSA', 'ENKAI', 'EREGL', 
  'EUPWR', 'EUREN', 'FROTO', 'GARAN', 'GESAN', 'GUBRF', 'GWIND', 'HALKB', 'HEKTS', 'ISCTR', 
  'ISDMR', 'ISGYO', 'ISMEN', 'IZENR', 'KARSN', 'KCAER', 'KCHOL', 'KLSER', 'KMPUR', 'KONTR', 
  'KONYA', 'KORDS', 'KOZAA', 'KOZAL', 'KRDMD', 'MAVI', 'MGROS', 'MIATK', 'ODAS', 'OTKAR', 
  'OYAKC', 'PENTA', 'PETKM', 'PGSUS', 'PNLSN', 'QUAGR', 'REEDR', 'SAHOL', 'SASA', 'SDTTR', 
  'SISE', 'SKBNK', 'SMRTG', 'SOKM', 'TABGD', 'TAVHL', 'TCELL', 'THYAO', 'TKFEN', 'TOASO', 
  'TSKB', 'TTKOM', 'TTRAK', 'TUKAS', 'TUPRS', 'ULKER', 'VAKBN', 'VESBE', 'YKBNK', 'YYLGD', 'ZOREN'
];

export const KATILIM_TUM = [
  'ALBRK', 'KUVVA', 'BIMAS', 'THYAO', 'ASELS', 'TUPRS', 'FROTO', 'ENJSA', 'HEKTS', 'KONYA', 
  'PGSUS', 'DOAS', 'VESBE', 'TTRAK', 'EGEEN', 'ARCLK', 'BRISA', 'CCOLA', 'CIMSA', 'GWIND', 'ISDMR'
]; // Simplified Katilim list

export const YENI_HALKA_ARZ = [
  'REEDR', 'TABGD', 'MEKAG', 'KLSER', 'ASTOR', 'CVKMD', 'EUPWR', 'SDTTR', 'SOKE', 'ONCSM', 
  'KOPOL', 'CWENE', 'ALFAS', 'MIATK', 'SMRTG', 'IZENR', 'OFSYM', 'TATEN', 'ENERY', 'TARKM'
];

// Combine all for the total universe (Sinyal Tarayıcı)
export const ALL_BIST = [...new Set([...BIST100, ...KATILIM_TUM, ...YENI_HALKA_ARZ])];
