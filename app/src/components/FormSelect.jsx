import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function FormSelect({
  value,
  onChange,
  options = [],
  placeholder = '선택',
  label,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e) => {
      if (
        !panelRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = focused || open;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md border pl-3.5 pr-3 outline-none"
        style={{
          height: 44,
          fontSize: 15,
          lineHeight: '20px',
          fontWeight: 400,
          background: 'var(--surface)',
          color: selected ? 'var(--text-primary)' : 'var(--text-tertiary)',
          borderColor: active ? 'var(--border-focus)' : 'var(--border-default)',
          boxShadow: active ? '0 0 0 3px var(--accent-brand-soft)' : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition:
            'border-color 160ms var(--ease-soft), box-shadow 160ms var(--ease-soft)',
        }}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          style={{
            color: 'var(--text-tertiary)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 200ms var(--ease-soft)',
          }}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="listbox"
          className="absolute left-0 right-0 z-40 overflow-hidden rounded-xl"
          style={{
            top: 'calc(100% + 6px)',
            background: 'var(--surface)',
            boxShadow: 'var(--elev-3)',
            border: '1px solid var(--border-subtle)',
            animation: 'dsSelectFade 200ms var(--ease-soft)',
          }}
        >
          {label && (
            <div
              className="t-caption px-4 pb-2 pt-3"
              style={{
                color: 'var(--text-tertiary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {label}
            </div>
          )}
          <ul className="py-1">
            {options.map((o) => {
              const on = o.value === value;
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left t-body2"
                    style={{
                      color: on ? 'var(--text-brand)' : 'var(--text-primary)',
                      fontWeight: on ? 600 : 400,
                      background: 'transparent',
                      transition: 'background 160ms var(--ease-soft)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-layered)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Check
                      size={14}
                      strokeWidth={2.25}
                      style={{
                        color: on ? 'var(--accent-brand)' : 'transparent',
                        flexShrink: 0,
                      }}
                    />
                    <span className="flex-1 truncate">{o.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <style>{`
            @keyframes dsSelectFade {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
