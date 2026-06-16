"use client"

import { useEffect, useState } from 'react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        width: '48px',
        height: '48px',
        borderRadius: '9999px',
        border: 'none',
        backgroundColor: '#6c63ff',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer',
        boxShadow: '0 12px 30px rgba(108, 99, 255, 0.25)',
        zIndex: 9999,
      }}
    >
      ↑
    </button>
  )
}
