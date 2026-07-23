'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BRAND_PRIMARY } from '@/lib/theme/brandTokens';
import { Textarea } from '@/components/ui/textarea';
import { 
  Store, Globe, Link2, Palette, Truck, CreditCard, 
  Save, ExternalLink, ArrowRight, Upload, Image, RefreshCw,
  CheckCircle2, XCircle, Package, Info, Megaphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  getStorefrontSettings, updateBusinessSettings,
  configureStorefrontDomain, syncInventoryToStorefront
} from '@/lib/actions/storefront/admin';
import { getCategories } from '@/lib/actions/storefront/products';
import { MobileTabHeader } from '@/components/mobile/MobileTabHeader';
import { useStorefrontEmbedded } from '@/lib/context/StorefrontMobileContext';
import { getRegionalStandards } from '@/lib/utils/regionalHelpers';
import { MarketingSectionsEditor } from '@/components/storefront/admin/MarketingSectionsEditor';
import { isAutoMarketplaceStore } from '@/lib/storefront/autoMarketplace';
import { isAutoDealershipStore } from '@/lib/storefront/autoDealership';
import { isAutoPartsStore } from '@/lib/storefront/autoParts';
import { isMarinePartsStore, MARINE_HERO_VIDEO_URL, MARINE_HERO_POSTER } from '@/lib/storefront/marineParts';
import { isRestaurantElevatedStore } from '@/lib/storefront/restaurantStorefront';
import { isPharmacyElevatedStore } from '@/lib/storefront/pharmacyStorefront';
import { isFurnitureElevatedStore } from '@/lib/storefront/furnitureStorefront';
import { isTilesElevatedStore } from '@/lib/storefront/tilesStorefront';
import { isTyreElevatedStore } from '@/lib/storefront/tyreStorefront';
import { isElectronicsElevatedStore } from '@/lib/storefront/electronicsStorefront';
import { isFitnessElevatedStore } from '@/lib/storefront/fitnessStorefront';
import { isSupermarketElevatedStore } from '@/lib/storefront/supermarketStorefront';
import { isFashionEditorialStore } from '@/lib/storefront/fashionEditorial';
import { supportsFashionGulSections } from '@/lib/storefront/fashionGulSections';
import { isJewelleryStore } from '@/lib/storefront/jewelleryStorefront';

import { FashionGulSectionsEditor } from '@/components/storefront/admin/FashionGulSectionsEditor';
import { FashionPromoBannersEditor } from '@/components/storefront/admin/FashionPromoBannersEditor';
import { FashionCatalogEditor } from '@/components/storefront/admin/FashionCatalogEditor';
import { HeroCarouselSlidesEditor } from '@/components/storefront/admin/HeroCarouselSlidesEditor';
import { SupermarketCatalogEditor } from '@/components/storefront/admin/SupermarketCatalogEditor';
import { JewelleryCardsEditor } from '@/components/storefront/admin/JewelleryCardsEditor';
import { getHeroPreset } from '@/lib/storefront/heroPresets';
import { uploadOptimizedImage } from '@/lib/utils/optimizeImageClient';
import { canConfigureTenantMeetingUrl, normalizeTenantMeetingUrl } from '@/lib/storefront/storefrontBooking';
import {
  STOREFRONT_BRAND_MODES,
  STOREFRONT_BRAND_TEXT_STYLES,
  STOREFRONT_BRAND_ICON_KEYS,
  normalizeStorefrontBrandingForForm,
} from '@/lib/storefront/storefrontBrandMark';
import { StorefrontBrandMark } from '@/components/storefront/StorefrontBrandMark';
import { AboutPageSettingsEditor } from '@/components/storefront/admin/AboutPageSettingsEditor';
import { normalizeAboutStorefrontConfig } from '@/lib/storefront/aboutStorefront';
import { supportsStoreConnectionButtons } from '@/lib/storefront/storeConnectionActions';

