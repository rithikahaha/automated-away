import { motion } from 'framer-motion'

export default function NotificationCard({ icon: Icon, title, value, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay }}
      className={`absolute z-20 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay }}
        className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/95 px-3 py-2.5 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.55)] backdrop-blur"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Icon size={15} />
        </span>
        <div className="leading-tight">
          <p className="whitespace-nowrap text-xs font-semibold text-text">{title}</p>
          <p className="whitespace-nowrap text-[11px] text-muted">{value}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
