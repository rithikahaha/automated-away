import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-24 md:py-36">
      <motion.p
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeUp}
        className="mb-4 font-mono text-sm text-accent"
      >
        01 · about
      </motion.p>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        className="space-y-6 text-xl leading-relaxed text-muted"
      >
        <motion.p variants={fadeUp}>
          Data analyst who got tired of dashboards that just sit there, so I
          started building ones that talk back.
        </motion.p>
        <motion.p variants={fadeUp}>
          I started my career as a systems engineer, but traditional
          engineering, the kind built on writing code, never felt like mine.
          What did feel like mine showed up at Infosys, and it showed up as
          two things at once: SQL, specifically, not &quot;data&quot; in
          general, and everything happening in AI right now, the automation,
          the agents. Both landed the same way, at the same time. So the
          pivot wasn&apos;t from one thing into another, it was toward both:
          data analytics and AI, together, which is what I actually build now.
        </motion.p>
        <motion.p variants={fadeUp}>
          I&apos;ve spent the last while turning messy warehouses, spreadsheets,
          and BI files into things that actually answer questions: supply
          chains, credit risk, customer revenue. Most recently: teaching a
          team of AI agents to do the analysis instead of me. It&apos;s going
          well. Mostly.
        </motion.p>
        <motion.p variants={fadeUp}>
          Currently an AI Agent Engineering &amp; Business Intelligence extern
          working with Wayfair, after a stint doing people analytics for
          Amazon and a systems traineeship at Infosys.
        </motion.p>
        <motion.p variants={fadeUp}>
          Beyond that: mixing music nobody asked for, and chasing whatever&apos;s
          interesting this month.
        </motion.p>
      </motion.div>
    </section>
  )
}
