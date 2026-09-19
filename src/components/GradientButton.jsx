import React from 'react'
import { motion } from 'framer-motion'

export default function GradientButton({ children, className = '', type = 'button', disabled = false, onClick }){
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.16 }}
      className={`gradient-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </motion.button>
  )
}
