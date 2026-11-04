import { ConfigForm, closeSettings, type ConfigFormHandle } from '@bridgething/client/form';
import { settings, type SettingsContext } from '@bridgething/client/settings';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function Settings() {
  const form = useRef<ConfigFormHandle>(null);
  const [ctx, setCtx] = useState<SettingsContext | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    settings.context().then(setCtx, (err: unknown) => setStatus(errText(err)));
    return settings.onRefresh(setCtx);
  }, []);

  async function close() {
    try {
      await closeSettings(form.current);
    } catch (err) {
      setStatus(errText(err));
    }
  }

  return (
    <main>
      <h1>Dash Weather settings</h1>
      <p className="hint">{ctx ? `version ${ctx.version}` : 'connecting to the phone app...'}</p>

      <section className="help">
        <h2>Controls</h2>
        <ul>
          <li>Buttons 1 to 4: Hourly, Today, Map, 5-Day</li>
          <li>Small recessed button: Sky &amp; Sea (tides, sun, moon, air quality)</li>
          <li>Dial: zooms the Map screen</li>
        </ul>
      </section>

      <ConfigForm ref={form} />

      <div className="row">
        <button type="button" onClick={close}>
          Done
        </button>
      </div>

      <p className="status">{status}</p>

      <section className="credits">
        <h2>Data sources</h2>
        <p>
          Forecast and air quality: <a href="https://open-meteo.com/">Open-Meteo.com</a> (air quality from Copernicus CAMS). Tides:
          NOAA CO-OPS. Radar: <a href="https://www.rainviewer.com/">RainViewer</a>. Map: OpenStreetMap contributors. Sun and moon are
          worked out on the device.
        </p>
      </section>
    </main>
  );
}

function errText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

createRoot(document.getElementById('root')!).render(<Settings />);
