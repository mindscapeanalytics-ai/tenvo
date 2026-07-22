'use client';

import dynamic from 'next/dynamic';

function VerticalSectionsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-48 rounded-2xl bg-gray-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="h-56 rounded-2xl bg-gray-100" />
    </div>
  );
}

const dynamicSection = (loader) =>
  dynamic(loader, { loading: () => <VerticalSectionsSkeleton /> });

const DealershipHomeSections = dynamicSection(() =>
  import('./dealership/DealershipHomeSections').then((m) => ({ default: m.DealershipHomeSections }))
);
const MarketplaceHomeSections = dynamicSection(() =>
  import('./marketplace/MarketplaceHomeSections').then((m) => ({ default: m.MarketplaceHomeSections }))
);
const AutoPartsHomeSections = dynamicSection(() =>
  import('./autoparts/AutoPartsHomeSections').then((m) => ({ default: m.AutoPartsHomeSections }))
);
const MarineHomeSections = dynamicSection(() =>
  import('./marine/MarineHomeSections').then((m) => ({ default: m.MarineHomeSections }))
);
const PharmacyHomeSections = dynamicSection(() =>
  import('./pharmacy/PharmacyHomeSections').then((m) => ({ default: m.PharmacyHomeSections }))
);
const FurnitureHomeSections = dynamicSection(() =>
  import('./furniture/FurnitureHomeSections').then((m) => ({ default: m.FurnitureHomeSections }))
);
const TilesHomeSections = dynamicSection(() =>
  import('./tiles/TilesHomeSections').then((m) => ({ default: m.TilesHomeSections }))
);
const TyreHomeSections = dynamicSection(() =>
  import('./tyre/TyreHomeSections').then((m) => ({ default: m.TyreHomeSections }))
);
const ElectronicsHomeSections = dynamicSection(() =>
  import('./electronics/ElectronicsHomeSections').then((m) => ({ default: m.ElectronicsHomeSections }))
);
const RestaurantHomeSections = dynamicSection(() =>
  import('./restaurant/RestaurantHomeSections').then((m) => ({ default: m.RestaurantHomeSections }))
);
const FitnessHomeSections = dynamicSection(() =>
  import('./fitness/FitnessHomeSections').then((m) => ({ default: m.FitnessHomeSections }))
);
const FashionHomeSections = dynamicSection(() =>
  import('./fashion/FashionHomeSections').then((m) => ({ default: m.FashionHomeSections }))
);

/**
 * Code-split elevated vertical homepage sections (only the active vertical chunk loads).
 */
export function LazyVerticalHomeSections({ variant, ...props }) {
  switch (variant) {
    case 'dealership':
      return <DealershipHomeSections {...props} />;
    case 'marketplace':
      return <MarketplaceHomeSections {...props} />;
    case 'auto-parts':
      return <AutoPartsHomeSections {...props} />;
    case 'marine-parts':
      return <MarineHomeSections {...props} />;
    case 'pharmacy':
      return <PharmacyHomeSections {...props} />;
    case 'furniture':
      return <FurnitureHomeSections {...props} />;
    case 'tiles':
      return <TilesHomeSections {...props} />;
    case 'tyre':
      return <TyreHomeSections {...props} />;
    case 'electronics':
      return <ElectronicsHomeSections {...props} />;
    case 'restaurant':
      return <RestaurantHomeSections {...props} />;
    case 'fitness':
      return <FitnessHomeSections {...props} />;
    case 'fashion':
      return <FashionHomeSections {...props} />;
    default:
      return null;
  }
}
