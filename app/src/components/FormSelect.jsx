import { forwardRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FormSelect = forwardRef(function FormSelect(
  { value, onChange, options = [], style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <select
        ref={ref}
        value={value}
        onChange={onChange}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className="w-full appearance-none rounded-md border pl-3.5 outline-none"
        style={{
          height: 44,
          paddingRight: 36,
          fontSize: 15,
          lineHeight: '20px',
          fontWeight: 400,
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          borderColor: focused ? 'var(--border-focus)' : 'var(--border-default)',
          boxShadow: focused ? '0 0 0 3px var(--accent-brand-soft)' : 'none',
          transition:
            'border-color 160ms var(--ease-soft), box-shadow 160ms var(--ease-soft)',
          ...style,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={1.75}
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: 'var(--text-tertiary)',
        }}
      />
    </div>
  );
});

export default FormSelect;
