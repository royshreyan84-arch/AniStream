import { useState } from 'react'

export const useToggleState = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState)
  const toggle = () => setIsOpen((prev) => !prev)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)
  return { isOpen, toggle, close, open }
}

export const useExclusiveToggle = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const toggleMenu = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName)
  }

  const closeAll = () => {
    setActiveMenu(null)
  }

  const isOpen = (menuName: string) => activeMenu === menuName

  return { activeMenu, toggleMenu, closeAll, isOpen }
}
