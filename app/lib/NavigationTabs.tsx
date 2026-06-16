'use client'
import React from 'react'
import { COLORS, SPACING, NAV_ITEMS } from '@/app/lib/constants'

export const NavigationTabs = ({ currentTab }: { currentTab: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      gap: SPACING.xl,
      padding: SPACING.md,
      backgroundColor: COLORS.darkBg,
      borderBottom: `1px solid ${COLORS.cardBg}`,
      flexWrap: 'wrap',
    }}
  >
    {NAV_ITEMS.map((item) => (
      <a
        key={item.label}
        href={item.href}
        style={{
          color: currentTab === item.label ? COLORS.primary : COLORS.textMuted,
          textDecoration: 'none',
          fontSize: '13px',
          borderBottom:
            currentTab === item.label ? `2px solid ${COLORS.primary}` : 'none',
          paddingBottom: '4px',
        }}
      >
        {item.label}
      </a>
    ))}
  </div>
)
