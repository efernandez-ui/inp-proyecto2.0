'use client';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import HeroVideo from '@/components/home/HeroVideo'
import BusinessValueSection from '@/components/home/BusinessValueSection'
import DistributionSection from '@/components/home/DistributionSection'
import ServicesSection from '@/components/home/ServicesSection'
import PortalInfoSection from '@/components/home/PortalInfoSection'
import BrandsSection from '@/components/home/BrandsSection'
import LoggedInHome from '@/components/home/LoggedInHome'
export default function HomePage() {
  const { isLoggedIn } = useSelector((state: RootState) => state.auth);
  if (isLoggedIn) {
    return <LoggedInHome />;
  }
  return (
    <>
      <HeroVideo />
      <PortalInfoSection
        title="Somos el Portal web"
        description="Con el catálogo más completo del mercado, herramientas de autogestión para agilizar los negocios y una experiencia de compra profesional."
        image="/images/PortalWebMobile.webp"
        accentColor="text-indigo-600"
      />
      <BusinessValueSection />
      <DistributionSection />
      <ServicesSection />
      <BrandsSection />
    </>
  )
}
