import { useEffect, useId, useRef, type KeyboardEvent } from 'react'

interface MenuOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])'

// An accessible menu button (WAI-ARIA menu pattern). The caller owns the open state, so
// sibling menus can share it and opening one closes the other.
export function useMenu({ open, onOpenChange }: MenuOptions) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])

  const close = (returnFocus: boolean) => {
    onOpenChange(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  // Opening moves focus into the menu, so arrow keys work straight away.
  useEffect(() => {
    if (!open) return
    const [first] = items()
    ;(first ?? menuRef.current)?.focus()
  }, [open])

  // A click anywhere outside the menu and its trigger closes it.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      onOpenChange(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, onOpenChange])

  const onMenuKeyDown = (event: KeyboardEvent) => {
    const list = items()
    const current = list.findIndex((item) => item === document.activeElement)
    const focusAt = (index: number) => {
      event.preventDefault()
      list.at(index % list.length)?.focus()
    }
    switch (event.key) {
      case 'ArrowDown':
        focusAt(current + 1)
        break
      case 'ArrowUp':
        focusAt(current <= 0 ? list.length - 1 : current - 1)
        break
      case 'Home':
        focusAt(0)
        break
      case 'End':
        focusAt(list.length - 1)
        break
      case 'Escape':
        event.preventDefault()
        close(true)
        break
      case 'Tab':
        // Tab leaves the menu for the next control, so focus stays where the browser puts it.
        close(false)
        break
    }
  }

  return {
    close,
    triggerProps: {
      ref: triggerRef,
      id: `${id}-trigger`,
      type: 'button' as const,
      'aria-haspopup': 'menu' as const,
      'aria-expanded': open,
      'aria-controls': open ? `${id}-menu` : undefined,
      onClick: () => {
        onOpenChange(!open)
      },
      onKeyDown: (event: KeyboardEvent) => {
        if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
          event.preventDefault()
          onOpenChange(true)
        }
      },
    },
    menuProps: {
      ref: menuRef,
      id: `${id}-menu`,
      role: 'menu' as const,
      'aria-labelledby': `${id}-trigger`,
      tabIndex: -1,
      onKeyDown: onMenuKeyDown,
    },
    itemProps: { role: 'menuitem' as const, tabIndex: -1 },
  }
}
