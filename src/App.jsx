import { MotionConfig } from 'framer-motion'
import BackgroundGlow from './components/BackgroundGlow'
import Nav from './components/Nav'
import Hero from './components/Hero'
import ImpactStrip from './components/ImpactStrip'
import About from './components/About'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Writing from './components/Writing'
import Skills from './components/Skills'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen">
      <BackgroundGlow />
      <Nav />
      <main>
        <Hero />
        <ImpactStrip />
        <About />
        <Experience />
        <Projects />
        <Writing />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </div>
    </MotionConfig>
  )
}
