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
      <main>
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
      </main>
      <Footer />
    </div>
  )
}
