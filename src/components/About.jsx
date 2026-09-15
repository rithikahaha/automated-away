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
          I didn&apos;t have a data background going in, I had a systems
          engineering one. So I taught myself the domain end to end: SQL past
          what Infosys gave me, Python&apos;s data stack, the statistics that
          make a result actually mean something instead of just looking like
          one, PySpark and cloud warehousing for when data gets big, Tableau
          and Power BI for saying it out loud, and now agentic AI for the
          newest layer of it. The Google Data Analytics certificate and
          Deloitte&apos;s job simulation gave me some structure, but most of
          it came from building the three real projects on this site and
          hitting the actual gaps in my knowledge in whatever order the
          project demanded, not the order a syllabus would have picked.
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
