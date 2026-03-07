import {
  HeroSection,
  ValueSection,
  HowItWorksSection,
  FeaturesSection,
  ProductVisualsSection,
  ComparisonSection,
  UseCasesSection,
  InstitutionSection,
  FinalCtaSection,
  Footer,
} from "@/components/landing"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ValueSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ProductVisualsSection />
      <ComparisonSection />
      <UseCasesSection />
      <InstitutionSection />
      <FinalCtaSection />
      <Footer />
    </div>
  )
}
