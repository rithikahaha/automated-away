import { motion } from 'framer-motion'
import { FiArrowUpRight, FiGithub, FiLinkedin, FiMail } from 'react-icons/fi'

const links = [
  {
    label: 'Email',
    value: 'rrithikaaa.h@gmail.com',
    href: 'mailto:rrithikaaa.h@gmail.com',
    icon: FiMail,
  },
  {
    label: 'LinkedIn',
    value: 'rithika-harikrishna',
    href: 'https://www.linkedin.com/in/rithika-harikrishna/',
    icon: FiLinkedin,
  },
  {
    label: 'GitHub',
    value: 'rithikahaha',
    href: 'https://github.com/rithikahaha',
    icon: FiGithub,
  },
]

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-3xl px-6 py-28 text-center">
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="mb-3 font-mono text-sm text-accent"
      >
        05 · contact
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="font-display text-3xl font-semibold text-text sm:text-4xl"
      >
        Let&apos;s talk
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mx-auto mt-4 max-w-md text-muted"
      >
        Have a project, a role, or an interesting data problem? My inbox is open.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mx-auto mt-10 flex max-w-md flex-col gap-3"
      >
        {links.map(({ label, value, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="group flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-3.5 transition-colors hover:border-accent"
          >
            <span className="flex items-center gap-3 font-mono text-sm text-text">
              <Icon className="text-accent" size={16} />
              {value}
            </span>
            <FiArrowUpRight
              size={16}
              className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
            />
          </a>
        ))}
      </motion.div>
    </section>
  )
}
