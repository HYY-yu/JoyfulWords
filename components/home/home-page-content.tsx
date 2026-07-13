"use client"

import { LandingHeader } from "@/components/home/landing-header"
import { FaqSection } from "@/components/home/sections/faq-section"
import { FeaturesSection } from "@/components/home/sections/features-section"
import { FinalCtaSection } from "@/components/home/sections/final-cta-section"
import { HeroSection } from "@/components/home/sections/hero-section"
import { HowItWorksSection } from "@/components/home/sections/how-it-works-section"
import { LandingFooter } from "@/components/home/sections/landing-footer"
import { OutcomesSection } from "@/components/home/sections/outcomes-section"

export function HomePageContent() {
  return (
    <div className="jw-app-shell min-h-[100dvh] overflow-x-hidden">
      <LandingHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <OutcomesSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
