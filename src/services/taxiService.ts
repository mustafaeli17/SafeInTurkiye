export interface TaxiTariff {
  city: string;
  openingFare: number;
  pricePerKm: number;
  minimumFare: number;
  waitingFarePerHour: number;
  effectiveDate: string;
  source: string;
  lastUpdated: string;
  isOfficial: boolean;
}

// UKOME Resmi Tarife Veritabanı
export const officialCityTariffs: Record<string, TaxiTariff> = {
  'İstanbul': {
    city: 'İstanbul',
    openingFare: 71.94,
    pricePerKm: 47.92,
    minimumFare: 230.00,
    waitingFarePerHour: 345.00,
    effectiveDate: '2026-08',
    source: 'İstanbul Büyükşehir Belediyesi UKOME Kararı',
    lastUpdated: '06 Sep 2026',
    isOfficial: true
  },
  'Ankara': {
    city: 'Ankara',
    openingFare: 65.00,
    pricePerKm: 40.00,
    minimumFare: 200.00,
    waitingFarePerHour: 300.00,
    effectiveDate: '2026-08',
    source: 'Ankara Büyükşehir Belediyesi UKOME Kararı',
    lastUpdated: '06 Sep 2026',
    isOfficial: true
  },
  'İzmir': {
    city: 'İzmir',
    openingFare: 60.00,
    pricePerKm: 38.00,
    minimumFare: 190.00,
    waitingFarePerHour: 280.00,
    effectiveDate: '2026-08',
    source: 'İzmir UKOME Kararı',
    lastUpdated: '06 Sep 2026',
    isOfficial: true
  },
  'Antalya': {
    city: 'Antalya',
    openingFare: 55.00,
    pricePerKm: 36.00,
    minimumFare: 180.00,
    waitingFarePerHour: 260.00,
    effectiveDate: '2026-08',
    source: 'Antalya UKOME Kararı',
    lastUpdated: '06 Sep 2026',
    isOfficial: true
  }
};

export const taxiService = {
  getTariff(city: string): TaxiTariff {
    return officialCityTariffs[city] || officialCityTariffs['İstanbul'];
  },

  calculateFare(
    city: string,
    realDistanceKm: number,
    vehicleClass: 'Yellow' | 'Turquoise' | 'Black' = 'Yellow'
  ) {
    const tariff = this.getTariff(city);
    const classMult = vehicleClass === 'Yellow' ? 1.0 : vehicleClass === 'Turquoise' ? 1.15 : 1.70;

    const opening = tariff.openingFare * classMult;
    const perKm = tariff.pricePerKm * classMult;

    // Gerçek KM bazlı resmi tarife hesaplaması (bekleme/trafik olmadan net aralık)
    const baseFare = opening + (realDistanceKm * perKm);
    const minCalculated = Math.max(Math.round(baseFare), Math.round(tariff.minimumFare * classMult));
    // Olası sinyalizasyon beklemesi için %15 aralık payı
    const maxCalculated = Math.max(Math.round(baseFare * 1.15), minCalculated + 40);

    return {
      minFare: minCalculated,
      maxFare: maxCalculated,
      tariff,
      disclaimer: 'Estimated fare. Final taximeter fare may vary depending on actual waiting time at traffic lights and toll fees.'
    };
  }
};