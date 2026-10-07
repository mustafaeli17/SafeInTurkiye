// Official operator discovery checked 2026-10-07. No inferred timetables or fares.
export const additionalTransitCities = {
  'Muğla': {card:'MuğlaKart',url:'https://www.mugla.bel.tr/birim/ulasim-dairesi-baskanligi',operator:'MUTTAŞ',modes:['bus']},
  'Aydın': {card:'Aykart',url:'https://www.aykart.com.tr/sefer-saatleri/',operator:'AYULAŞ',modes:['bus']},
  'Denizli': {card:'Denizli Kart',url:'https://ulasim.denizli.bel.tr/',operator:'Denizli Ulaşım',modes:['bus']},
  'Trabzon': {card:'',url:'https://ulasim.trabzon.bel.tr/',operator:'TULAŞ',modes:['bus']},
  'Konya': {card:'',url:'https://atus.konya.bel.tr/',operator:'Konya Büyükşehir Belediyesi',modes:['bus','tram']},
  'Bursa': {card:'BursaKart',url:'https://www.burulas.com.tr/',operator:'BURULAŞ',modes:['bus','metro','tram']},
  'Cappadocia': {card:'',url:'https://belsis.nevsehir.bel.tr/otobus/',operator:'Nevşehir Belediyesi',modes:['bus']},
} as const
