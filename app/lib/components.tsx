import React from 'react'
import { COLORS, SPACING, RADIUS } from './constants'

export const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <div
    onClick={onChange}
    style={{
      width: '44px',
      height: '24px',
      borderRadius: RADIUS.full,
      backgroundColor: value ? COLORS.primary : COLORS.border,
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.2s',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: '2px',
        left: value ? '22px' : '2px',
        width: '20px',
        height: '20px',
        borderRadius: RADIUS.full,
        backgroundColor: 'white',
        transition: 'left 0.2s',
      }}
    />
  </div>
)

export const InputField = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  style,
}: {
  type?: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  style?: React.CSSProperties
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    style={{
      width: '100%',
      padding: `${SPACING.sm} ${SPACING.md}`,
      backgroundColor: COLORS.dark,
      border: `1px solid ${COLORS.border}`,
      borderRadius: RADIUS.md,
      color: COLORS.text,
      fontSize: '14px',
      boxSizing: 'border-box',
      outline: 'none',
      ...style,
    }}
  />
)

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  style,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  style?: React.CSSProperties
}) => {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: `${SPACING.md}`,
    border: 'none',
    borderRadius: RADIUS.md,
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  }

  const variants = {
    primary: {
      backgroundColor: COLORS.primary,
      color: COLORS.text,
    },
    secondary: {
      backgroundColor: 'transparent',
      border: `1px solid ${COLORS.primary}`,
      color: COLORS.primary,
    },
    danger: {
      backgroundColor: 'transparent',
      border: `1px solid ${COLORS.error}`,
      color: COLORS.error,
    },
  }

  return (
    <button onClick={onClick} style={{ ...baseStyle, ...variants[variant], ...style }}>
      {children}
    </button>
  )
}

export const AnimeCard = ({
  title,
  image,
  onClick,
  style,
}: {
  title: string
  image: string
  onClick?: () => void
  style?: React.CSSProperties
}) => (
  <div
    className="anime-card"
    onClick={onClick}
    style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '18px',
      minHeight: 0,
      ...style,
    }}
  >
    <img src={image} alt={title} className="anime-card__image" />

    <div className="anime-card__gradient">
      <p className="anime-card__title">{title}</p>
    </div>
  </div>
)
