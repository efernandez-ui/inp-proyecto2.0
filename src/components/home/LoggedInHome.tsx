'use client';

import HomeBannerCarousel from './HomeBannerCarousel';
import HomeCategoryStrip from './HomeCategoryStrip';
import HomeSummaryCards from './HomeSummaryCards';
import OfertaBannersSection from './OfertaBannersSection';
import HomeCuratedListsSection from './HomeCuratedListsSection';

export default function LoggedInHome() {
  return (
    <div className="bg-[#f2f2f2] overflow-x-hidden">
      <HomeCategoryStrip />
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2 sm:pt-6 sm:pb-3">
        <HomeSummaryCards />
      </div>
      <div className="mb-4 sm:mb-6">
        <HomeBannerCarousel fullBleed />
      </div>
      <OfertaBannersSection />
      <HomeCuratedListsSection />
    </div>
  );
}
