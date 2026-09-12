import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { FiArrowUpRight, FiGithub } from 'react-icons/fi'

export default function ProjectCard({ project, index }) {
  const ref = useRef(null)
  const rotateX = useSpring(0, { stiffness: 300, damping: 25 })
  const rotateY = useSpring(0, { stiffness: 300, damping: 25 })
  const glowX = useMotionValue(50)
  const glowY = useMotionValue(50)
  const glow = useMotionTemplate`radial-gradient(400px circle at ${glowX}% ${glowY}%, rgba(167,139,250,0.12), transparent 70%)`

  function handleMouseMove(e) {
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotateY.set((px - 0.5) * 10)
    rotateX.set((0.5 - py) * 10)
    glowX.set(px * 100)
    glowY.set(py * 100)
  }

  function handleMouseLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <motion.div
        style={{ background: glow }}
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-bg">
        <img
          src={project.image}
          alt={`${project.title} preview`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
      </div>

      <div className="relative z-20 p-6">
        <h3 className="font-display text-xl font-semibold text-text">{project.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">{project.blurb}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted/70">{project.detail}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-bg px-2.5 py-1 font-mono text-[11px] text-muted"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-5 font-mono text-sm">
          <a
            href={project.github}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-muted transition-colors hover:text-accent"
          >
            <FiGithub size={15} /> Code
          </a>
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-muted transition-colors hover:text-accent"
            >
              <FiArrowUpRight size={15} /> {project.demoLabel || 'Live'}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}
