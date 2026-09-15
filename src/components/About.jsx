import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const blocks = [
  {
    label: 'the pivot',
    text: 'Traditional engineering never felt like mine. SQL did, and so did everything happening in AI right now. Those two showed up together, so I pivoted toward both at once, not one after the other.',
  },
  {
    label: 'how i got here',
    text: 'Engineering background, not a data one, and no bootcamp. I taught myself SQL, Python, stats, PySpark, Tableau, and now agentic AI by building the three real projects on this site and closing whatever gap each one exposed.',
  },
]

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
      >
        <motion.p variants={fadeUp} className="text-2xl font-medium leading-snug text-text sm:text-3xl">
          Data analyst who got tired of dashboards that just sit there, so I
          started building ones that talk back.
        </motion.p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {blocks.map((b) => (
            <motion.div key={b.label} variants={fadeUp}>
              <p className="mb-2 font-mono text-xs uppercase tracking-wide text-accent2">{b.label}</p>
              <p className="text-base leading-relaxed text-muted">{b.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.p variants={fadeUp} className="mt-10 text-lg leading-relaxed text-muted">
          Currently externing with Wayfair on AI and BI, after Amazon and a
          systems trainee stint at Infosys. Beyond that: mixing music nobody
          asked for.
        </motion.p>
      </motion.div>
    </section>
  )
}
