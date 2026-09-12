import { motion } from 'framer-motion'

const stack = [
  'Python',
  'SQL',
  'Pandas',
  'PySpark',
  'Snowflake',
  'Tableau',
  'Power BI',
  'Statistics',
  'Claude Code',
  'Streamlit',
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-28">
      <motion.p
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeUp}
        className="mb-3 font-mono text-sm text-accent"
      >
        01 · about
      </motion.p>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        className="space-y-5 text-lg leading-relaxed text-muted"
      >
        <motion.p variants={fadeUp}>
          Data analyst who got tired of dashboards that just sit there, so I
          started building ones that talk back.
        </motion.p>
        <motion.p variants={fadeUp}>
          I&apos;ve spent the last while turning messy warehouses, spreadsheets,
          and BI files into things that actually answer questions — supply
          chains, credit risk, customer revenue. Most recently: teaching a
          team of AI agents to do the analysis instead of me. It&apos;s going
          well. Mostly.
        </motion.p>
        <motion.p variants={fadeUp}>
          Beyond that: mixing music nobody asked for, and chasing whatever&apos;s
          interesting this month.
        </motion.p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        className="mt-10 flex flex-wrap gap-2.5"
      >
        {stack.map((s) => (
          <motion.span
            key={s}
            variants={fadeUp}
            className="rounded-full border border-border bg-surface px-3.5 py-1.5 font-mono text-xs text-muted"
          >
            {s}
          </motion.span>
        ))}
      </motion.div>
    </section>
  )
}
