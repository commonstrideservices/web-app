'use client'

import { domAnimation, LazyMotion, useReducedMotion } from 'motion/react'
import { div as MotionDiv } from 'motion/react-m'

export function SiteMotion({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation} strict>{children}</LazyMotion>
}

const ease = [0.22, 1, 0.36, 1] as const
const viewport = { once: true, amount: 0.2 }

export function Reveal({ children, className, delay = 0, trigger = 'view', image = false }: {
  children: React.ReactNode
  className?: string
  delay?: number
  trigger?: 'load' | 'view'
  image?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const start = image ? { opacity: 0.88, y: 14, scale: 1.035 } : { opacity: 0.85, y: 18 }
  const end = image ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0 }

  return (
    <MotionDiv
      className={className ? `site-reveal ${className}` : 'site-reveal'}
      initial={reduceMotion ? false : start}
      animate={reduceMotion || trigger === 'load' ? end : undefined}
      whileInView={!reduceMotion && trigger === 'view' ? end : undefined}
      viewport={viewport}
      transition={reduceMotion ? { duration: 0 } : { duration: image ? 0.68 : 0.48, delay, ease }}
    >
      {children}
    </MotionDiv>
  )
}
