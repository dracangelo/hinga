import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

/* Sun while the night theme is on, moon while the day theme is. */
export function ThemeToggle({ className = 'h-10 w-10', size = 19 }) {
  const { isDark, mode, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to the light theme' : 'Switch to the dark theme'}
      title={
        isDark
          ? 'Switch to the light theme'
          : `Switch to the dark theme${mode === 'system' ? ' (currently following your device)' : ''}`
      }
      className={`grid place-items-center rounded-full text-ink-soft transition-colors hover:bg-parchment hover:text-forest ${className}`}
    >
      {isDark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
}

const MODES = [
  { value: 'light', label: 'Light', icon: Sun, hint: 'Cream paper and forest ink.' },
  { value: 'dark', label: 'Dark', icon: Moon, hint: 'Dimmed paper for the evening.' },
  { value: 'system', label: 'System', icon: Monitor, hint: 'Follows this device setting.' },
];

/* Three-way appearance choice: light, dark, or whatever the device uses. */
export function ThemeModePicker({ className = '' }) {
  const { mode, theme, setMode } = useTheme();
  const active = MODES.find((item) => item.value === mode) || MODES[2];

  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label="Appearance"
        className="inline-flex w-full max-w-sm rounded-full border border-sand bg-cream/70 p-1"
      >
        {MODES.map((item) => {
          const selected = item.value === mode;
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(item.value)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
                selected
                  ? 'bg-forest font-medium text-white'
                  : 'text-ink-soft hover:bg-parchment hover:text-forest'
              }`}
            >
              <item.icon size={15} strokeWidth={selected ? 1.9 : 1.7} />
              {item.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-faint">
        {active.hint}
        {mode === 'system' && (
          <span className="text-ink-soft">· this device is {theme === 'dark' ? 'dark' : 'light'}</span>
        )}
      </p>
    </div>
  );
}
