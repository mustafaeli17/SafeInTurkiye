import {useMemo, useState, useSyncExternalStore} from 'react';
import {readPlan, type DayStop, type PlanCity} from './plan';

const changeEvent = 'safeinturkiye:day-plan';
const storageKey = (city: PlanCity) => 'sit:day-plan:v1:' + city;
function subscribe(notify: () => void) {
  window.addEventListener(changeEvent, notify);
  window.addEventListener('storage', notify);
  return () => {
    window.removeEventListener(changeEvent, notify);
    window.removeEventListener('storage', notify);
  };
}
function readRaw(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
export type PlanEdit = (current: DayStop[]) => DayStop[];

export async function editDayPlan(city: PlanCity, edit: PlanEdit) {
  const key = storageKey(city);
  function write() {
    const current = readPlan(window.localStorage.getItem(key), city);
    const next = edit(current);
    if (next.length) window.localStorage.setItem(key, JSON.stringify(next));
    else window.localStorage.removeItem(key);
    window.dispatchEvent(new Event(changeEvent));
  }
  // Serialize changes from different tabs when the browser supports Web Locks.
  if (window.navigator.locks) await window.navigator.locks.request(key, write);
  else write();
}

export function useDayPlan(city: PlanCity) {
  const raw = useSyncExternalStore(subscribe, () => readRaw(storageKey(city)), () => null);
  const stops = useMemo(() => readPlan(raw, city), [raw, city]);
  const [saveFailed, setSaveFailed] = useState(false);
  async function update(edit: PlanEdit) {
    try {
      await editDayPlan(city, edit);
      setSaveFailed(false);
      return true;
    } catch {
      setSaveFailed(true);
      return false;
    }
  }
  return {stops, update, saveFailed};
}
