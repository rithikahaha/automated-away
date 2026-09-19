import { useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowUpRight,
  FiCheckCircle,
  FiChevronDown,
  FiEdit3,
  FiGithub,
  FiPlayCircle,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import LaptopMockup from './LaptopMockup'
import NotificationCard from './NotificationCard'
import TableauEmbed from './TableauEmbed'
import DashboardEmbed from './DashboardEmbed'

const embedButtonLabel = {
  tableau: 'Try it live',
  iframe: 'Explore the dashboard',
}

const notificationsByIndex = [
  [
    { icon: FiAlertTriangle, title: 'Churn risk alert', value: 'Starter tier · 28.8%' },
    { icon: FiActivity, title: 'SLO check', value: 'p95 target < 1000 ms' },
  ],
  [
    { icon: FiTruck, title: 'SLA breach detected', value: 'First Class · 0% on time' },
    { icon: FiCheckCircle, title: 'Fix verified', value: 'p < 0.001 · 3 tiers' },
  ],
  [
    { icon: FiShoppingBag, title: 'New order', value: 'São Paulo · R$161.72' },
    { icon: FiUsers, title: 'Champion segment', value: '7x average spend' },
  ],
]

export default function ProjectCard({ project, index }) {
  const [showDiagram, setShowDiagram] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.08, 1])

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
          className="w-full md:w-1/2"
        >
          <div className="relative">
            <div className="drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]">
              <LaptopMockup
                src={project.image}
                alt={`${project.title} preview`}
                imageMotionStyle={{ scale: imageScale, transformOrigin: '50% 50%' }}
              />
            </div>
            {(notificationsByIndex[index % notificationsByIndex.length] || []).map((n, i) => (
              <NotificationCard
                key={n.title}
                icon={n.icon}
                title={n.title}
                value={n.value}
                delay={0.4 + i * 0.15}
                className={
                  i === 0
                    ? `-top-5 ${reversed ? '-left-5 md:-left-10' : '-right-5 md:-right-10'}`
                    : `-bottom-6 ${reversed ? '-right-4 md:-right-8' : '-left-4 md:-left-8'}`
                }
              />
            ))}
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
            {project.embedUrl && (
              <button
                onClick={() => setShowEmbed((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
              >
                <FiPlayCircle size={16} /> {showEmbed ? 'Hide live demo' : embedButtonLabel[project.embedType] || 'Try it live'}
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

      {project.embedUrl && (
        <AnimatePresence initial={false}>
          {showEmbed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-10">
                {project.embedType === 'iframe' ? (
                  <DashboardEmbed src={project.embedUrl} />
                ) : (
                  <TableauEmbed src={project.embedUrl} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      </div>
    </section>
  )
}
