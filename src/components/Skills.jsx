import { motion } from 'framer-motion'
import { skillGroups } from '../data/experience'

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
        04 · skills
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
