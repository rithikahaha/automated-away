import { useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { FiArrowUpRight, FiChevronDown, FiEdit3, FiGithub } from 'react-icons/fi'

export default function ProjectCard({ project, index }) {
  const [showDiagram, setShowDiagram] = useState(false)
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.94])

  const reversed = index % 2 === 1

  return (
    <section ref={sectionRef} className="py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
      <div
        className={`flex flex-col items-center gap-10 md:gap-16 ${
          reversed ? 'md:flex-row-reverse' : 'md:flex-row'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative w-full overflow-hidden rounded-3xl border border-border bg-surface md:w-1/2"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <motion.img
              style={{ y: imageY, scale: imageScale }}
              src={project.image}
              alt={`${project.title} preview`}
              className="h-full w-full object-cover"
            />
          </div>
        </motion.div>

        <div className="w-full md:w-1/2">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="mb-4 font-mono text-sm text-accent"
          >
            Project {String(index + 1).padStart(2, '0')}
          </motion.p>

          <motion.h3
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-text sm:text-5xl"
          >
            {project.title}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-lg leading-relaxed text-muted"
          >
            {project.blurb}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-4 text-base leading-relaxed text-muted/70"
          >
            {project.detail}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 flex flex-wrap gap-2"
          >
            {project.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 font-mono text-xs text-muted"
              >
                {t}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
            >
              <FiGithub size={16} /> Code
            </a>
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-transform hover:scale-105"
              >
                <FiArrowUpRight size={16} /> {project.demoLabel || 'Live'}
              </a>
            )}
            {project.blog && (
              <a
                href={project.blog}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
              >
                <FiEdit3 size={16} /> Blog
              </a>
            )}
            {project.diagram && (
              <button
                onClick={() => setShowDiagram((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
              >
                How it works
                <motion.span animate={{ rotate: showDiagram ? 180 : 0 }} transition={{ duration: 0.25 }}>
                  <FiChevronDown size={14} />
                </motion.span>
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {project.diagram && (
        <AnimatePresence initial={false}>
          {showDiagram && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-10 rounded-2xl border border-border bg-surface p-6 md:p-10">
                <project.diagram />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      </div>
    </section>
  )
}
