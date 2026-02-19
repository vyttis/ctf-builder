import {
  HeroSection,
  ProblemSection,
  CtfExplanationSection,
  HowItWorksSection,
  SteamIntegrationSection,
  BenefitsSection,
  InstitutionSection,
  FinalCtaSection,
  Footer,
} from "@/components/landing"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ProblemSection />
      <CtfExplanationSection />
      <HowItWorksSection />
      <SteamIntegrationSection />
      <BenefitsSection />
      <InstitutionSection />
      <FinalCtaSection />
      <Footer />
    </div>
  )
}
