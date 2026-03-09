import {
  HeroSection,
  ForWhomSection,
  WhatYouCanDoSection,
  HowItWorksSection,
  ClassroomExperienceSection,
  UseCasesSection,
  TeacherValueSection,
  DifferenceSection,
  AccessSection,
  AboutCreatorsSection,
  FinalCtaSection,
  Footer,
} from "@/components/landing"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ForWhomSection />
      <WhatYouCanDoSection />
      <HowItWorksSection />
      <ClassroomExperienceSection />
      <UseCasesSection />
      <TeacherValueSection />
      <DifferenceSection />
      <AccessSection />
      <AboutCreatorsSection />
      <FinalCtaSection />
      <Footer />
    </div>
  )
}
