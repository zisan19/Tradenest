import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * RevealText
 * Splits text into individual words and animates them sequentially
 * with a staggered fade-up and blur-to-focus transition.
 */
export default function RevealText({
  text = '',
  className = '',
  as: Component = 'h1',
  delay = 0,
  staggerDelay = 0.045,
}) {
  const shouldReduceMotion = useReducedMotion()
  const words = text.split(' ')

  if (shouldReduceMotion) {
    return <Component className={className}>{text}</Component>
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  }

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 22,
      filter: 'blur(8px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1], // Custom smooth cubic-bezier easeOut
      },
    },
  }

  return (
    <Component className={className}>
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="inline-block"
      >
        {words.map((word, index) => (
          <motion.span
            key={`${word}-${index}`}
            variants={wordVariants}
            className="inline-block mr-[0.26em] whitespace-nowrap will-change-transform"
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  )
}
