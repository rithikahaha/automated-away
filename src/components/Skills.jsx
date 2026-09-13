import { motion } from 'framer-motion'
import { skillGroups } from '../data/experience'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-3xl px-6 py-24 md:py-36">
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="mb-4 font-mono text-sm text-accent"
      >
        04 · skills
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mb-14 font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl"
      >
        What I work with
      </motion.h2>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="grid gap-6 sm:grid-cols-2"
      >
        {skillGroups.map((group) => (
          <motion.div
            key={group.label}
            variants={fadeUp}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <p className="font-mono text-xs uppercase tracking-wide text-accent2">{group.label}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border bg-bg px-3 py-1 text-xs text-muted"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
