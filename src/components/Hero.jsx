import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowDown, FiGithub, FiLinkedin, FiMail } from 'react-icons/fi'

const roles = ['data analyst', 'agent builder', 'problem automator']

export default function Hero() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % roles.length), 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-5 font-mono text-sm text-accent"
      >
        hi, I&apos;m
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-balance font-display text-6xl font-semibold tracking-tight text-text sm:text-7xl md:text-8xl"
      >
        Rithika Harikrishna
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-7 flex h-9 items-center font-mono text-xl text-muted sm:text-2xl"
      >
        <span>I&apos;m a&nbsp;</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={roles[i]}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="text-gradient font-medium"
          >
            {roles[i]}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-7 max-w-xl text-balance text-lg text-muted sm:text-xl"
      >
        I turn messy data into things that actually answer questions —
        and lately, into agents that do it for me.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <a
          href="#projects"
          className="rounded-full bg-accent px-8 py-3.5 text-base font-medium text-bg transition-transform hover:scale-105"
        >
          View projects
        </a>
        <a
          href="#contact"
          className="rounded-full border border-border px-8 py-3.5 text-base font-medium text-text transition-colors hover:border-accent hover:text-accent"
        >
          Get in touch
        </a>
        <a
          href={`${import.meta.env.BASE_URL}resume.pdf`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-border px-8 py-3.5 text-base font-medium text-text transition-colors hover:border-accent hover:text-accent"
        >
          Resume
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="mt-10 flex items-center gap-5 text-muted"
      >
        <a href="https://github.com/rithikahaha" target="_blank" rel="noreferrer" aria-label="GitHub" className="transition-colors hover:text-accent">
          <FiGithub size={20} />
        </a>
        <a href="https://www.linkedin.com/in/rithika-harikrishna/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="transition-colors hover:text-accent">
          <FiLinkedin size={20} />
        </a>
        <a href="mailto:rrithikaaa.h@gmail.com" aria-label="Email" className="transition-colors hover:text-accent">
          <FiMail size={20} />
        </a>
      </motion.div>

      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1 }, y: { duration: 1.8, repeat: Infinity } }}
        className="absolute bottom-10 text-muted transition-colors hover:text-accent"
        aria-label="Scroll down"
      >
        <FiArrowDown size={20} />
      </motion.a>
    </section>
  )
}
