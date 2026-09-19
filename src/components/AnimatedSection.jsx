import React from 'react'
import { motion } from 'framer-motion'

const variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export default function AnimatedSection({ children, className = '', delay = 0, once = true }){
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.16 }}
      variants={variants}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}
