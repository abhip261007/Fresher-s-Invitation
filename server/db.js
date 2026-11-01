import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "freshers.db");
const db = new DatabaseSync(dbPath);

// Initialize juniors table with proper indexes and unique enrollment_no
db.exec(`
  CREATE TABLE IF NOT EXISTS juniors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_no TEXT UNIQUE,
    full_name TEXT NOT NULL,
    dob TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_juniors_name ON juniors(full_name);
  CREATE INDEX IF NOT EXISTS idx_juniors_created ON juniors(created_at);
`);

// Auto-migrate in case the table already existed without enrollment_no
try {
  db.exec(`ALTER TABLE juniors ADD COLUMN enrollment_no TEXT;`);
} catch (e) {
  // Column already exists or already created
}

try {
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_juniors_enrollment ON juniors(enrollment_no);`);
} catch (e) {
  // Index already exists
}

// Enrollment range constraints: 3060826001 to 3060826063
export const MIN_ENROLLMENT = 3060826001;
export const MAX_ENROLLMENT = 3060826063;

export function isValidEnrollment(enrollmentNo) {
  if (!enrollmentNo || typeof enrollmentNo !== "string") return false;
  const trimmed = enrollmentNo.trim();
  if (!/^\d{10}$/.test(trimmed)) return false;
  const num = Number(trimmed);
  return num >= MIN_ENROLLMENT && num <= MAX_ENROLLMENT;
}

/**
 * Register a new junior in the SQLite database
 */
export function addJunior(enrollmentNo, fullName, dob) {
  const trimmedEnrollment = (enrollmentNo || "").trim();
  const trimmedName = (fullName || "").trim();
  const trimmedDob = (dob || "").trim();

  // Validate enrollment range: 3060826001 to 3060826063
  if (!isValidEnrollment(trimmedEnrollment)) {
    return {
      success: false,
      invalidEnrollment: true,
      message: "Invalid enrollment number",
    };
  }

  // Check if enrollment number is already registered (must be unique)
  const existingEnrollment = db
    .prepare(
      "SELECT id, enrollment_no, full_name, dob, created_at FROM juniors WHERE enrollment_no = ?"
    )
    .get(trimmedEnrollment);

  if (existingEnrollment) {
    return {
      success: false,
      duplicate: true,
      junior: existingEnrollment,
      message: "Already registered",
    };
  }

  const stmt = db.prepare(
    "INSERT INTO juniors (enrollment_no, full_name, dob) VALUES (?, ?, ?) RETURNING id, enrollment_no, full_name, dob, created_at"
  );
  const result = stmt.get(trimmedEnrollment, trimmedName, trimmedDob);

  return {
    success: true,
    junior: result,
  };
}

/**
 * Get all registered juniors sorted by newest first
 */
export function getAllJuniors(searchQuery = "") {
  if (searchQuery && searchQuery.trim()) {
    const q = `%${searchQuery.trim()}%`;
    return db
      .prepare(
        "SELECT id, enrollment_no, full_name, dob, created_at FROM juniors WHERE enrollment_no LIKE ? OR full_name LIKE ? OR dob LIKE ? ORDER BY id DESC"
      )
      .all(q, q, q);
  }

  return db
    .prepare(
      "SELECT id, enrollment_no, full_name, dob, created_at FROM juniors ORDER BY id DESC"
    )
    .all();
}

/**
 * Delete a junior entry by ID (for admin management)
 */
export function deleteJunior(id) {
  const stmt = db.prepare("DELETE FROM juniors WHERE id = ?");
  stmt.run(Number(id));
  return { success: true };
}

/**
 * Get registration statistics
 */
export function getStats() {
  const countRow = db.prepare("SELECT COUNT(*) as total FROM juniors").get();
  return {
    total: countRow ? countRow.total : 0,
  };
}

/**
 * Export juniors to CSV format
 */
export function exportJuniorsCSV() {
  const rows = getAllJuniors();
  const headers = [
    "ID",
    "Enrollment Number",
    "Full Name",
    "Date of Birth",
    "Registered At (UTC)",
  ];
  const csvLines = [headers.join(",")];

  for (const row of rows) {
    const escapedEnrollment = `"${row.enrollment_no || ""}"`;
    const escapedName = `"${(row.full_name || "").replace(/"/g, '""')}"`;
    const escapedDob = `"${row.dob || ""}"`;
    const escapedDate = `"${row.created_at || ""}"`;
    csvLines.push(
      [row.id, escapedEnrollment, escapedName, escapedDob, escapedDate].join(",")
    );
  }

  return csvLines.join("\r\n");
}

export default {
  MIN_ENROLLMENT,
  MAX_ENROLLMENT,
  isValidEnrollment,
  addJunior,
  getAllJuniors,
  deleteJunior,
  getStats,
  exportJuniorsCSV,
};
