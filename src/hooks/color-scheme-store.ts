import { useEffect, useState } from 'react';
import type { ColorSchemeName } from 'react-native';
import { Appearance } from 'react-native';
import { colorScheme as nativeWindColorScheme } from 'react-native-css';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/utils/supabase';

const STORAGE_PREFIX = 'color-scheme-override:';

/** Local overrides are per-account — a shared key would leak one user's theme onto the next. */
function storageKeyFor(userId: string | null) {
  return `${STORAGE_PREFIX}${userId ?? 'anon'}`;
}

let override: ColorSchemeName = null;
let hasStoredPreference = false;
let syncUserId: string | null = null;
let switchToken = 0;
const listeners = new Set<() => void>();

/**
 * iOS/Android frequently don't fire the native `appearanceChanged` event
 * after `Appearance.setColorScheme()`, so `useColorScheme()` (and anything
 * depending on it) silently never updates. We drive the app from our own
 * reactive store instead — `nativeWindColorScheme.set()` updates
 * nativewind's `dark:` styling immediately and doesn't depend on that event
 * — and still call `Appearance.setColorScheme()` as a best-effort nicety
 * for native chrome (status bar, native controls).
 */
function applyOverride(value: ColorSchemeName) {
  override = value;
  nativeWindColorScheme.set(value);
  Appearance.setColorScheme(value);
  listeners.forEach((listener) => listener());
}

function loadStoredPreference(userId: string | null) {
  const token = ++switchToken;
  hasStoredPreference = false;
  return AsyncStorage.getItem(storageKeyFor(userId)).then((value) => {
    // A newer call to setColorSchemeSyncUserId superseded this one — don't
    // clobber whatever it's since loaded/applied.
    if (token !== switchToken) return;
    if (value === 'light' || value === 'dark') {
      hasStoredPreference = true;
      applyOverride(value);
    }
  });
}

let storageLoaded = loadStoredPreference(null);

export function setColorSchemeOverride(value: ColorSchemeName) {
  hasStoredPreference = value !== null;
  applyOverride(value);
  AsyncStorage.setItem(storageKeyFor(syncUserId), value ?? '');

  if (syncUserId) {
    supabase.from('profiles').update({ dark_mode: value === 'dark' }).eq('id', syncUserId);
  }
}

/**
 * Identifies the signed-in user so future overrides are persisted to their
 * profile, and re-scopes the local override lookup to their own stored
 * preference (falling back to the signed-out "anon" one when userId is
 * null) instead of whatever the previously signed-in user last set.
 */
export function setColorSchemeSyncUserId(userId: string | null) {
  syncUserId = userId;
  storageLoaded = loadStoredPreference(userId);
}

/**
 * Seeds the override from a saved profile preference. Only applies if this
 * account doesn't already have a local preference stored, so it doesn't
 * clobber a choice the user just made (e.g. on this screen re-mounting).
 */
export async function seedColorSchemeFromProfile(darkMode: boolean) {
  await storageLoaded;

  if (!hasStoredPreference) {
    hasStoredPreference = true;
    const value = darkMode ? 'dark' : 'light';
    applyOverride(value);
    AsyncStorage.setItem(storageKeyFor(syncUserId), value);
  }
}

export function useColorSchemeOverride() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return override;
}
