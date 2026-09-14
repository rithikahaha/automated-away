import { motion } from 'framer-motion'
import { FiArrowUpRight } from 'react-icons/fi'
import { writing } from '../data/writing'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function Writing() {
  return (
    <section id="writing" className="mx-auto max-w-3xl px-6 py-24 md:py-36">
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="mb-4 font-mono text-sm text-accent"
      >
        04 · writing
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mb-14 font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl"
      >
        Notes from the work
      </motion.h2>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        className="divide-y divide-border border-y border-border"
      >
        {writing.map((post) => (
          <motion.a
            key={post.url}
            href={post.url}
            target="_blank"
            rel="noreferrer"
            variants={fadeUp}
            className="group flex items-center justify-between gap-6 py-6 transition-colors"
          >
            <div>
              <p className="font-display text-lg font-semibold text-text transition-colors group-hover:text-accent sm:text-xl">
                {post.title}
              </p>
              <p className="mt-2 font-mono text-xs text-muted">
                {post.source} &middot; {post.date} &middot; {post.readTime}
              </p>
            </div>
            <FiArrowUpRight
              size={20}
              className="shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            />
          </motion.a>
        ))}
      </motion.div>
    </section>
  )
}
