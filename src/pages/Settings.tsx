import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import {
  downloadBackup,
  exportAll,
  getProfile,
  getSettings,
  importAll,
  updateProfile,
  updateSettings,
} from '../db';
import { useConfirm } from '../context/ConfirmContext';
import {
  disableNotifications,
  enableNotifications,
  notificationSupportHint,
  refreshReminderPayload,
  scheduleForegroundReminder,
} from '../game/notifications';
import { sfx } from '../audio/sfx';
import type { AppSettings, BackupData, ImportMode, Profile } from '../types';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({ newCardsPerDay: 15, requestRetention: 0.9 });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const fileRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setSettings(await getSettings());
    setProfile(await getProfile());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    await updateSettings(settings);
    if (profile) {
      await updateProfile(profile);
      sfx.setMuted(!profile.soundEnabled);
      if (profile.notificationsEnabled) {
        await refreshReminderPayload();
        await scheduleForegroundReminder();
      } else {
        await disableNotifications();
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    const data = await exportAll();
    downloadBackup(data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (importMode === 'overwrite') {
      const ok = await confirm({
        title: 'Overwrite all data?',
        message: 'This will replace ALL stacks, cards, review history, creature, and profile data.',
        confirmLabel: 'Overwrite',
        destructive: true,
      });
      if (!ok) return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      const result = await importAll(data, importMode);
      setImportResult(
        `Imported ${result.stacks} stack(s), ${result.cards} card(s). Skipped ${result.skipped} duplicate(s). Profile included if present.`,
      );
      await load();
    } catch {
      setImportResult('Import failed. Please check the file format.');
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (!profile) return;
    if (enabled) {
      const result = await enableNotifications();
      setNotifMessage(result.message);
      setProfile({ ...profile, notificationsEnabled: result.ok });
    } else {
      await disableNotifications();
      setProfile({ ...profile, notificationsEnabled: false });
      setNotifMessage('Notifications off.');
    }
  };

  if (!profile) {
    return (
      <Layout title="Settings">
        <p className="form__hint">Loading…</p>
      </Layout>
    );
  }

  return (
    <Layout title="Settings">
      <section className="settings-section">
        <h2 className="settings-section__title">Study</h2>
        <label className="form__label">
          New cards per day: {settings.newCardsPerDay}
          <input
            type="range"
            min={1}
            max={50}
            value={settings.newCardsPerDay}
            onChange={(e) =>
              setSettings((s) => ({ ...s, newCardsPerDay: Number(e.target.value) }))
            }
          />
        </label>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Advanced</h2>
        <label className="form__label">
          FSRS desired retention: {Math.round(settings.requestRetention * 100)}%
          <input
            type="range"
            min={70}
            max={97}
            value={Math.round(settings.requestRetention * 100)}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                requestRetention: Number(e.target.value) / 100,
              }))
            }
          />
        </label>
        <p className="form__hint">
          Higher retention means more frequent reviews. Default is 90%.
        </p>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Den preferences</h2>
        <label className="form__label form__label--row">
          <span>Sound effects</span>
          <input
            type="checkbox"
            checked={profile.soundEnabled}
            onChange={(e) => setProfile({ ...profile, soundEnabled: e.target.checked })}
          />
        </label>
        <label className="form__label form__label--row">
          <span>Haptic feedback</span>
          <input
            type="checkbox"
            checked={profile.hapticsEnabled}
            onChange={(e) => setProfile({ ...profile, hapticsEnabled: e.target.checked })}
          />
        </label>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Daily reminder</h2>
        <label className="form__label form__label--row">
          <span>Enable nudge</span>
          <input
            type="checkbox"
            checked={profile.notificationsEnabled}
            onChange={(e) => toggleNotifications(e.target.checked)}
          />
        </label>
        <label className="form__label">
          Reminder hour: {profile.notificationHour}:00
          <input
            type="range"
            min={6}
            max={22}
            value={profile.notificationHour}
            disabled={!profile.notificationsEnabled}
            onChange={(e) =>
              setProfile({ ...profile, notificationHour: Number(e.target.value) })
            }
          />
        </label>
        <label className="form__label form__label--row">
          <span>Adapt to when I usually study</span>
          <input
            type="checkbox"
            checked={profile.adaptiveNotificationTime}
            disabled={!profile.notificationsEnabled}
            onChange={(e) =>
              setProfile({ ...profile, adaptiveNotificationTime: e.target.checked })
            }
          />
        </label>
        <p className="form__hint">{notificationSupportHint()}</p>
        {notifMessage && <p className="form__hint">{notifMessage}</p>}
      </section>

      <button type="button" className="btn btn--primary btn--block" onClick={handleSave}>
        Save settings
      </button>
      {saved && <p className="home__success">Settings saved!</p>}

      <section className="settings-section">
        <h2 className="settings-section__title">Backup & restore</h2>
        <p className="form__hint">
          Export includes stacks, cards, review logs, FSRS settings, creature, and profile (coins, streak, cosmetics).
        </p>
        <button type="button" className="btn btn--secondary btn--block" onClick={handleExport}>
          Export all data (JSON)
        </button>

        <label className="form__label">
          Import mode
          <select
            className="form__input"
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as ImportMode)}
          >
            <option value="merge">Merge (skip duplicates)</option>
            <option value="overwrite">Overwrite all data</option>
          </select>
        </label>

        {importMode === 'overwrite' && (
          <p className="form__hint form__hint--warning">
            Overwrite replaces everything including creature and profile.
          </p>
        )}

        <label className="btn btn--secondary btn--block">
          Import JSON file
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            hidden
          />
        </label>
        {importResult && <p className="form__hint">{importResult}</p>}
      </section>
    </Layout>
  );
}
