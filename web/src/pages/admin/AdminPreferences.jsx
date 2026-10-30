import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { ThemeModePicker } from '../../components/ThemeToggle.jsx';

export function AdminPreferences() {
  const { mode, theme } = useTheme();
  // While following the device, show whichever side it is on.
  const Preview = theme === 'dark' ? Moon : Sun;

  return (
    <div className="max-w-3xl space-y-5">
      <section className="card p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Appearance</p>
            <h2 className="mt-2 font-display text-2xl text-ink">How the studio looks</h2>
            <p className="mt-1.5 max-w-md text-sm text-ink-soft">
              Applies to the admin panel and the storefront in this browser. Staff on other machines
              keep their own choice.
            </p>
          </div>
          <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-sand bg-parchment text-forest sm:grid">
            <Preview size={19} strokeWidth={1.6} />
          </span>
        </div>

        <ThemeModePicker className="mt-6" />

        <dl className="mt-6 grid gap-3 border-t border-sand/70 pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-faint">Chosen</dt>
            <dd className="mt-1 capitalize text-ink">
              {mode === 'system' ? 'Follow the device' : mode}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-faint">Showing now</dt>
            <dd className="mt-1 flex items-center gap-1.5 capitalize text-ink">
              <Monitor size={13} className="text-ink-faint" />
              {theme} theme
            </dd>
          </div>
        </dl>
      </section>

      <p className="px-1 text-xs text-ink-faint">
        Signing in on another browser starts from that device's own setting — nothing is saved to
        your admin account.
      </p>
    </div>
  );
}