// ── Image Upload Field ────────────────────────────────────────────────────────
function ImageUploadField({ label, hint, value, onChange, businessId, purpose = 'product' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!businessId) {
      toast.error('Business context is required to upload images');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadOptimizedImage(file, businessId, purpose);
      onChange(url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div
          className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 overflow-hidden shrink-0"
          onClick={() => inputRef.current?.click()}
        >
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <Image className="w-8 h-8 text-gray-300" />
          )}
        </div>
        <div className="space-y-2 flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={() => onChange('')}
            >
              Remove
            </Button>
          )}
          <p className="text-xs text-gray-400">{hint}</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export function StoreSettingsManager({ business, category }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadedPlanTier, setLoadedPlanTier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [domainSaving, setDomainSaving] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [fashionCategories, setFashionCategories] = useState([]);

  const [settings, setSettings] = useState({
    enabled: true,
    theme: 'default',
    currency: 'PKR',
    enableCOD: true,
    enableCard: true,
    freeShippingThreshold: 2000,
    returnPolicyDays: 7,
    heroTitle: '',
    heroSubtitle: '',
    heroSlides: [],
    announcement: '',
    showTopBar: true,
    showTopBarPhone: false,
    showTopBarCity: true,
    pageSections: [],
    brand: { primaryColor: '' },
    branding: {
      mode: 'text',
      textStyle: 'classic',
      iconKey: 'initial',
      iconUrl: '',
    },
    connection: {
      enabled: true,
      showQuote: true,
      showCall: true,
      showMail: true,
      preferWhatsApp: false,
      quoteLabel: '',
      callLabel: '',
      mailLabel: '',
    },
    about: {
      enabled: true,
      showInFooter: true,
      showInNav: false,
      headline: '',
      story: '',
      mission: '',
      values: [],
      foundedYear: '',
      headquarters: '',
      registrationId: '',
      ownerName: '',
      ownerTitle: 'Founder',
      ownerPhotoUrl: '',
      ownerBio: '',
      team: [],
      heroImageUrl: '',
      ctaLabel: '',
    },
    socialLinks: { facebook: '', instagram: '', twitter: '', youtube: '' },
    logoUrl: '',
    coverImageUrl: '',
    description: '',
    publicEmail: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    businessHours: '',
    website: '',
    storeDomain: null,
    storeUrl: null,
    products: { total: 0, active: 0 },
    setupStatus: null,
    ownerLoginEmail: '',
    marketplace: {
      heroPromo: { eyebrow: '', title: '', subtitle: '', ctaLabel: '', ctaHref: '', image: '' },
      coeTicker: { label: '', value: '', change: '', href: '' },
      showForum: false,
      showArticles: false,
      showEShop: true,
      showMarketingBanners: true,
      showTrustStrip: true,
    },
    dealership: {
      profile: 'tenvo-vehicles',
      tagline: '',
      welcomeTitle: '',
      uan: '',
      videoUrl: '',
      showTrustStrip: true,
      showMarketingBanners: true,
      trustStrip: { hours: '', shippingLabel: '', ratingLabel: '' },
    },
    autoParts: {
      showPromoCards: true,
      showFeaturedCategories: true,
      showFeaturedDeals: true,
      showVehicleBrands: true,
      showTrending: true,
      showTrustSection: true,
      showCategoryRails: true,
      showMarketingBanners: true,
      trustTitle: '',
      trustSubtitle: '',
      ctaTitle: '',
      ctaSubtitle: '',
      ctaLabel: '',
    },
    marine: {
      showFinder: true,
      showKpis: true,
      showSectorOverview: true,
      showExpertise: true,
      showEquipmentGrid: true,
      showStayAhead: true,
      showInsights: true,
      showFeaturedRails: true,
      showSpareRail: true,
      showBottomCta: true,
      showMarketingBanners: true,
      showBrandChips: true,
      sectorLayout: 'skewed',
      sectorEyebrow: '',
      sectorTitle: '',
      sectorCards: [
        {
          id: 'propulsion',
          icon: 'ship',
          title: 'Propulsion systems',
          body: '',
          ctaLabel: 'Explore systems',
          href: '/products?category=new-systems',
          image: '',
        },
        {
          id: 'lifecycle',
          icon: 'wrench',
          title: 'Parts & lifecycle service',
          body: '',
          ctaLabel: 'Browse parts & service',
          href: '/products?category=spare-parts',
          image: '',
        },
      ],
      heroVideoUrl: MARINE_HERO_VIDEO_URL,
      heroPosterUrl: MARINE_HERO_POSTER,
      heroEyebrow: '',
      heroTitle: '',
      heroSubtitle: '',
      heroCtaLabel: '',
      kpiTitle: '',
      kpiSubtitle: '',
      expertiseTitle: '',
      expertiseSubtitle: '',
      equipmentTitle: '',
      equipmentSubtitle: '',
      stayAheadTitle: '',
      stayAheadSubtitle: '',
      stayAheadCtaLabel: '',
      stayAheadImageUrl: '',
      ctaImageUrl: '',
      featuredRailTitle: '',
      spareRailTitle: '',
      insightsTitle: '',
      insightsSubtitle: '',
      trustTitle: '',
      trustSubtitle: '',
      trustStats: [
        { value: '45+', label: 'Years of propulsion expertise' },
        { value: '10', label: 'Core equipment families' },
        { value: '24/7', label: 'RFQ and parts enquiry desk' },
        { value: 'NL', label: 'European maritime logistics hub' },
      ],
      quickLinks: [
        { id: 'new', label: 'New systems', href: '/products?systemCondition=new' },
        { id: 'used', label: 'Used systems', href: '/products?systemCondition=used' },
        { id: 'spare', label: 'Spare parts', href: '/products?category=spare-parts' },
        { id: 'rfq', label: 'RFQ', href: '/contact?subject=quotation' },
      ],
      brandChips: [
        { id: 'schottel', label: 'Schottel', href: '/products?search=Schottel' },
        { id: 'wartsila', label: 'Wärtsilä', href: '/products?search=Wartsila' },
        { id: 'veth', label: 'Veth', href: '/products?search=Veth' },
        { id: 'zf', label: 'ZF', href: '/products?search=ZF' },
        { id: 'kawasaki', label: 'Kawasaki', href: '/products?search=Kawasaki' },
      ],
      ctaTitle: '',
      ctaSubtitle: '',
      ctaLabel: '',
    },
    restaurant: {
      showCuisineCarousel: true,
      showSuperPicks: true,
      showOrderModes: true,
      showRewardsCta: false,
      showDeliveryInfo: true,
      showMarketingBanners: true,
      locationLabel: 'Deliver to',
      defaultLocation: '',
      searchPlaceholder: '',
      cateringLabel: 'Catering',
      featuredRailTitle: '',
      featuredRailSubtitle: '',
    },
    pharmacy: {
      showRefillPromo: true,
      showBrandsRow: true,
      showSeoBlock: false,
      showMarketingBanners: true,
      locationLabel: 'Deliver to',
      defaultLocation: '',
      searchPlaceholder: '',
      featuredRailTitle: '',
      featuredRailSubtitle: '',
    },
    furniture: {
      showRoomTiles: true,
      showTrustStrip: true,
      showLifestyleSpotlight: true,
      showBrandStories: true,
      showTestimonials: false,
      showShowroomCta: true,
      showMarketingBanners: true,
      locationLabel: 'Deliver to',
      defaultLocation: '',
      searchPlaceholder: '',
      showroomLabel: 'Visit showroom',
      featuredRailTitle: '',
      featuredRailSubtitle: '',
      roomEssentialsTitle: '',
      roomEssentialsSubtitle: '',
      heroVideoUrl: '',
      showroomVideoUrl: '',
      showroomBannerImage: '',
      showroomEyebrow: '',
      showroomTitle: '',
      showroomSubtitle: '',
      brandStory1Eyebrow: '',
      brandStory1Title: '',
      brandStory1Subtitle: '',
      brandStory1Image: '',
      brandStory1Cta: '',
      brandStory1Href: '',
      brandStory2Eyebrow: '',
      brandStory2Title: '',
      brandStory2Subtitle: '',
      brandStory2Image: '',
      brandStory2Cta: '',
      brandStory2Href: '',
    },
    tiles: {
      showRoomTiles: true,
      showTestimonials: false,
      showShowroomCta: true,
      showMarketingBanners: true,
      locationLabel: 'Deliver to',
      defaultLocation: '',
      searchPlaceholder: '',
      showroomLabel: 'Visit emporium',
      featuredRailTitle: '',
      featuredRailSubtitle: '',
    },
    tyre: {
      showTrustStrip: true,
      showExploreSection: true,
      showVehicleTiles: true,
      showBrandWall: true,
      showAlloyRail: true,
      showServices: true,
      showBayCta: true,
      showLifestyleSpotlight: true,
      showBrandStories: true,
      showOemPartners: true,
      showSafetyBand: true,
      showCareTips: true,
      showPromoMosaic: false,
      showTestimonials: false,
      showMarketingBanners: true,
      locationLabel: 'Deliver to',
      defaultLocation: '',
      searchPlaceholder: '',
      bayLabel: 'Book fitting bay',
      featuredRailTitle: '',
      featuredRailSubtitle: '',
      exploreTitle: '',
      exploreSubtitle: '',
      exploreBackgroundImage: '',
      heroVideoUrl: '',
      bayCtaTitle: '',
      bayCtaSubtitle: '',
      brandStory1Eyebrow: '',
      brandStory1Title: '',
      brandStory1Subtitle: '',
      brandStory1Image: '',
      brandStory1Cta: '',
      brandStory1Href: '',
      brandStory2Eyebrow: '',
      brandStory2Title: '',
      brandStory2Subtitle: '',
      brandStory2Image: '',
      brandStory2Cta: '',
      brandStory2Href: '',
    },
    electronics: {
      showTrustStrip: true,
      showCategoryTiles: true,
      showBrandWall: true,
      showFeaturedRail: true,
      showDealsRail: true,
      showGadgetsRail: true,
      showAppliancesRail: true,
      showInstallmentCta: true,
      showVisitCta: true,
      showFeedSidebar: true,
      locationLabel: 'Deliver to',
      defaultLocation: '',
      searchPlaceholder: '',
      installmentLabel: 'Installment enquiry',
      featuredRailTitle: '',
      featuredRailSubtitle: '',
      dealsRailTitle: '',
      gadgetsRailTitle: '',
      appliancesRailTitle: '',
      installmentTitle: '',
      installmentSubtitle: '',
      visitTitle: '',
      visitSubtitle: '',
    },
    fitness: {
      showPrograms: true,
      showMemberships: true,
      showBenefits: true,
      showTrainers: false,
      showBookingStrip: true,
      showPromoBanners: true,
      showMarketingBanners: true,
      showTrustPillars: false,
      heroTitle: '',
      heroSubtitle: '',
      searchPlaceholder: '',
      supplementRailTitle: '',
      featuredRailTitle: '',
      featuredRailSubtitle: '',
      membershipSectionTitle: '',
      membershipSectionSubtitle: '',
    },
    supermarket: {
      showAisleCarousel: true,
      showFreshRail: true,
      showDealsRail: true,
      showTopSellersRail: true,
      showBrandsRow: true,
      showTrustStrip: true,
      showPromoBanners: true,
      showMarketingBanners: true,
      showDeliveryBanner: true,
      showWeeklyEssentials: false,
      locationLabel: 'Deliver to',
      defaultLocation: '',
      searchPlaceholder: '',
      featuredRailTitle: '',
      dealsRailTitle: '',
      freshRailTitle: '',
    },
    booking: {
      meetingUrl: '',
    },
    fashion: {
      animations: true,
      showHeroRating: true,
      showTopCollections: true,
      showTopPicks: true,
      showEditorialSpotlight: true,
      showUnstitched: true,
      showReadyToWear: true,
      showAccessories: true,
      showOffers: true,
      showNewArrivals: true,
      showTrustStrip: true,
      showMarketingBanners: true,
      showBrandsRow: true,
      showPromoBanners: true,
      showSeoBlock: true,
      showHomeEdit: true,
      showSaleMosaic: true,
      searchPlaceholder: '',
      featuredRailTitle: '',
      featuredRailSubtitle: '',
      unstitchedTitle: '',
      readyToWearTitle: '',
      accessoriesTitle: '',
      offersTitle: '',
      newArrivalsTitle: '',
    },
    jewellery: {
      animations: true,
      showHeroRating: true,
      showCertificationBadges: true,
      showCollections: true,
      showSignaturePieces: true,
      showJewelleryEdit: true,
      showCategories: true,
      showNewArrivals: true,
      showOffers: true,
      showTrustStrip: true,
      showMarketingBanners: true,
      showBrandsRow: true,
      showSeoBlock: false,
      showProductsCarousel: true,
      carouselScrollSpeed: 30,
      searchPlaceholder: '',
      signaturePiecesTitle: '',
      signaturePiecesSubtitle: '',
      jewelleryEditTitle: '',
      jewelleryEditSubtitle: '',
      categoriesTitle: '',
      offersTitle: '',
      newArrivalsTitle: '',
      productsCarouselTitle: '',
      productsCarouselSubtitle: '',
      brandsLabel: '',
      footerEyebrow: '',
      collectionCtaLabel: '',
      consultationCtaLabel: '',
      secondaryCtaLabel: '',
      secondaryCtaHref: '',
      heroTiles: [],
      jewelleryEdit: { tiles: [] },
    },
  });

  const marketplaceStore = isAutoMarketplaceStore(category || business?.category);
  const dealershipStore = isAutoDealershipStore(category || business?.category);
  const autoPartsStore = isAutoPartsStore(category || business?.category);
  const marineStore = isMarinePartsStore(category || business?.category);
  const connectionStore = supportsStoreConnectionButtons(category || business?.category);
  const restaurantStore = isRestaurantElevatedStore(category || business?.category);
  const pharmacyStore = isPharmacyElevatedStore(category || business?.category);
  const furnitureStore = isFurnitureElevatedStore(category || business?.category);
  const tilesStore = isTilesElevatedStore(category || business?.category);
  const tyreStore = isTyreElevatedStore(category || business?.category);
  const electronicsStore = isElectronicsElevatedStore(category || business?.category);
  const fitnessStore = isFitnessElevatedStore(category || business?.category);
  const supermarketStore = isSupermarketElevatedStore(category || business?.category);
  const jewelleryStore = isJewelleryStore(category || business?.category);
  const fashionStore = supportsFashionGulSections(category || business?.category) && !jewelleryStore;
  const heroPreviewPreset = useMemo(() => {
    const domain = settings.storeDomain || business?.domain || 'preview';
    return getHeroPreset(
      category || business?.category,
      domain,
      settings,
      {
        business_name: business?.business_name,
        cover_image_url: settings.coverImageUrl || business?.cover_image_url,
        description: settings.description || business?.description,
        country: settings.country || business?.country,
      }
    );
  }, [
    settings,
    settings.storeDomain,
    settings.coverImageUrl,
    settings.description,
    settings.country,
    business?.domain,
    business?.business_name,
    business?.cover_image_url,
    business?.description,
    business?.country,
    category,
    business?.category,
  ]);
  const genericHeroCopyApplies = heroPreviewPreset?.type === 'commerce-carousel';
  const defaultHeroSlides = useMemo(
    () => (Array.isArray(heroPreviewPreset?.slides) ? heroPreviewPreset.slides : []),
    [heroPreviewPreset]
  );
  const heroMinSlides = Math.min(4, Math.max(1, defaultHeroSlides.length || 4));
  const heroMaxSlides = Math.max(heroMinSlides, defaultHeroSlides.length || 6, 6);
  const businessForBookingGate = useMemo(
    () => ({
      ...business,
      plan_tier: loadedPlanTier || business?.plan_tier || business?.planTier || 'free',
      settings: business?.settings,
    }),
    [business, loadedPlanTier]
  );
  const showMeetingUrlField = canConfigureTenantMeetingUrl(
    businessForBookingGate,
    category || business?.category
  );

  const settingsHydratedRef = useRef(false);

  useEffect(() => {
    settingsHydratedRef.current = false;
    void loadSettings();
  }, [business?.id]);

  const loadSettings = async () => {
    if (!business?.id) return;
    // Soft revalidate: only show blocking skeleton on first load for this tenant.
    if (!settingsHydratedRef.current) setLoading(true);
    try {
      const result = await getStorefrontSettings(business.id);
      if (result.success && result.data) {
        setSettings((prev) => ({
          ...prev,
          ...result.data,
          branding: normalizeStorefrontBrandingForForm(result.data.branding || prev.branding),
          about: normalizeAboutStorefrontConfig(result.data.about || prev.about, {
            category: category || business?.category,
          }),
        }));
        setNewDomain(result.data.storeDomain || '');
        setLoadedPlanTier(result.data.planTier || null);
        settingsHydratedRef.current = true;
      }
      if (
        (supportsFashionGulSections(category || business?.category) && !isJewelleryStore(category || business?.category))
        || isJewelleryStore(category || business?.category)
      ) {
        const categoryResult = await getCategories(business.id);
        if (categoryResult?.success) {
          setFashionCategories(categoryResult.categories || []);
        }
      }
    } catch (err) {
      console.error('Failed to load store settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));
  const setMarketplace = (section, key, val) =>
    setSettings((prev) => ({
      ...prev,
      marketplace: {
        ...prev.marketplace,
        [section]: { ...(prev.marketplace?.[section] || {}), [key]: val },
      },
    }));
  const setMarketplaceFlag = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      marketplace: { ...prev.marketplace, [key]: val },
    }));
  const setDealership = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      dealership: { ...prev.dealership, [key]: val },
    }));
  const setDealershipTrust = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      dealership: {
        ...prev.dealership,
        trustStrip: { ...(prev.dealership?.trustStrip || {}), [key]: val },
      },
    }));
  const setAutoParts = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      autoParts: { ...(prev.autoParts || {}), [key]: val },
    }));
  const setMarine = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      marine: { ...(prev.marine || {}), [key]: val },
    }));
  const setRestaurant = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      restaurant: { ...(prev.restaurant || {}), [key]: val },
    }));
  const setPharmacy = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      pharmacy: { ...(prev.pharmacy || {}), [key]: val },
    }));
  const setFurniture = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      furniture: { ...(prev.furniture || {}), [key]: val },
    }));
  const setTiles = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      tiles: { ...(prev.tiles || {}), [key]: val },
    }));
  const setTyre = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      tyre: { ...(prev.tyre || {}), [key]: val },
    }));
  const setElectronics = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      electronics: { ...(prev.electronics || {}), [key]: val },
    }));
  const setFitness = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      fitness: { ...(prev.fitness || {}), [key]: val },
    }));
  const setSupermarket = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      supermarket: { ...(prev.supermarket || {}), [key]: val },
    }));
  const setBooking = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      booking: { ...(prev.booking || {}), [key]: val },
    }));
  const setFashion = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      fashion: { ...(prev.fashion || {}), [key]: val },
    }));
  const setJewellery = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      jewellery: { ...(prev.jewellery || {}), [key]: val },
    }));
  const setSocialLink = (key, val) => setSettings(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: val } }));
  const setBrand = (key, val) => setSettings(prev => ({ ...prev, brand: { ...prev.brand, [key]: val } }));
  const setBranding = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      branding: normalizeStorefrontBrandingForForm({ ...(prev.branding || {}), [key]: val }),
    }));
  const setConnection = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      connection: { ...(prev.connection || {}), [key]: val },
    }));

  const handleSave = async () => {
    if (!business?.id) return;
    const rawMeetingUrl = settings.booking?.meetingUrl?.trim();
    if (showMeetingUrlField && rawMeetingUrl && !normalizeTenantMeetingUrl(rawMeetingUrl)) {
      toast.error('Scheduling URL must start with http:// or https://');
      return;
    }
    setSaving(true);
    try {
      const result = await updateBusinessSettings(business.id, settings);
      if (result.success) {
        toast.success('Store settings saved');
        loadSettings();
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDomain = async () => {
    if (!business?.id || !newDomain.trim()) return;
    const slug = newDomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setDomainSaving(true);
    try {
      const result = await configureStorefrontDomain(business.id, slug);
      if (result.success) {
        toast.success(`Store URL set to /store/${slug}`);
        loadSettings();
      } else {
        toast.error(result.error || 'Failed to set domain');
      }
    } catch {
      toast.error('Failed to set domain');
    } finally {
      setDomainSaving(false);
    }
  };

  const handleSyncInventory = async () => {
    if (!business?.id) return;
    setSyncing(true);
    try {
      const result = await syncInventoryToStorefront(business.id);
      if (result.success) {
        toast.success(`Synced ${result.synced || 0} products to store`);
        loadSettings();
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const storeUrl = settings.storeUrl;
  const fullStoreUrl = storeUrl && typeof window !== 'undefined'
    ? `${window.location.origin}${storeUrl}`
    : storeUrl || null;
  const regional = getRegionalStandards(settings.country || business?.country);
  const phonePlaceholder = `${regional.phoneCode} …`;
  const setup = settings.setupStatus;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-gray-400" />
      </div>
    );
  }

  const embeddedInStorefront = useStorefrontEmbedded();

  return (
    <div className="space-y-2 lg:space-y-5">
      {!embeddedInStorefront && (
        <MobileTabHeader
          icon={Store}
          iconClassName="bg-emerald-100 text-emerald-600"
          title="Online Store"
          subtitle={settings.enabled ? 'Store is live' : 'Store is offline'}
          primaryAction={{
            label: saving ? 'Saving…' : 'Save',
            icon: Save,
            className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            onClick: handleSave,
          }}
          actions={
            fullStoreUrl
              ? [{ id: 'view', label: 'View', icon: ExternalLink, onClick: () => window.open(storeUrl, '_blank', 'noopener,noreferrer') }]
              : []
          }
        />
      )}

      {embeddedInStorefront && (
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
            settings.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          )}>
            {settings.enabled ? 'Live' : 'Offline'}
          </span>
          <div className="flex gap-1">
            {fullStoreUrl && (
              <Button type="button" variant="outline" size="sm" className="h-8 px-2.5 text-[10px]" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="mr-1 h-3 w-3" /> View
              </Button>
            )}
            <Button type="button" size="sm" className="h-8 bg-emerald-600 px-2.5 text-[10px] text-white hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
              <Save className="mr-1 h-3 w-3" /> {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Desktop header */}
      <div className="hidden items-center justify-between lg:flex">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-gray-600" />
            Online Store
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Customize your public storefront</p>
        </div>
        <div className="flex items-center gap-2">
          {fullStoreUrl && (
            <a href={storeUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View Store
              </Button>
            </a>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* ── Store Status Banner ──────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${settings.enabled ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-3">
          {settings.enabled
            ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
            : <XCircle className="w-4.5 h-4.5 text-gray-400" />}
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {settings.enabled ? 'Store is live' : 'Store is offline'}
            </p>
            <p className="text-xs text-gray-500">
              {settings.enabled
                ? `Customers can browse at ${fullStoreUrl || 'your store URL'}`
                : 'Your store is hidden from customers'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-gray-500">
            <span className="font-medium text-gray-700">{settings.products?.active ?? 0}</span> active products
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) => set('enabled', v)}
          />
        </div>
      </div>

      {setup && setup.percent < 100 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-amber-900">Complete your storefront profile</p>
                <Badge variant="outline" className="border-amber-300 text-amber-800">
                  {setup.percent}% ready
                </Badge>
              </div>
              <p className="text-xs text-amber-800/90">
                Customers only see what you enter here, your login email stays private unless you add a public support address.
              </p>
              <ul className="space-y-1">
                {setup.nextSteps.map((step) => (
                  <li key={step.id} className="flex items-center gap-2 text-xs text-amber-900">
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    {step.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        {/* ── Branding Tab ────────────────────────────────────────────── */}
        <TabsContent value="branding" className="space-y-4 mt-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Store className="w-4 h-4" /> Brand mark
              </CardTitle>
              <CardDescription>
                Choose how your store name, icon, or logo appears in the header, footer, and navigation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs">Display mode</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {STOREFRONT_BRAND_MODES.map((mode) => {
                    const active = (settings.branding?.mode || 'text') === mode.value;
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setBranding('mode', mode.value)}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-left transition-colors',
                          active
                            ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        <span className="block text-sm font-semibold text-gray-900">{mode.label}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">{mode.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(settings.branding?.mode === 'text'
                || settings.branding?.mode === 'icon-text'
                || settings.branding?.mode === 'logo-text') && (
                <div className="space-y-2">
                  <Label className="text-xs">Text style</Label>
                  <div className="flex flex-wrap gap-2">
                    {STOREFRONT_BRAND_TEXT_STYLES.map((style) => {
                      const active = (settings.branding?.textStyle || 'classic') === style.value;
                      return (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => setBranding('textStyle', style.value)}
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                            active
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          {style.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(settings.branding?.mode === 'icon' || settings.branding?.mode === 'icon-text') && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Icon</Label>
                    <div className="flex flex-wrap gap-2">
                      {STOREFRONT_BRAND_ICON_KEYS.map((icon) => {
                        const active = (settings.branding?.iconKey || 'initial') === icon.value;
                        return (
                          <button
                            key={icon.value}
                            type="button"
                            onClick={() => setBranding('iconKey', icon.value)}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                              active
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            )}
                          >
                            {icon.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <ImageUploadField
                    label="Custom icon (optional)"
                    hint="Small square mark. Overrides the preset icon when set. Converted to WebP on upload."
                    value={settings.branding?.iconUrl || ''}
                    onChange={(v) => setBranding('iconUrl', v)}
                    businessId={business?.id}
                    purpose="logo"
                  />
                </div>
              )}

              {(settings.branding?.mode === 'logo' || settings.branding?.mode === 'logo-text') && (
                <ImageUploadField
                  label="Store logo image"
                  hint="Shown as your brand mark. Recommended: square WebP. Converted on upload."
                  value={settings.logoUrl}
                  onChange={(v) => set('logoUrl', v)}
                  businessId={business?.id}
                  purpose="logo"
                />
              )}

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Preview</p>
                <StorefrontBrandMark
                  business={{
                    business_name: business?.business_name || 'Your Store',
                    logo_url: settings.logoUrl,
                    category: category || business?.category,
                  }}
                  settings={{
                    storefront: { branding: settings.branding },
                    logoUrl: settings.logoUrl,
                  }}
                  accent={settings.brand?.primaryColor || BRAND_PRIMARY}
                  size="md"
                  nameClassName="text-gray-900"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Image className="w-4 h-4" /> Store Images
              </CardTitle>
              <CardDescription>Logo and hero banner shown on your public store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(settings.branding?.mode !== 'logo' && settings.branding?.mode !== 'logo-text') ? (
                <ImageUploadField
                  label="Store Logo"
                  hint="Optional upload kept for logo modes and emails. Switch display mode above to Logo image to use it in the header."
                  value={settings.logoUrl}
                  onChange={(v) => set('logoUrl', v)}
                  businessId={business?.id}
                  purpose="logo"
                />
              ) : (
                <p className="text-xs text-gray-500">
                  Logo image is managed in Brand mark above. Cover and hero carousel stay here.
                </p>
              )}
              <Separator />
              <ImageUploadField
                label="Hero / Cover Image"
                hint="Used on slide 1 when you have not uploaded custom hero carousel images. Recommended: 1920×1080. Converted to WebP on upload."
                value={settings.coverImageUrl}
                onChange={(v) => set('coverImageUrl', v)}
                businessId={business?.id}
                purpose="hero"
              />
              <Separator />
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Hero carousel</p>
                  <p className="text-xs text-gray-500">
                    Upload wide banner images for your homepage hero. Empty slots keep template
                    defaults for your store type ({heroPreviewPreset?.type || 'commerce-carousel'}).
                    Images are converted to WebP before upload.
                  </p>
                </div>
                <HeroCarouselSlidesEditor
                  slides={settings.heroSlides || []}
                  defaultSlides={defaultHeroSlides}
                  onChange={(slides) => set('heroSlides', slides)}
                  businessId={business?.id}
                  maxSlides={heroMaxSlides}
                  minSlides={heroMinSlides}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4" /> Brand Color
              </CardTitle>
              <CardDescription>Used for buttons, links, and accent elements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.brand?.primaryColor || BRAND_PRIMARY}
                  onChange={(e) => setBrand('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  placeholder={BRAND_PRIMARY}
                  value={settings.brand?.primaryColor || ''}
                  onChange={(e) => setBrand('primaryColor', e.target.value)}
                  className="w-32"
                />
                <span className="text-xs text-gray-400">Hex color code</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4" /> Social Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['facebook', 'instagram', 'twitter', 'youtube'].map(platform => (
                  <div key={platform} className="space-y-1.5">
                    <Label className="capitalize text-xs">{platform}</Label>
                    <Input
                      placeholder={`https://${platform}.com/yourhandle`}
                      value={settings.socialLinks?.[platform] || ''}
                      onChange={(e) => setSocialLink(platform, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Content Tab ─────────────────────────────────────────────── */}
        <TabsContent value="content" className="space-y-4 mt-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">Store Information</CardTitle>
              <CardDescription>Details shown to customers on your public store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Store Description</Label>
                <Textarea
                  placeholder="Describe your store and what you sell..."
                  value={settings.description || ''}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-400">Shown on your store page and used for SEO meta description.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">About page</CardTitle>
              <CardDescription>
                Fully customizable company page for customers. Toggle visibility, story, leadership, and team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AboutPageSettingsEditor
                about={settings.about}
                onChange={(next) => set('about', next)}
                businessId={business?.id}
                ImageUpload={ImageUploadField}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">Public Contact</CardTitle>
              <CardDescription>
                Phone, email, WhatsApp, hours, and location shown on your store header, footer, and contact page.
                {settings.ownerLoginEmail ? (
                  <span className="mt-1 block text-amber-700">
                    Login email ({settings.ownerLoginEmail}) is not shown publicly.
                  </span>
                ) : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Public support email</Label>
                  <Input
                    type="email"
                    placeholder="support@yourbusiness.com"
                    value={settings.publicEmail || ''}
                    onChange={(e) => set('publicEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Customer phone</Label>
                  <Input
                    placeholder={phonePlaceholder}
                    value={settings.phone || ''}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp (optional)</Label>
                  <Input
                    placeholder={phonePlaceholder}
                    value={settings.whatsapp || ''}
                    onChange={(e) => set('whatsapp', e.target.value)}
                  />
                  <p className="text-xs text-gray-400">
                    Used for Call / WhatsApp connection buttons and the contact page. Leave blank to reuse the customer phone number.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Website (optional)</Label>
                  <Input
                    placeholder="https://yourbusiness.com"
                    value={settings.website || ''}
                    onChange={(e) => set('website', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Street address</Label>
                <Input
                  placeholder="Building, street, area"
                  value={settings.address || ''}
                  onChange={(e) => set('address', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input
                    placeholder="City"
                    value={settings.city || ''}
                    onChange={(e) => set('city', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input
                    placeholder="Country"
                    value={settings.country || ''}
                    onChange={(e) => set('country', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Postal code</Label>
                  <Input
                    placeholder="Postal / ZIP"
                    value={settings.postalCode || ''}
                    onChange={(e) => set('postalCode', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Business hours</Label>
                <Textarea
                  placeholder={'Mon-Sat: 9:00 AM - 6:00 PM\nSun: Closed'}
                  value={settings.businessHours || ''}
                  onChange={(e) => set('businessHours', e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-400">Shown on your contact page and store footer when provided.</p>
              </div>
            </CardContent>
          </Card>

          {connectionStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold">Connection buttons</CardTitle>
                <CardDescription>
                  Quote, call, and email pills on your homepage hero and contact banner. Links use the public contact
                  details above (`tel:`, `mailto:`, or WhatsApp).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Show connection buttons</p>
                    <p className="text-xs text-gray-500">Receive Quotation, Call us, Mail us</p>
                  </div>
                  <Switch
                    checked={settings.connection?.enabled !== false}
                    onCheckedChange={(v) => setConnection('enabled', v)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
                    <span className="text-xs font-medium text-gray-700">Quotation</span>
                    <Switch
                      checked={settings.connection?.showQuote !== false}
                      onCheckedChange={(v) => setConnection('showQuote', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
                    <span className="text-xs font-medium text-gray-700">Call</span>
                    <Switch
                      checked={settings.connection?.showCall !== false}
                      onCheckedChange={(v) => setConnection('showCall', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
                    <span className="text-xs font-medium text-gray-700">Email</span>
                    <Switch
                      checked={settings.connection?.showMail !== false}
                      onCheckedChange={(v) => setConnection('showMail', v)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Prefer WhatsApp for Call</p>
                    <p className="text-xs text-gray-500">
                      Opens WhatsApp when a WhatsApp number is set; otherwise uses the phone dialer.
                    </p>
                  </div>
                  <Switch
                    checked={settings.connection?.preferWhatsApp === true}
                    onCheckedChange={(v) => setConnection('preferWhatsApp', v)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quote label</Label>
                    <Input
                      value={settings.connection?.quoteLabel || ''}
                      onChange={(e) => setConnection('quoteLabel', e.target.value)}
                      placeholder="Receive Quotation"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Call label</Label>
                    <Input
                      value={settings.connection?.callLabel || ''}
                      onChange={(e) => setConnection('callLabel', e.target.value)}
                      placeholder="Call us"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mail label</Label>
                    <Input
                      value={settings.connection?.mailLabel || ''}
                      onChange={(e) => setConnection('mailLabel', e.target.value)}
                      placeholder="Mail us"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {showMeetingUrlField ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold">Meeting / scheduling link</CardTitle>
                <CardDescription>
                  Add your Calendly or scheduling page for test drives, appointments, and consultations.
                  Customers open it in a new tab; your contact form stays available as a fallback.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="store-meeting-url">Scheduling URL</Label>
                <Input
                  id="store-meeting-url"
                  type="url"
                  placeholder="https://calendly.com/your-business/30min"
                  value={settings.booking?.meetingUrl || ''}
                  onChange={(e) => setBooking('meetingUrl', e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Shown on your storefront when visitors book test drives, showroom visits, or similar services.
                  Requires Business plan or higher (Appointment Booking).
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">
                {genericHeroCopyApplies ? 'Hero & Announcement' : 'Announcement & Hero Guidance'}
              </CardTitle>
              <CardDescription>
                {genericHeroCopyApplies
                  ? 'Main homepage headline (cover image is under Branding)'
                  : 'This store uses a domain-aware hero. Edit hero slides under Branding and domain-specific hero copy in the Marketing tab.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {genericHeroCopyApplies ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Hero headline</Label>
                    <Input
                      placeholder="e.g. Shop the best products"
                      value={settings.heroTitle || ''}
                      onChange={(e) => set('heroTitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hero subtext</Label>
                    <Textarea
                      placeholder="Short line under the headline on your store homepage"
                      value={settings.heroSubtitle || ''}
                      onChange={(e) => set('heroSubtitle', e.target.value)}
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">
                  Hero headlines and subtext on this template come from your domain-specific hero builder.
                  Use the hero carousel in Branding for slide-level copy and images. Any extra hero labels for
                  this domain live in the Marketing tab.
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Top announcement strip</Label>
                <Input
                  placeholder="e.g. Free shipping on orders over Rs. 2,000"
                  value={settings.announcement || ''}
                  onChange={(e) => set('announcement', e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  {pharmacyStore || supermarketStore
                    ? 'Shown in your store header announcement / delivery notice area.'
                    : restaurantStore || fitnessStore
                      ? 'Used as a fallback notice on some store surfaces. Prefer domain-specific delivery or booking copy in the Marketing tab when available.'
                      : genericHeroCopyApplies
                        ? 'Shown as a thin bar at the top of your homepage on smaller screens, and in the store header on desktop.'
                        : 'Shown in the store header when your template includes an announcement bar. Elevated homepage heroes may hide the mobile strip.'}
                </p>
              </div>
              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Show top bar</p>
                    <p className="text-xs text-gray-500">
                      City, announcement, and Track Order strip above the main header (desktop).
                    </p>
                  </div>
                  <Switch
                    checked={settings.showTopBar !== false}
                    onCheckedChange={(v) => set('showTopBar', v)}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Show phone on top bar</p>
                    <p className="text-xs text-gray-500">
                      Uses your Customer phone from Public Contact. Works across store templates.
                    </p>
                  </div>
                  <Switch
                    checked={settings.showTopBarPhone === true}
                    onCheckedChange={(v) => set('showTopBarPhone', v)}
                    disabled={!settings.phone?.trim()}
                  />
                </div>
                {!settings.phone?.trim() ? (
                  <p className="text-xs text-amber-700">
                    Add a Customer phone under Public Contact to enable this.
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <select
                    className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm bg-white"
                    value={settings.currency}
                    onChange={(e) => set('currency', e.target.value)}
                  >
                    <option value="PKR">PKR (Rs.)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Theme</Label>
                  <select
                    className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm bg-white"
                    value={settings.theme}
                    onChange={(e) => set('theme', e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Marketing Tab ─────────────────────────────────────────── */}
        <TabsContent value="marketing" className="space-y-4 mt-5">
          {marketplaceStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Marketplace portal
                </CardTitle>
                <CardDescription>
                  Hero promo strip and marketplace ticker text on your Tenvo Auto Marketplace homepage (static copy, no live government feeds).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Hero promo</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Eyebrow</Label>
                      <Input
                        value={settings.marketplace?.heroPromo?.eyebrow || ''}
                        onChange={(e) => setMarketplace('heroPromo', 'eyebrow', e.target.value)}
                        placeholder="Tenvo Auto Marketplace"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>CTA label</Label>
                      <Input
                        value={settings.marketplace?.heroPromo?.ctaLabel || ''}
                        onChange={(e) => setMarketplace('heroPromo', 'ctaLabel', e.target.value)}
                        placeholder="Explore deals"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Headline</Label>
                    <Input
                      value={settings.marketplace?.heroPromo?.title || ''}
                      onChange={(e) => setMarketplace('heroPromo', 'title', e.target.value)}
                      placeholder="Drive home your next car with exclusive deals"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Subtext</Label>
                    <Textarea
                      rows={2}
                      value={settings.marketplace?.heroPromo?.subtitle || ''}
                      onChange={(e) => setMarketplace('heroPromo', 'subtitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Promo image URL</Label>
                    <Input
                      value={settings.marketplace?.heroPromo?.image || ''}
                      onChange={(e) => setMarketplace('heroPromo', 'image', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA link</Label>
                    <Input
                      value={settings.marketplace?.heroPromo?.ctaHref || ''}
                      onChange={(e) => setMarketplace('heroPromo', 'ctaHref', e.target.value)}
                      placeholder="/products or https://..."
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">COE ticker</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Label</Label>
                      <Input
                        value={settings.marketplace?.coeTicker?.label || ''}
                        onChange={(e) => setMarketplace('coeTicker', 'label', e.target.value)}
                        placeholder="Cat A COE"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Value</Label>
                      <Input
                        value={settings.marketplace?.coeTicker?.value || ''}
                        onChange={(e) => setMarketplace('coeTicker', 'value', e.target.value)}
                        placeholder="$128,000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Change text</Label>
                      <Input
                        value={settings.marketplace?.coeTicker?.change || ''}
                        onChange={(e) => setMarketplace('coeTicker', 'change', e.target.value)}
                        placeholder="▼ $2,001"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 pt-1">
                  {[
                    ['showEShop', 'Show e-shop section', false],
                    ['showForum', 'Show forum section', false],
                    ['showArticles', 'Show articles section', false],
                    ['showMarketingBanners', 'Show marketing banners', false],
                    ['showTrustStrip', 'Show trust strip', false],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={settings.marketplace?.[key] !== false}
                        onCheckedChange={(v) => setMarketplaceFlag(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {dealershipStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Tenvo Vehicles showroom
                </CardTitle>
                <CardDescription>
                  Customize trust strip, tagline, UAN, and hero video for your vehicle dealership storefront.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Tagline</Label>
                    <Input
                      value={settings.dealership?.tagline || ''}
                      onChange={(e) => setDealership('tagline', e.target.value)}
                      placeholder="Your trusted automotive partner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>UAN / hotline</Label>
                    <Input
                      value={settings.dealership?.uan || ''}
                      onChange={(e) => setDealership('uan', e.target.value)}
                      placeholder="111 734 425"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Welcome headline</Label>
                  <Input
                    value={settings.dealership?.welcomeTitle || ''}
                    onChange={(e) => setDealership('welcomeTitle', e.target.value)}
                    placeholder="Welcome to your ultimate car destination"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Showroom video URL (YouTube embed)</Label>
                  <Input
                    value={settings.dealership?.videoUrl || ''}
                    onChange={(e) => setDealership('videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Trust strip hours</Label>
                    <Input
                      value={settings.dealership?.trustStrip?.hours || ''}
                      onChange={(e) => setDealershipTrust('hours', e.target.value)}
                      placeholder="10 am - 07 pm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Shipping label</Label>
                    <Input
                      value={settings.dealership?.trustStrip?.shippingLabel || ''}
                      onChange={(e) => setDealershipTrust('shippingLabel', e.target.value)}
                      placeholder="Nationwide shipping"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rating label</Label>
                    <Input
                      value={settings.dealership?.trustStrip?.ratingLabel || ''}
                      onChange={(e) => setDealershipTrust('ratingLabel', e.target.value)}
                      placeholder="4.5+ Google ratings"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.dealership?.showTrustStrip !== false}
                      onCheckedChange={(v) => setDealership('showTrustStrip', v)}
                    />
                    <Label className="text-sm">Show trust strip</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.dealership?.showMarketingBanners !== false}
                      onCheckedChange={(v) => setDealership('showMarketingBanners', v)}
                    />
                    <Label className="text-sm">Show marketing banners</Label>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Logo and cover image are set under Branding. Hero slide images use your cover image on slide one, with template defaults for the rest until you add custom marketing sections.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {autoPartsStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Auto parts storefront
                </CardTitle>
                <CardDescription>
                  Toggle homepage sections below the parts finder hero: promo cards, categories, deals, and trust strip.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showPromoCards', 'Promo card carousel'],
                    ['showFeaturedCategories', 'Featured categories grid'],
                    ['showFeaturedDeals', 'Featured deals'],
                    ['showVehicleBrands', 'Shop by car brand'],
                    ['showTrending', 'Top trending products'],
                    ['showTrustSection', 'Why choose us strip'],
                    ['showCategoryRails', 'Category product rails'],
                    ['showMarketingBanners', 'Custom marketing banners'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={settings.autoParts?.[key] !== false}
                        onCheckedChange={(v) => setAutoParts(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Trust section title</Label>
                    <Input
                      value={settings.autoParts?.trustTitle || ''}
                      onChange={(e) => setAutoParts('trustTitle', e.target.value)}
                      placeholder="Why choose us"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Trust subtitle</Label>
                    <Input
                      value={settings.autoParts?.trustSubtitle || ''}
                      onChange={(e) => setAutoParts('trustSubtitle', e.target.value)}
                      placeholder="Your trusted auto parts partner"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Bottom CTA title</Label>
                  <Input
                    value={settings.autoParts?.ctaTitle || ''}
                    onChange={(e) => setAutoParts('ctaTitle', e.target.value)}
                    placeholder="Need help finding the right part?"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bottom CTA subtitle</Label>
                  <Textarea
                    rows={2}
                    value={settings.autoParts?.ctaSubtitle || ''}
                    onChange={(e) => setAutoParts('ctaSubtitle', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bottom CTA button label</Label>
                  <Input
                    value={settings.autoParts?.ctaLabel || ''}
                    onChange={(e) => setAutoParts('ctaLabel', e.target.value)}
                    placeholder="Browse all parts"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Hero slides use your cover image on slide one, with template defaults for the rest. Product metadata (part number, OEM, fitment) is edited per SKU in inventory.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {marineStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Tenvo Marine storefront
                </CardTitle>
                <CardDescription>
                  Hero media, parts finder, KPIs, OEM chips, Stay Ahead imagery, and homepage section toggles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Hero video URL (MP4, loops muted)</Label>
                  <Input
                    value={settings.marine?.heroVideoUrl || ''}
                    onChange={(e) => setMarine('heroVideoUrl', e.target.value)}
                    placeholder={MARINE_HERO_VIDEO_URL}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Hero poster image URL</Label>
                  <Input
                    value={settings.marine?.heroPosterUrl || ''}
                    onChange={(e) => setMarine('heroPosterUrl', e.target.value)}
                    placeholder={MARINE_HERO_POSTER}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Hero eyebrow</Label>
                    <Input
                      value={settings.marine?.heroEyebrow || ''}
                      onChange={(e) => setMarine('heroEyebrow', e.target.value)}
                      placeholder="Marine propulsion"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hero CTA label</Label>
                    <Input
                      value={settings.marine?.heroCtaLabel || ''}
                      onChange={(e) => setMarine('heroCtaLabel', e.target.value)}
                      placeholder="Browse catalogue"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Hero title</Label>
                  <Input
                    value={settings.marine?.heroTitle || ''}
                    onChange={(e) => setMarine('heroTitle', e.target.value)}
                    placeholder="Shaping reliable power at sea"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Hero subtitle</Label>
                  <Textarea
                    rows={2}
                    value={settings.marine?.heroSubtitle || ''}
                    onChange={(e) => setMarine('heroSubtitle', e.target.value)}
                    placeholder="New and used thrusters, rudder propellers…"
                  />
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showFinder', 'Parts finder dock / panel'],
                    ['showKpis', 'KPI / stats strip'],
                    ['showSectorOverview', 'Sector overview (systems & lifecycle)'],
                    ['showExpertise', 'New / used / parts / repair cards'],
                    ['showEquipmentGrid', 'Shop by equipment grid'],
                    ['showBrandChips', 'OEM brand chips'],
                    ['showFeaturedRails', 'Featured product rail'],
                    ['showSpareRail', 'Spare parts rail'],
                    ['showStayAhead', 'Stay ahead editorial'],
                    ['showInsights', 'Insights knowledgebase'],
                    ['showBottomCta', 'Bottom RFQ CTA'],
                    ['showMarketingBanners', 'Custom marketing banners'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={settings.marine?.[key] !== false}
                        onCheckedChange={(v) => setMarine(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Sector overview</p>
                      <p className="text-xs text-gray-500">
                        Dual cards shown before New / used / parts / repair. Skewed frames match premium industrial sites.
                      </p>
                    </div>
                    <select
                      className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                      value={settings.marine?.sectorLayout === 'standard' ? 'standard' : 'skewed'}
                      onChange={(e) => setMarine('sectorLayout', e.target.value)}
                    >
                      <option value="skewed">Skewed (premium)</option>
                      <option value="standard">Standard rectangles</option>
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Section eyebrow</Label>
                      <Input
                        value={settings.marine?.sectorEyebrow || ''}
                        onChange={(e) => setMarine('sectorEyebrow', e.target.value)}
                        placeholder="What we deliver"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Section title</Label>
                      <Input
                        value={settings.marine?.sectorTitle || ''}
                        onChange={(e) => setMarine('sectorTitle', e.target.value)}
                        placeholder="Systems and lifecycle support…"
                      />
                    </div>
                  </div>
                  {(settings.marine?.sectorCards || []).slice(0, 2).map((card, idx) => (
                    <div key={card.id || `sector-${idx}`} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-xs font-semibold text-gray-700">Card {idx + 1}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={card.title || ''}
                          placeholder="Propulsion systems"
                          onChange={(e) => {
                            const next = [...(settings.marine?.sectorCards || [])];
                            next[idx] = { ...next[idx], title: e.target.value };
                            setMarine('sectorCards', next);
                          }}
                        />
                        <select
                          className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                          value={card.icon || 'ship'}
                          onChange={(e) => {
                            const next = [...(settings.marine?.sectorCards || [])];
                            next[idx] = { ...next[idx], icon: e.target.value };
                            setMarine('sectorCards', next);
                          }}
                        >
                          <option value="ship">Ship icon</option>
                          <option value="wrench">Wrench icon</option>
                          <option value="package">Package icon</option>
                          <option value="anchor">Anchor icon</option>
                          <option value="zap">Energy icon</option>
                        </select>
                      </div>
                      <Textarea
                        rows={2}
                        value={card.body || ''}
                        placeholder="Short accurate description for this sector…"
                        onChange={(e) => {
                          const next = [...(settings.marine?.sectorCards || [])];
                          next[idx] = { ...next[idx], body: e.target.value };
                          setMarine('sectorCards', next);
                        }}
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={card.ctaLabel || ''}
                          placeholder="Explore systems"
                          onChange={(e) => {
                            const next = [...(settings.marine?.sectorCards || [])];
                            next[idx] = { ...next[idx], ctaLabel: e.target.value };
                            setMarine('sectorCards', next);
                          }}
                        />
                        <Input
                          value={card.href || ''}
                          placeholder="/products?category=new-systems"
                          onChange={(e) => {
                            const next = [...(settings.marine?.sectorCards || [])];
                            next[idx] = { ...next[idx], href: e.target.value };
                            setMarine('sectorCards', next);
                          }}
                        />
                      </div>
                      <Input
                        value={card.image || ''}
                        placeholder="Image URL"
                        onChange={(e) => {
                          const next = [...(settings.marine?.sectorCards || [])];
                          next[idx] = { ...next[idx], image: e.target.value };
                          setMarine('sectorCards', next);
                        }}
                      />
                      {business?.id ? (
                        <ImageUploadField
                          label={`Upload card ${idx + 1} image`}
                          hint="Wide industrial / vessel photo works best."
                          value={card.image || ''}
                          onChange={(url) => {
                            const next = [...(settings.marine?.sectorCards || [])];
                            next[idx] = { ...next[idx], image: url };
                            setMarine('sectorCards', next);
                          }}
                          businessId={business.id}
                          purpose="banner"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>KPI section title</Label>
                    <Input
                      value={settings.marine?.kpiTitle || ''}
                      onChange={(e) => setMarine('kpiTitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Equipment section title</Label>
                    <Input
                      value={settings.marine?.equipmentTitle || ''}
                      onChange={(e) => setMarine('equipmentTitle', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>KPI section subtitle</Label>
                  <Textarea
                    rows={2}
                    value={settings.marine?.kpiSubtitle || ''}
                    onChange={(e) => setMarine('kpiSubtitle', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>KPI stats (up to 4)</Label>
                  {(settings.marine?.trustStats || []).slice(0, 4).map((stat, idx) => (
                    <div key={`stat-${idx}`} className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={stat.value || ''}
                        placeholder="45+"
                        onChange={(e) => {
                          const next = [...(settings.marine?.trustStats || [])];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setMarine('trustStats', next);
                        }}
                      />
                      <Input
                        value={stat.label || ''}
                        placeholder="Years of experience"
                        onChange={(e) => {
                          const next = [...(settings.marine?.trustStats || [])];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setMarine('trustStats', next);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label>Stay ahead title</Label>
                  <Input
                    value={settings.marine?.stayAheadTitle || ''}
                    onChange={(e) => setMarine('stayAheadTitle', e.target.value)}
                    placeholder="Decide smarter on propulsion stock"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Stay ahead body</Label>
                  <Textarea
                    rows={3}
                    value={settings.marine?.stayAheadSubtitle || ''}
                    onChange={(e) => setMarine('stayAheadSubtitle', e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Stay ahead CTA</Label>
                    <Input
                      value={settings.marine?.stayAheadCtaLabel || ''}
                      onChange={(e) => setMarine('stayAheadCtaLabel', e.target.value)}
                      placeholder="Start browsing"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Stay ahead image URL</Label>
                    <Input
                      value={settings.marine?.stayAheadImageUrl || ''}
                      onChange={(e) => setMarine('stayAheadImageUrl', e.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                </div>
                {business?.id ? (
                  <ImageUploadField
                    label="Upload Stay ahead image"
                    hint="Shown in the Decide smarter section. WebP optimized like other store media."
                    value={settings.marine?.stayAheadImageUrl || ''}
                    onChange={(url) => setMarine('stayAheadImageUrl', url)}
                    businessId={business.id}
                    purpose="banner"
                  />
                ) : null}
                <Separator />
                <div className="space-y-2">
                  <Label>Hero dock quick links</Label>
                  {(settings.marine?.quickLinks || []).slice(0, 6).map((link, idx) => (
                    <div key={`ql-${idx}`} className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={link.label || ''}
                        placeholder="New systems"
                        onChange={(e) => {
                          const next = [...(settings.marine?.quickLinks || [])];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setMarine('quickLinks', next);
                        }}
                      />
                      <Input
                        value={link.href || ''}
                        placeholder="/products?systemCondition=new"
                        onChange={(e) => {
                          const next = [...(settings.marine?.quickLinks || [])];
                          next[idx] = { ...next[idx], href: e.target.value };
                          setMarine('quickLinks', next);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>OEM brand chips</Label>
                  {(settings.marine?.brandChips || []).slice(0, 6).map((chip, idx) => (
                    <div key={`bc-${idx}`} className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={chip.label || ''}
                        placeholder="Schottel"
                        onChange={(e) => {
                          const next = [...(settings.marine?.brandChips || [])];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setMarine('brandChips', next);
                        }}
                      />
                      <Input
                        value={chip.href || ''}
                        placeholder="/products?search=Schottel"
                        onChange={(e) => {
                          const next = [...(settings.marine?.brandChips || [])];
                          next[idx] = { ...next[idx], href: e.target.value };
                          setMarine('brandChips', next);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label>Bottom CTA title</Label>
                  <Input
                    value={settings.marine?.ctaTitle || ''}
                    onChange={(e) => setMarine('ctaTitle', e.target.value)}
                    placeholder="Thruster spare parts"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bottom CTA subtitle</Label>
                  <Textarea
                    rows={2}
                    value={settings.marine?.ctaSubtitle || ''}
                    onChange={(e) => setMarine('ctaSubtitle', e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Bottom CTA button label</Label>
                    <Input
                      value={settings.marine?.ctaLabel || ''}
                      onChange={(e) => setMarine('ctaLabel', e.target.value)}
                      placeholder="Receive Quotation"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bottom CTA image URL</Label>
                    <Input
                      value={settings.marine?.ctaImageUrl || ''}
                      onChange={(e) => setMarine('ctaImageUrl', e.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                </div>
                {business?.id ? (
                  <ImageUploadField
                    label="Upload bottom CTA image"
                    hint="Background photo for the RFQ banner."
                    value={settings.marine?.ctaImageUrl || ''}
                    onChange={(url) => setMarine('ctaImageUrl', url)}
                    businessId={business.id}
                    purpose="banner"
                  />
                ) : null}
                <p className="text-xs text-gray-500">
                  Cover image under Branding is used as the hero poster when poster URL is empty. Part number, OEM, and equipment fields are edited per SKU in inventory.
                </p>
              </CardContent>
            </Card>
          ) : null}


          {supermarketStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Supermarket storefront
                </CardTitle>
                <CardDescription>
                  Manage every homepage section: categories, brands, banners, product rails, trust
                  bars, and header links. Hero carousel slides are under Branding.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SupermarketCatalogEditor
                  supermarket={settings.supermarket || {}}
                  businessId={business?.id}
                  onChange={(next) => setSettings((prev) => ({ ...prev, supermarket: next }))}
                />
              </CardContent>
            </Card>
          ) : null}

          {pharmacyStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Pharmacy storefront
                </CardTitle>
                <CardDescription>
                  Toggle homepage sections below the pharmacy hero. Categories and products come from live inventory.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showRefillPromo', 'Refill reminder CTA', false],
                    ['showBrandsRow', 'Trusted brands row', false],
                    ['showSeoBlock', 'SEO content block', true],
                    ['showMarketingBanners', 'Custom marketing banners', false],
                  ].map(([key, label, optIn]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={optIn ? settings.pharmacy?.[key] === true : settings.pharmacy?.[key] !== false}
                        onCheckedChange={(v) => setPharmacy(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Search placeholder</Label>
                    <Input
                      value={settings.pharmacy?.searchPlaceholder || ''}
                      onChange={(e) => setPharmacy('searchPlaceholder', e.target.value)}
                      placeholder="Search medicines, vitamins, brands…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Featured rail title</Label>
                    <Input
                      value={settings.pharmacy?.featuredRailTitle || ''}
                      onChange={(e) => setPharmacy('featuredRailTitle', e.target.value)}
                      placeholder="Top selling"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location label</Label>
                    <Input
                      value={settings.pharmacy?.locationLabel || ''}
                      onChange={(e) => setPharmacy('locationLabel', e.target.value)}
                      placeholder="Deliver to"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default location hint</Label>
                    <Input
                      value={settings.pharmacy?.defaultLocation || ''}
                      onChange={(e) => setPharmacy('defaultLocation', e.target.value)}
                      placeholder="Uses store city when empty"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Featured rail subtitle</Label>
                    <Input
                      value={settings.pharmacy?.featuredRailSubtitle || ''}
                      onChange={(e) => setPharmacy('featuredRailSubtitle', e.target.value)}
                      placeholder="Popular medicines and wellness picks"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Hero carousel slides are under Branding. Uploaded slides override pharmacy template defaults.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {furnitureStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Furniture storefront
                </CardTitle>
                <CardDescription>
                  Toggle homepage sections below the furniture hero. Room tiles and rails use your catalog categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showTrustStrip', 'Trust strip below hero', false],
                    ['showRoomTiles', 'Room collection tiles', false],
                    ['showLifestyleSpotlight', 'Lifestyle spotlight', false],
                    ['showBrandStories', 'Room essentials brand stories', false],
                    ['showTestimonials', 'Customer testimonials', true],
                    ['showShowroomCta', 'Showroom CTA on homepage', false],
                    ['showMarketingBanners', 'Custom marketing banners', false],
                  ].map(([key, label, optIn]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={optIn ? settings.furniture?.[key] === true : settings.furniture?.[key] !== false}
                        onCheckedChange={(v) => setFurniture(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Room essentials title</Label>
                    <Input
                      value={settings.furniture?.roomEssentialsTitle || ''}
                      onChange={(e) => setFurniture('roomEssentialsTitle', e.target.value)}
                      placeholder="Room essentials"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Room essentials subtitle</Label>
                    <Input
                      value={settings.furniture?.roomEssentialsSubtitle || ''}
                      onChange={(e) => setFurniture('roomEssentialsSubtitle', e.target.value)}
                      placeholder="Curated pieces for every space"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Search placeholder</Label>
                    <Input
                      value={settings.furniture?.searchPlaceholder || ''}
                      onChange={(e) => setFurniture('searchPlaceholder', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Showroom link label</Label>
                    <Input
                      value={settings.furniture?.showroomLabel || ''}
                      onChange={(e) => setFurniture('showroomLabel', e.target.value)}
                      placeholder="Visit showroom"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location label</Label>
                    <Input
                      value={settings.furniture?.locationLabel || ''}
                      onChange={(e) => setFurniture('locationLabel', e.target.value)}
                      placeholder="Deliver to"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default location hint</Label>
                    <Input
                      value={settings.furniture?.defaultLocation || ''}
                      onChange={(e) => setFurniture('defaultLocation', e.target.value)}
                      placeholder="Uses store city when empty"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Hero video URL (optional)</Label>
                    <Input
                      value={settings.furniture?.heroVideoUrl || ''}
                      onChange={(e) => setFurniture('heroVideoUrl', e.target.value)}
                      placeholder="https://…/showroom.mp4"
                    />
                    <p className="text-[11px] text-gray-500">
                      Mute looping MP4 on the first hero slide. Leave blank for image-only (demo stores may use a default).
                    </p>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Showroom CTA video URL (optional)</Label>
                    <Input
                      value={settings.furniture?.showroomVideoUrl || ''}
                      onChange={(e) => setFurniture('showroomVideoUrl', e.target.value)}
                      placeholder="https://…/ambient.mp4"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Showroom banner image URL</Label>
                    <Input
                      value={settings.furniture?.showroomBannerImage || ''}
                      onChange={(e) => setFurniture('showroomBannerImage', e.target.value)}
                      placeholder="Leave blank to use Branding hero / cover / catalog photo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Showroom eyebrow</Label>
                    <Input
                      value={settings.furniture?.showroomEyebrow || ''}
                      onChange={(e) => setFurniture('showroomEyebrow', e.target.value)}
                      placeholder="Experience in person"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Showroom title</Label>
                    <Input
                      value={settings.furniture?.showroomTitle || ''}
                      onChange={(e) => setFurniture('showroomTitle', e.target.value)}
                      placeholder="Visit a showroom near you"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Showroom motivation</Label>
                    <Input
                      value={settings.furniture?.showroomSubtitle || ''}
                      onChange={(e) => setFurniture('showroomSubtitle', e.target.value)}
                      placeholder="See fabrics, test comfort, and get expert guidance…"
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-stone-800">Brand story 1 (above product grid)</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['brandStory1Eyebrow', 'Eyebrow', 'Designed for living'],
                      ['brandStory1Title', 'Title', 'Furniture that feels like home'],
                      ['brandStory1Subtitle', 'Motivation', 'Thoughtful proportions and lasting materials…'],
                      ['brandStory1Image', 'Image URL', 'https://…/lifestyle.jpg'],
                      ['brandStory1Cta', 'Button label', 'Explore living'],
                      ['brandStory1Href', 'Link suffix', '?category=living-room'],
                    ].map(([key, label, placeholder]) => (
                      <div key={key} className={cn('space-y-1.5', key.includes('Subtitle') || key.includes('Image') ? 'sm:col-span-2' : '')}>
                        <Label>{label}</Label>
                        <Input
                          value={settings.furniture?.[key] || ''}
                          onChange={(e) => setFurniture(key, e.target.value)}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="pt-2 text-sm font-semibold text-stone-800">Brand story 2 (below product grid)</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['brandStory2Eyebrow', 'Eyebrow', 'Rest well'],
                      ['brandStory2Title', 'Title', 'Bedrooms made for better nights'],
                      ['brandStory2Subtitle', 'Motivation', 'Create a calm retreat…'],
                      ['brandStory2Image', 'Image URL', 'https://…/bedroom.jpg'],
                      ['brandStory2Cta', 'Button label', 'Shop bedroom'],
                      ['brandStory2Href', 'Link suffix', '?category=bedroom-furniture'],
                    ].map(([key, label, placeholder]) => (
                      <div key={key} className={cn('space-y-1.5', key.includes('Subtitle') || key.includes('Image') ? 'sm:col-span-2' : '')}>
                        <Label>{label}</Label>
                        <Input
                          value={settings.furniture?.[key] || ''}
                          onChange={(e) => setFurniture(key, e.target.value)}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Hero carousel slides are under Branding. Uploaded slides override furniture template defaults.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {tilesStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Tiles & marble storefront
                </CardTitle>
                <CardDescription>
                  Toggle homepage sections below the tiles hero. Space tiles and rails use your catalog categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showRoomTiles', 'Space collection tiles', false],
                    ['showTestimonials', 'Customer testimonials', true],
                    ['showShowroomCta', 'Emporium CTA on homepage', false],
                    ['showMarketingBanners', 'Custom marketing banners', false],
                  ].map(([key, label, optIn]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={optIn ? settings.tiles?.[key] === true : settings.tiles?.[key] !== false}
                        onCheckedChange={(v) => setTiles(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Search placeholder</Label>
                    <Input
                      value={settings.tiles?.searchPlaceholder || ''}
                      onChange={(e) => setTiles('searchPlaceholder', e.target.value)}
                      placeholder="Search floor tiles, wall tiles, marble…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Emporium link label</Label>
                    <Input
                      value={settings.tiles?.showroomLabel || ''}
                      onChange={(e) => setTiles('showroomLabel', e.target.value)}
                      placeholder="Visit emporium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location label</Label>
                    <Input
                      value={settings.tiles?.locationLabel || ''}
                      onChange={(e) => setTiles('locationLabel', e.target.value)}
                      placeholder="Deliver to"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default location hint</Label>
                    <Input
                      value={settings.tiles?.defaultLocation || ''}
                      onChange={(e) => setTiles('defaultLocation', e.target.value)}
                      placeholder="Uses store city when empty"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Hero carousel slides are under Branding. Uploaded slides override tiles template defaults.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {tyreStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Tyre storefront
                </CardTitle>
                <CardDescription>
                  Toggle homepage sections below the tyre hero. Size finder, brands, and rails use your live catalog.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showTrustStrip', 'Trust strip below hero', false],
                    ['showExploreSection', 'Explore our tyres (interactive)', false],
                    ['showOemPartners', 'OEM partner strip', false],
                    ['showSafetyBand', 'Safety & technology band', false],
                    ['showCareTips', 'Tyre care tips', false],
                    ['showVehicleTiles', 'Shop by vehicle type (when Explore is off)', false],
                    ['showLifestyleSpotlight', 'Mid-page company banner', false],
                    ['showBrandStories', 'Brand story band', false],
                    ['showPromoMosaic', 'Extra promo tiles (optional)', true],
                    ['showBrandWall', 'Brand wall', false],
                    ['showAlloyRail', 'Alloy & wheels rail', false],
                    ['showServices', 'Bay services section', false],
                    ['showBayCta', 'Fitting bay CTA', false],
                    ['showTestimonials', 'Customer testimonials', true],
                    ['showMarketingBanners', 'Custom marketing banners', false],
                  ].map(([key, label, optIn]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={optIn ? settings.tyre?.[key] === true : settings.tyre?.[key] !== false}
                        onCheckedChange={(v) => setTyre(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Search placeholder</Label>
                    <Input
                      value={settings.tyre?.searchPlaceholder || ''}
                      onChange={(e) => setTyre('searchPlaceholder', e.target.value)}
                      placeholder="Search size, brand, or model…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bay CTA label</Label>
                    <Input
                      value={settings.tyre?.bayLabel || ''}
                      onChange={(e) => setTyre('bayLabel', e.target.value)}
                      placeholder="Book fitting bay"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location label</Label>
                    <Input
                      value={settings.tyre?.locationLabel || ''}
                      onChange={(e) => setTyre('locationLabel', e.target.value)}
                      placeholder="Deliver to"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default location hint</Label>
                    <Input
                      value={settings.tyre?.defaultLocation || ''}
                      onChange={(e) => setTyre('defaultLocation', e.target.value)}
                      placeholder="Uses store city when empty"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Hero video URL (optional)</Label>
                    <Input
                      value={settings.tyre?.heroVideoUrl || ''}
                      onChange={(e) => setTyre('heroVideoUrl', e.target.value)}
                      placeholder="https://…mp4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bay CTA title</Label>
                    <Input
                      value={settings.tyre?.bayCtaTitle || ''}
                      onChange={(e) => setTyre('bayCtaTitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bay CTA subtitle</Label>
                    <Input
                      value={settings.tyre?.bayCtaSubtitle || ''}
                      onChange={(e) => setTyre('bayCtaSubtitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Explore section title</Label>
                    <Input
                      value={settings.tyre?.exploreTitle || ''}
                      onChange={(e) => setTyre('exploreTitle', e.target.value)}
                      placeholder="Explore our tyres"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Explore section subtitle</Label>
                    <Input
                      value={settings.tyre?.exploreSubtitle || ''}
                      onChange={(e) => setTyre('exploreSubtitle', e.target.value)}
                      placeholder="Choose a vehicle type to discover tyres suited for it."
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Explore background image URL</Label>
                    <Input
                      value={settings.tyre?.exploreBackgroundImage || ''}
                      onChange={(e) => setTyre('exploreBackgroundImage', e.target.value)}
                      placeholder="https://…/explore-banner.jpg"
                    />
                  </div>
                </div>
                <Separator />
                <p className="text-xs font-semibold text-gray-700">Brand story bands (optional overrides)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['brandStory1Eyebrow', 'Story 1 eyebrow'],
                    ['brandStory1Title', 'Story 1 title'],
                    ['brandStory1Subtitle', 'Story 1 subtitle'],
                    ['brandStory1Image', 'Story 1 image URL'],
                    ['brandStory1Cta', 'Story 1 button label'],
                    ['brandStory1Href', 'Story 1 link suffix', '?search=GTR'],
                  ].map(([key, label, placeholder]) => (
                    <div key={key} className="space-y-1.5">
                      <Label>{label}</Label>
                      <Input
                        value={settings.tyre?.[key] || ''}
                        onChange={(e) => setTyre(key, e.target.value)}
                        placeholder={placeholder || ''}
                      />
                    </div>
                  ))}
                  {[
                    ['brandStory2Eyebrow', 'Story 2 eyebrow'],
                    ['brandStory2Title', 'Story 2 title'],
                    ['brandStory2Subtitle', 'Story 2 subtitle'],
                    ['brandStory2Image', 'Story 2 image URL'],
                    ['brandStory2Cta', 'Story 2 button label'],
                    ['brandStory2Href', 'Story 2 link suffix', '?search=Michelin'],
                  ].map(([key, label, placeholder]) => (
                    <div key={key} className="space-y-1.5">
                      <Label>{label}</Label>
                      <Input
                        value={settings.tyre?.[key] || ''}
                        onChange={(e) => setTyre(key, e.target.value)}
                        placeholder={placeholder || ''}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Hero carousel slides are under Branding. Uploaded slides override tyre template defaults.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {electronicsStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Electronics storefront
                </CardTitle>
                <CardDescription>
                  Toggle homepage sections below the electronics hero. Rails and tiles use your live catalog.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showTrustStrip', 'Trust strip below hero', false],
                    ['showCategoryTiles', 'Shop by category tiles', false],
                    ['showBrandWall', 'Brand wall', false],
                    ['showFeaturedRail', 'Top picks rail', false],
                    ['showDealsRail', 'Deals & offers rail', false],
                    ['showGadgetsRail', 'Gadgets & wearables rail', false],
                    ['showAppliancesRail', 'Home appliances rail', false],
                    ['showInstallmentCta', 'Installment enquiry band', false],
                    ['showVisitCta', 'Visit showroom CTA', false],
                    ['showFeedSidebar', 'Homepage department sidebar', false],
                  ].map(([key, label, optIn]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={optIn ? settings.electronics?.[key] === true : settings.electronics?.[key] !== false}
                        onCheckedChange={(v) => setElectronics(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Search placeholder</Label>
                    <Input
                      value={settings.electronics?.searchPlaceholder || ''}
                      onChange={(e) => setElectronics('searchPlaceholder', e.target.value)}
                      placeholder="Search appliances, brands, gadgets…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Installment CTA label</Label>
                    <Input
                      value={settings.electronics?.installmentLabel || ''}
                      onChange={(e) => setElectronics('installmentLabel', e.target.value)}
                      placeholder="Installment enquiry"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location label</Label>
                    <Input
                      value={settings.electronics?.locationLabel || ''}
                      onChange={(e) => setElectronics('locationLabel', e.target.value)}
                      placeholder="Deliver to"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default location</Label>
                    <Input
                      value={settings.electronics?.defaultLocation || ''}
                      onChange={(e) => setElectronics('defaultLocation', e.target.value)}
                      placeholder="Uses store city when empty"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Installment band title</Label>
                    <Input
                      value={settings.electronics?.installmentTitle || ''}
                      onChange={(e) => setElectronics('installmentTitle', e.target.value)}
                      placeholder="Ask about installment plans"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Installment band subtitle</Label>
                    <Input
                      value={settings.electronics?.installmentSubtitle || ''}
                      onChange={(e) => setElectronics('installmentSubtitle', e.target.value)}
                      placeholder="Send an enquiry and our team will guide you."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deals rail title</Label>
                    <Input
                      value={settings.electronics?.dealsRailTitle || ''}
                      onChange={(e) => setElectronics('dealsRailTitle', e.target.value)}
                      placeholder="Deals & offers"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Visit CTA title</Label>
                    <Input
                      value={settings.electronics?.visitTitle || ''}
                      onChange={(e) => setElectronics('visitTitle', e.target.value)}
                      placeholder="Visit our showroom"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Visit CTA subtitle</Label>
                    <Input
                      value={settings.electronics?.visitSubtitle || ''}
                      onChange={(e) => setElectronics('visitSubtitle', e.target.value)}
                      placeholder="See appliances in person and talk to our team."
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Hero carousel slides are under Branding. Installment uses the contact form subject installment.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {fitnessStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Gym & fitness storefront
                </CardTitle>
                <CardDescription>
                  Toggle homepage sections and hero copy. Products, memberships, and supplements come from live inventory.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showPrograms', 'Training programs row', false],
                    ['showMemberships', 'Membership packages', false],
                    ['showBenefits', 'Extra benefits', false],
                    ['showTrainers', 'Meet the coaches', true],
                    ['showBookingStrip', 'Book your slot strip', false],
                    ['showPromoBanners', 'Promo banner row', false],
                    ['showTrustPillars', 'Trust pillars strip', true],
                    ['showMarketingBanners', 'Custom marketing banners', false],
                  ].map(([key, label, optIn]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={optIn ? settings.fitness?.[key] === true : settings.fitness?.[key] !== false}
                        onCheckedChange={(v) => setFitness(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Hero title</Label>
                    <Input
                      value={settings.fitness?.heroTitle || ''}
                      onChange={(e) => setFitness('heroTitle', e.target.value)}
                      placeholder="Be fierce. Train wild."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Search placeholder</Label>
                    <Input
                      value={settings.fitness?.searchPlaceholder || ''}
                      onChange={(e) => setFitness('searchPlaceholder', e.target.value)}
                      placeholder="Search supplements, gear, memberships…"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Hero subtitle</Label>
                    <Input
                      value={settings.fitness?.heroSubtitle || ''}
                      onChange={(e) => setFitness('heroSubtitle', e.target.value)}
                      placeholder="Strength, mobility, and conditioning…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Supplements rail title</Label>
                    <Input
                      value={settings.fitness?.supplementRailTitle || ''}
                      onChange={(e) => setFitness('supplementRailTitle', e.target.value)}
                      placeholder="Fuel your training"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Featured rail title</Label>
                    <Input
                      value={settings.fitness?.featuredRailTitle || ''}
                      onChange={(e) => setFitness('featuredRailTitle', e.target.value)}
                      placeholder="Top picks"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Featured rail subtitle</Label>
                    <Input
                      value={settings.fitness?.featuredRailSubtitle || ''}
                      onChange={(e) => setFitness('featuredRailSubtitle', e.target.value)}
                      placeholder="Bestsellers from your gym"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Membership section title</Label>
                    <Input
                      value={settings.fitness?.membershipSectionTitle || ''}
                      onChange={(e) => setFitness('membershipSectionTitle', e.target.value)}
                      placeholder="Gents gym & ladies section plans"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Membership section subtitle</Label>
                    <Input
                      value={settings.fitness?.membershipSectionSubtitle || ''}
                      onChange={(e) => setFitness('membershipSectionSubtitle', e.target.value)}
                      placeholder="Monthly through annual passes from your catalog"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Membership SKUs, PT sessions, and supplement grids read from inventory categories (Memberships, Personal Training, Classes, supplements). Category tile photos use your category image, a product photo from that category, or gym archive art until you upload images in inventory. Enable Meet the coaches only after adding trainer profiles in settings. Use booking meeting URL above for Calendly-style scheduling.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {jewelleryStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  {category === 'salon-spa' || business?.category === 'salon-spa'
                    ? 'Beauty storefront'
                    : 'Jewellery storefront'}
                </CardTitle>
                <CardDescription>
                  Control the elevated homepage below the hero carousel. Sections use your live
                  categories and inventory; toggle visibility and rename each row.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <Switch
                    checked={settings.jewellery?.animations !== false}
                    onCheckedChange={(v) => setJewellery('animations', v)}
                  />
                  <div>
                    <Label className="text-sm">Scroll and motion effects</Label>
                    <p className="text-xs text-gray-400">
                      Fade-in sections and auto-scrolling rails. Respects reduced-motion preferences.
                    </p>
                  </div>
                </div>
                <Separator />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Homepage sections
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showHeroRating', 'Hero rating / social proof'],
                    ['showCollections', 'Featured collections carousel'],
                    ['showCategories', 'Shop by category circles'],
                    ['showSignaturePieces', 'Signature pieces grid'],
                    ['showJewelleryEdit', 'Editorial mosaic section'],
                    ['showOffers', 'Special offers rail'],
                    ['showNewArrivals', 'New arrivals rail'],
                    ['showProductsCarousel', 'Featured products carousel'],
                    ['showTrustStrip', 'Trust pillars strip'],
                    ['showMarketingBanners', 'Custom marketing banners'],
                    ['showBrandsRow', 'Shop by brand row'],
                    ['showSeoBlock', 'SEO content block', true],
                  ].map(([key, label, optIn]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={optIn ? settings.jewellery?.[key] === true : settings.jewellery?.[key] !== false}
                        onCheckedChange={(v) => setJewellery(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <Separator />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Copy and labels
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Search placeholder</Label>
                    <Input
                      value={settings.jewellery?.searchPlaceholder || ''}
                      onChange={(e) => setJewellery('searchPlaceholder', e.target.value)}
                      placeholder="Search gold, diamonds, bridal sets…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Signature section title</Label>
                    <Input
                      value={settings.jewellery?.signaturePiecesTitle || ''}
                      onChange={(e) => setJewellery('signaturePiecesTitle', e.target.value)}
                      placeholder="Signature Pieces"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Editorial mosaic title</Label>
                    <Input
                      value={settings.jewellery?.jewelleryEditTitle || ''}
                      onChange={(e) => setJewellery('jewelleryEditTitle', e.target.value)}
                      placeholder="The Jewellery Edit"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Offers rail title</Label>
                    <Input
                      value={settings.jewellery?.offersTitle || ''}
                      onChange={(e) => setJewellery('offersTitle', e.target.value)}
                      placeholder="SPECIAL OFFERS"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New arrivals title</Label>
                    <Input
                      value={settings.jewellery?.newArrivalsTitle || ''}
                      onChange={(e) => setJewellery('newArrivalsTitle', e.target.value)}
                      placeholder="NEW ARRIVALS"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Products carousel title</Label>
                    <Input
                      value={settings.jewellery?.productsCarouselTitle || ''}
                      onChange={(e) => setJewellery('productsCarouselTitle', e.target.value)}
                      placeholder="Featured Collection"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Editorial mosaic subtitle</Label>
                    <Input
                      value={settings.jewellery?.jewelleryEditSubtitle || ''}
                      onChange={(e) => setJewellery('jewelleryEditSubtitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Products carousel subtitle</Label>
                    <Input
                      value={settings.jewellery?.productsCarouselSubtitle || ''}
                      onChange={(e) => setJewellery('productsCarouselSubtitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hero secondary button label</Label>
                    <Input
                      value={settings.jewellery?.secondaryCtaLabel || ''}
                      onChange={(e) => setJewellery('secondaryCtaLabel', e.target.value)}
                      placeholder="Browse collection"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hero secondary button link</Label>
                    <Input
                      value={settings.jewellery?.secondaryCtaHref || ''}
                      onChange={(e) => setJewellery('secondaryCtaHref', e.target.value)}
                      placeholder="/products"
                    />
                  </div>
                </div>
                <JewelleryCardsEditor
                  jewellery={settings.jewellery || {}}
                  setJewellery={setJewellery}
                  businessCategory={category || business?.category}
                  businessId={business?.id}
                  categories={fashionCategories}
                />
                <p className="text-xs text-gray-500">
                  Hero category cards and the editorial mosaic resolve from your live inventory.
                  Leave a field blank to keep auto-updating from product photos and categories;
                  fill only the fields you want to pin.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {fashionStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Clothing & textile storefront
                </CardTitle>
                <CardDescription>
                  Control the editorial homepage look and feel. Sections are built from your live
                  categories and inventory; toggle what shows and rename each row.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <Switch
                    checked={settings.fashion?.animations !== false}
                    onCheckedChange={(v) => setFashion('animations', v)}
                  />
                  <div>
                    <Label className="text-sm">Scroll & motion effects</Label>
                    <p className="text-xs text-gray-400">
                      Lightweight fade-in, staggered tiles, and gentle auto-scrolling category
                      rows. Automatically disabled for visitors who prefer reduced motion.
                    </p>
                  </div>
                </div>
                <Separator />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Homepage sections
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showHeroRating', 'Hero rating / social proof'],
                    ['showTopCollections', 'Top collections carousel'],
                    ['showTopPicks', 'Top picks product row'],
                    ['showEditorialSpotlight', 'Editorial spotlight banner'],
                    ['showUnstitched', 'Unstitched category grid'],
                    ['showReadyToWear', 'Ready to wear row'],
                    ['showAccessories', 'Accessories row'],
                    ['showOffers', 'Offers / sale rail'],
                    ['showNewArrivals', 'New arrivals rail'],
                    ['showTrustStrip', 'Trust pillars strip'],
                    ['showMarketingBanners', 'Custom marketing banners'],
                    ['showBrandsRow', 'Trusted brands row'],
                    ['showPromoBanners', 'Promo banner row'],
                    ['showHomeEdit', 'The Home Edit grid'],
                    ['showSaleMosaic', 'Sale mosaic grid'],
                    ['showSeoBlock', 'SEO content block'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={settings.fashion?.[key] !== false}
                        onCheckedChange={(v) => setFashion(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <Separator />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Search & featured row
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Search placeholder</Label>
                    <Input
                      value={settings.fashion?.searchPlaceholder || ''}
                      onChange={(e) => setFashion('searchPlaceholder', e.target.value)}
                      placeholder="Search unstitched, pret, lawn, accessories…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Top picks title</Label>
                    <Input
                      value={settings.fashion?.featuredRailTitle || ''}
                      onChange={(e) => setFashion('featuredRailTitle', e.target.value)}
                      placeholder="Top picks for you"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Top picks subtitle</Label>
                    <Input
                      value={settings.fashion?.featuredRailSubtitle || ''}
                      onChange={(e) => setFashion('featuredRailSubtitle', e.target.value)}
                      placeholder="Curated styles from your store"
                    />
                  </div>
                </div>
                <Separator />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Section titles (optional)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Unstitched title</Label>
                    <Input
                      value={settings.fashion?.unstitchedTitle || ''}
                      onChange={(e) => setFashion('unstitchedTitle', e.target.value)}
                      placeholder="UNSTITCHED"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ready to wear title</Label>
                    <Input
                      value={settings.fashion?.readyToWearTitle || ''}
                      onChange={(e) => setFashion('readyToWearTitle', e.target.value)}
                      placeholder="READY TO WEAR"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Accessories title</Label>
                    <Input
                      value={settings.fashion?.accessoriesTitle || ''}
                      onChange={(e) => setFashion('accessoriesTitle', e.target.value)}
                      placeholder="ACCESSORIES"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Offers title</Label>
                    <Input
                      value={settings.fashion?.offersTitle || ''}
                      onChange={(e) => setFashion('offersTitle', e.target.value)}
                      placeholder="OFFERS & SALE"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New arrivals title</Label>
                    <Input
                      value={settings.fashion?.newArrivalsTitle || ''}
                      onChange={(e) => setFashion('newArrivalsTitle', e.target.value)}
                      placeholder="NEW ARRIVALS"
                    />
                  </div>
                </div>
                <FashionPromoBannersEditor
                  fashion={settings.fashion || {}}
                  setFashion={setFashion}
                  businessCategory={category || business?.category}
                  businessId={business?.id}
                />
                <FashionGulSectionsEditor
                  fashion={settings.fashion || {}}
                  setFashion={setFashion}
                  businessCategory={category || business?.category}
                  businessId={business?.id}
                  categories={fashionCategories}
                />
                <FashionCatalogEditor fashion={settings.fashion || {}} setFashion={setFashion} />
                <p className="text-xs text-gray-500">
                  The Home Edit and Sale mosaic use your inventory categories and product photos.
                  Link each tile to a category; images fall back to category art or a product photo
                  until you upload a custom banner. Live stores without a saved Sale mosaic auto-build
                  from top categories (sale items first).
                </p>
              </CardContent>
            </Card>
          ) : null}

          {restaurantStore ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Restaurant storefront
                </CardTitle>
                <CardDescription>
                  Toggle homepage sections below the food hero. Categories and menu items come from your live inventory.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['showCuisineCarousel', 'Category carousel', false],
                    ['showSuperPicks', 'Featured picks rail', false],
                    ['showOrderModes', 'Delivery / pickup / dine-in tiles', false],
                    ['showTrustStrip', 'Trust pillars strip', false],
                    ['showMarketingBanners', 'Custom marketing banners', false],
                    ['showUpperPromoTiles', 'Wide promo banner row', false],
                    ['showDeliveryBanner', 'Free delivery threshold band', false],
                    ['showRewardsCta', 'Rewards signup CTA', true],
                    ['showDeliveryInfo', 'Hours & delivery info strip', false],
                  ].map(([key, label, optIn]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={optIn ? settings.restaurant?.[key] === true : settings.restaurant?.[key] !== false}
                        onCheckedChange={(v) => setRestaurant(key, v)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Location label</Label>
                    <Input
                      value={settings.restaurant?.locationLabel || ''}
                      onChange={(e) => setRestaurant('locationLabel', e.target.value)}
                      placeholder="Deliver to"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default location hint</Label>
                    <Input
                      value={settings.restaurant?.defaultLocation || ''}
                      onChange={(e) => setRestaurant('defaultLocation', e.target.value)}
                      placeholder="Uses store city when empty"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Search placeholder</Label>
                    <Input
                      value={settings.restaurant?.searchPlaceholder || ''}
                      onChange={(e) => setRestaurant('searchPlaceholder', e.target.value)}
                      placeholder="Search dishes, categories, or specials…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Catering link label</Label>
                    <Input
                      value={settings.restaurant?.cateringLabel || ''}
                      onChange={(e) => setRestaurant('cateringLabel', e.target.value)}
                      placeholder="Catering"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Featured rail title</Label>
                    <Input
                      value={settings.restaurant?.featuredRailTitle || ''}
                      onChange={(e) => setRestaurant('featuredRailTitle', e.target.value)}
                      placeholder="Featured picks"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Featured rail subtitle</Label>
                    <Input
                      value={settings.restaurant?.featuredRailSubtitle || ''}
                      onChange={(e) => setRestaurant('featuredRailSubtitle', e.target.value)}
                      placeholder="Popular dishes from your menu"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Hero slides use your cover image and featured menu items. Cuisine icons and promo banners are built from your product categories and catalog unless you add custom arrays in advanced settings.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4" /> Homepage marketing sections
              </CardTitle>
              <CardDescription>
                Upload full marketing banners or promo strips for any homepage slot: after hero,
                mid-page, or before footer (up to 3 each). Available on every domain storefront —
                use the vertical toggle above if you want to hide them for a specific template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarketingSectionsEditor
                sections={settings.pageSections || []}
                brandColor={settings.brand?.primaryColor}
                onChange={(pageSections) => set('pageSections', pageSections)}
                businessId={business?.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Domain Tab ──────────────────────────────────────────────── */}
        <TabsContent value="domain" className="space-y-4 mt-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Store URL
              </CardTitle>
              <CardDescription>The public address where customers access your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fullStoreUrl && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-emerald-800 break-all">{fullStoreUrl}</span>
                  <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0">
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                  </a>
                </div>
              )}
              <Separator />
              <div className="space-y-1.5">
                <Label>Store Slug</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-md text-sm text-gray-500 shrink-0">
                    /store/
                  </div>
                  <Input
                    placeholder="your-store-name"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="rounded-l-none"
                  />
                  <Button onClick={handleSaveDomain} disabled={domainSaving || !newDomain.trim()} size="sm">
                    {domainSaving ? 'Saving...' : 'Apply'}
                  </Button>
                </div>
                <p className="text-xs text-gray-400">Only lowercase letters, numbers, and hyphens. This is your store&apos;s public URL path.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" /> Product Sync
              </CardTitle>
              <CardDescription>Sync your inventory products to the public store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">{settings.products?.active ?? 0}</span> active &nbsp;/&nbsp;
                    <span className="font-semibold text-gray-800">{settings.products?.total ?? 0}</span> total products
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Marks all active inventory products as visible on the store</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSyncInventory} disabled={syncing}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payments Tab ────────────────────────────────────────────── */}
        <TabsContent value="payments" className="space-y-4 mt-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment Methods
              </CardTitle>
              <CardDescription>Choose which payment options customers see at checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cash on Delivery</p>
                    <p className="text-xs text-gray-400">Customer pays on delivery</p>
                  </div>
                </div>
                <Switch checked={settings.enableCOD} onCheckedChange={(v) => set('enableCOD', v)} />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Card Payments</p>
                    <p className="text-xs text-gray-400">Credit/debit via Stripe</p>
                  </div>
                </div>
                <Switch checked={settings.enableCard} onCheckedChange={(v) => set('enableCard', v)} />
              </div>
              <Separator />
              <button
                onClick={() => router.push(`/business/${category}/store-settings/payments`)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
              >
                <span className="font-medium">Advanced Payment Settings (Stripe Connect, COD fees…)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Shipping Tab ────────────────────────────────────────────── */}
        <TabsContent value="shipping" className="space-y-4 mt-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Truck className="w-4 h-4" /> Shipping Rules
              </CardTitle>
              <CardDescription>Configure shipping thresholds and return policy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Free Shipping Threshold</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 shrink-0">{settings.currency}</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="2000"
                    value={settings.freeShippingThreshold}
                    onChange={(e) => set('freeShippingThreshold', parseInt(e.target.value) || 0)}
                    className="w-40"
                  />
                </div>
                <p className="text-xs text-gray-400">Orders above this amount qualify for free shipping.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Return Window (Days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="7"
                    value={settings.returnPolicyDays}
                    onChange={(e) => set('returnPolicyDays', parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
                <p className="text-xs text-gray-400">How many days customers have to return items.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
