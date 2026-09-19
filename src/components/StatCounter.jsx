import React, { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export default function StatCounter({ value = 0, duration = 1200, prefix = '', suffix = '' }){
  const [display, setDisplay] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(()=>{
    let start = null
    let frameId
    const from = 0
    const to = Number(value) || 0
    if(reduceMotion){
      setDisplay(to)
      return undefined
    }
    function step(timestamp){
      if(!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      setDisplay(Math.floor(from + (to - from) * progress))
      if(progress < 1) frameId = requestAnimationFrame(step)
    }
    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [value, duration, reduceMotion])

  return (
    <div className="text-3xl font-bold mt-3">
      {prefix}{display.toLocaleString()}{suffix}
    </div>
  )
}
