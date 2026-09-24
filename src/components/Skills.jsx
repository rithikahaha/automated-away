import { motion } from 'framer-motion'
import { skillGroups } from '../data/experience'

const proof = [
  { need: 'SQL, every day', shown: '100+ queries at Infosys, and SQL runs through all three projects.' },
  { need: 'Python and statistics', shown: 'Random Forest and K-Means on 99,440 real orders, plus A/B test simulations, with the p-values reported honestly.' },
  { need: 'Dashboards people use', shown: 'Live Tableau and Plotly dashboards you can open from this page, plus a 5-page Power BI report.' },
  { need: 'Cloud warehouse and modern data stack', shown: 'Snowflake, AWS (S3, Glue, Athena) and dbt, with 40 automated data checks.' },
  { need: 'Working with AI, not around it', shown: 'A 7-agent analyst built on Claude Code, and 5 n8n workflows for Wayfair.' },
  { need: 'Work that stays correct', shown: '48 automated tests, checks on every push, and health checks with stated targets.' },
]

function SkillTile({ name, icon: Icon, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors duration-300 hover:border-accent/60"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg text-muted transition-colors duration-300 group-hover:bg-accent/15 group-hover:text-accent">
        <Icon size={20} />
      </span>
      <p className="text-sm font-medium leading-snug text-text">{name}</p>
    </motion.div>
  )
}

export default function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-6xl px-6 py-24 md:py-36">
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="mb-4 font-mono text-sm text-accent"
      >
        05 · skills
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mb-16 font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl md:text-6xl"
      >
        What I work with
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="mb-20"
      >
        <p className="mb-6 font-mono text-xs uppercase tracking-wide text-accent2">what teams need in 2026, and where I have shown it</p>
        <dl className="divide-y divide-border border-y border-border">
          {proof.map((p) => (
            <div key={p.need} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8">
              <dt className="font-display text-base font-semibold text-text">{p.need}</dt>
              <dd className="text-sm leading-relaxed text-muted">{p.shown}</dd>
            </div>
          ))}
        </dl>
      </motion.div>

      <div className="space-y-16 md:space-y-24">
        {skillGroups.map((group) => (
          <div key={group.label}>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5 }}
              className="mb-6 font-mono text-xs uppercase tracking-wide text-accent2"
            >
              {group.label}
            </motion.p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {group.items.map((item, i) => (
                <SkillTile key={item.name} name={item.name} icon={item.icon} index={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
