import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { getProfile } from './db';
import { refreshReminderPayload, scheduleForegroundReminder } from './game/notifications';
import { sfx } from './audio/sfx';
import './index.css';

function AppBootstrap() {
  useEffect(() => {
    void (async () => {
      const profile = await getProfile();
      sfx.setMuted(!profile.soundEnabled);
      if (profile.notificationsEnabled) {
        await refreshReminderPayload();
        await scheduleForegroundReminder();
      }
    })();
  }, []);
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppBootstrap />
  </StrictMode>,
);
