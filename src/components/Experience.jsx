import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'
import { experience, education, certifications } from '../data/experience'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

function ExperienceRow({ job, index }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div variants={fadeUp} transition={{ delay: index * 0.05 }} className="relative pb-8 pl-14">
      {index !== experience.length - 1 && (
        <span className="absolute left-5 top-10 h-[calc(100%-1.5rem)] w-px bg-border" />
      )}

      <span
        style={{ background: job.color }}
        className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-semibold text-white"
      >
        {job.initial}
      </span>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <p className="font-display font-semibold text-text">
            {job.company}
            {job.client && (
              <span className="ml-2 font-mono text-[11px] font-normal text-accent2">
                · client: {job.client}
              </span>
            )}
          </p>
          <p className="text-sm text-muted">{job.role}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-xs text-muted">{job.period}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <FiChevronDown className="text-muted" size={16} />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-sm italic leading-relaxed text-muted">{job.tagline}</p>
            <ul className="mt-3 space-y-2">
              {job.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-sm leading-relaxed text-muted">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-bg px-2.5 py-1 font-mono text-[11px] text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-3xl px-6 py-28">
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="mb-3 font-mono text-sm text-accent"
      >
        02 · experience
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mb-12 font-display text-3xl font-semibold text-text sm:text-4xl"
      >
        Where I&apos;ve worked
      </motion.h2>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        {experience.map((job, i) => (
          <ExperienceRow key={job.company} job={job} index={i} />
        ))}
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        className="mt-4 grid gap-6 border-t border-border pt-10 sm:grid-cols-2"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Education</p>
          <p className="mt-2 font-display font-semibold text-text">{education.school}</p>
          <p className="text-sm text-muted">{education.degree}</p>
          <p className="text-sm text-muted">
            {education.location} · {education.period}
          </p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Certifications</p>
          <ul className="mt-2 space-y-1.5">
            {certifications.map((c) => (
              <li key={c.name} className="text-sm text-muted">
                {c.name}
                <span className="ml-2 rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-accent2">
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  )
}
