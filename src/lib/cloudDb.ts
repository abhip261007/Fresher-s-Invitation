/**
 * Cloud & Local Resilient Database Client for Saarthi 2026
 * 
 * Provides instant, zero-downtime registration for CAIT Freshers Party.
 * Works anytime, anywhere, on any device (Vercel, local dev, mobile, desktop).
 */

export interface JuniorRecord {
  id: number;
  enrollment_no: string;
  full_name: string;
  dob: string;
  created_at: string;
}

export const MIN_ENROLLMENT = 3060826001;
export const MAX_ENROLLMENT = 3060826063;

const CLOUD_OBJECT_ID = "ff808181a09d98f701a198731b8a01cf";
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;
const LOCAL_STORAGE_KEY = "saarthi_2026_registered_juniors";
const LOCAL_STATS_KEY = "saarthi_2026_registration_count";

export function isValidEnrollment(enrollmentNo: string): boolean {
  if (!enrollmentNo || typeof enrollmentNo !== "string") return false;
  const trimmed = enrollmentNo.trim();
  if (!/^\d{10}$/.test(trimmed)) return false;
  const num = Number(trimmed);
  return num >= MIN_ENROLLMENT && num <= MAX_ENROLLMENT;
}

/**
 * Helper to read juniors cached in localStorage
 */
export function getLocalCachedJuniors(): JuniorRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Helper to save juniors to localStorage cache
 */
export function saveLocalCachedJuniors(juniors: JuniorRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(juniors));
    localStorage.setItem(LOCAL_STATS_KEY, String(juniors.length));
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

/**
 * Merge and deduplicate two lists of juniors by enrollment_no
 */
function mergeJuniors(primary: JuniorRecord[], secondary: JuniorRecord[]): JuniorRecord[] {
  const map = new Map<string, JuniorRecord>();

  for (const j of secondary) {
    if (j && j.enrollment_no) {
      map.set(j.enrollment_no.trim(), j);
    }
  }

  for (const j of primary) {
    if (j && j.enrollment_no) {
      map.set(j.enrollment_no.trim(), j);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Fetch all juniors from cloud database with automatic fallback to localStorage
 */
export async function getJuniors(searchQuery = ""): Promise<{
  success: boolean;
  total: number;
  juniors: JuniorRecord[];
}> {
  let cloudJuniors: JuniorRecord[] = [];
  const localJuniors = getLocalCachedJuniors();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(CLOUD_API_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const doc = await res.json();
      if (doc && doc.data && Array.isArray(doc.data.juniors)) {
        cloudJuniors = doc.data.juniors;
      }
    }
  } catch (err) {
    console.warn("Cloud DB fetch warning, using local cache:", err);
  }

  const merged = mergeJuniors(cloudJuniors, localJuniors);
  saveLocalCachedJuniors(merged);

  let filtered = merged;
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = merged.filter(
      (j) =>
        (j.enrollment_no && j.enrollment_no.toLowerCase().includes(q)) ||
        (j.full_name && j.full_name.toLowerCase().includes(q)) ||
        (j.dob && j.dob.toLowerCase().includes(q))
    );
  }

  return {
    success: true,
    total: merged.length,
    juniors: filtered,
  };
}

/**
 * Get registration statistics count
 */
export async function getStats(): Promise<{ success: boolean; total: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(CLOUD_API_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const doc = await res.json();
      const count = doc?.data?.count ?? (Array.isArray(doc?.data?.juniors) ? doc.data.juniors.length : 0);
      return { success: true, total: count };
    }
  } catch (err) {
    // Fall back to local count
  }

  const local = getLocalCachedJuniors();
  return { success: true, total: local.length };
}

/**
 * Register a junior student instantly
 */
