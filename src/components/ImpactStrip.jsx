import { motion } from 'framer-motion'

const stats = [
  { value: '180K+', label: 'orders audited' },
  { value: 'R$16M+', label: 'revenue analyzed' },
  { value: '40+', label: 'automated data checks' },
  { value: '3', label: 'live dashboards shipped' },
]

export default function ImpactStrip() {
  return (
    <section className="border-y border-border">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4"
      >
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="text-center sm:text-left"
          >
            <p className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-xs text-muted sm:text-sm">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
