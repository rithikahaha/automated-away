import { motion } from 'framer-motion'
import { experience, education, certifications } from '../data/experience'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
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

      <div className="relative space-y-10 border-l border-border pl-8">
        {experience.map((job, i) => (
          <motion.div
            key={job.role}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            transition={{ delay: i * 0.05 }}
            className="relative"
          >
            <span className="absolute -left-[2.28rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-bg" />
            <p className="font-mono text-xs text-muted">{job.period}</p>
            <h3 className="mt-1 font-display text-lg font-semibold text-text">{job.role}</h3>
            <p className="text-sm text-accent2">
              {job.org} · {job.location}
            </p>
            <ul className="mt-3 space-y-2">
              {job.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-sm leading-relaxed text-muted">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        className="mt-14 grid gap-6 border-t border-border pt-10 sm:grid-cols-2"
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