export async function registerJunior(
  enrollmentNo: string,
  fullName: string,
  dob: string
): Promise<{
  success: boolean;
  duplicate?: boolean;
  invalidEnrollment?: boolean;
  error?: string;
  message?: string;
  junior?: JuniorRecord;
}> {
  const cleanEnroll = (enrollmentNo || "").trim();
  const cleanName = (fullName || "").trim();
  const cleanDob = (dob || "").trim();

  // Validate enrollment number
  if (!isValidEnrollment(cleanEnroll)) {
    return {
      success: false,
      invalidEnrollment: true,
      error: "Invalid enrollment number",
    };
  }

  if (!cleanName || cleanName.length < 2) {
    return {
      success: false,
      error: "Full Name is required and must be at least 2 characters.",
    };
  }

  if (!cleanDob || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) {
    return {
      success: false,
      error: "Valid Date of Birth (YYYY-MM-DD) is required.",
    };
  }

  // Fetch current registered juniors to check duplicate
  const current = await getJuniors();
  const existing = current.juniors.find(
    (j) => j.enrollment_no && j.enrollment_no.trim() === cleanEnroll
  );

  if (existing) {
    return {
      success: false,
      duplicate: true,
      error: "Already registered",
      junior: existing,
    };
  }

  // Create new junior record
  const maxId = current.juniors.reduce((max, j) => Math.max(max, Number(j.id) || 0), 0);
  const newJunior: JuniorRecord = {
    id: maxId + 1,
    enrollment_no: cleanEnroll,
    full_name: cleanName,
    dob: cleanDob,
    created_at: new Date().toISOString(),
  };

  const updatedJuniors = [newJunior, ...current.juniors];

  // Save to localStorage immediately so student is registered on their client
  saveLocalCachedJuniors(updatedJuniors);

  // Sync with cloud store
  try {
    await fetch(CLOUD_API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Saarthi 2026 Juniors Database",
        data: {
          count: updatedJuniors.length,
          juniors: updatedJuniors,
        },
      }),
    });
  } catch (err) {
    console.warn("Cloud DB sync deferred (stored in client cache):", err);
  }

  // Also notify local Vite dev/preview server if running (best effort)
  try {
    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentNo: cleanEnroll,
        fullName: cleanName,
        dob: cleanDob,
      }),
    }).catch(() => {});
  } catch {
    // Ignore in production
  }

  return {
    success: true,
    message: "Registration successful! Welcome to Saarthi 2026.",
    junior: newJunior,
  };
}

/**
 * Delete a junior record (Council Admin only)
 */
export async function deleteJunior(id: number): Promise<{ success: boolean; error?: string }> {
  const current = await getJuniors();
  const updated = current.juniors.filter((j) => Number(j.id) !== Number(id));

  saveLocalCachedJuniors(updated);

  try {
    await fetch(CLOUD_API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Saarthi 2026 Juniors Database",
        data: {
          count: updated.length,
          juniors: updated,
        },
      }),
    });
  } catch (err) {
    console.warn("Failed to delete from cloud DB:", err);
  }

  // Best effort for local dev server
  try {
    fetch(`/api/juniors/${id}`, { method: "DELETE" }).catch(() => {});
  } catch {
    // Ignore
  }

  return { success: true };
}

/**
 * Generate CSV text for registered juniors
 */
export async function exportJuniorsCSV(): Promise<string> {
  const { juniors } = await getJuniors();
  const headers = ["ID", "Enrollment Number", "Full Name", "Date of Birth", "Registered At (UTC)"];
  const lines = [headers.join(",")];

  for (const j of juniors) {
    const escapedEnroll = `"${j.enrollment_no || ""}"`;
    const escapedName = `"${(j.full_name || "").replace(/"/g, '""')}"`;
    const escapedDob = `"${j.dob || ""}"`;
    const escapedDate = `"${j.created_at || ""}"`;
    lines.push([j.id, escapedEnroll, escapedName, escapedDob, escapedDate].join(","));
  }

  // Prepend UTF-8 BOM so Excel opens it with proper character encoding
  return "\uFEFF" + lines.join("\r\n");
}

/**
 * Directly trigger CSV download in browser without needing server-side streaming
 */
export async function downloadJuniorsCSV(): Promise<void> {
  const csvContent = await exportJuniorsCSV();
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `saarthi-2026-juniors-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
