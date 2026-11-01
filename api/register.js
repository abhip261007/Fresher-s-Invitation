const CLOUD_OBJECT_ID = "ff808181a09d98f701a198731b8a01cf";
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;
const MIN_ENROLLMENT = 3060826001;
const MAX_ENROLLMENT = 3060826063;

function isValidEnrollment(enrollmentNo) {
  if (!enrollmentNo || typeof enrollmentNo !== "string") return false;
  const trimmed = enrollmentNo.trim();
  if (!/^\d{10}$/.test(trimmed)) return false;
  const num = Number(trimmed);
  return num >= MIN_ENROLLMENT && num <= MAX_ENROLLMENT;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // ignore
      }
    }
    const { enrollmentNo, fullName, dob } = body || {};

    const cleanEnroll = (enrollmentNo || "").trim();
    const cleanName = (fullName || "").trim();
    const cleanDob = (dob || "").trim();

    if (!isValidEnrollment(cleanEnroll)) {
      return res.status(400).json({
        success: false,
        error: "Invalid enrollment number",
      });
    }

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Full Name is required and must be at least 2 characters.",
      });
    }

    if (!cleanDob || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) {
      return res.status(400).json({
        success: false,
        error: "Valid Date of Birth (YYYY-MM-DD) is required.",
      });
    }

    // Fetch existing records from cloud object
    const getRes = await fetch(CLOUD_API_URL);
    let juniors = [];
    if (getRes.ok) {
      const doc = await getRes.json();
      if (doc && doc.data && Array.isArray(doc.data.juniors)) {
        juniors = doc.data.juniors;
      }
    }

    // Check duplicate enrollment
    const existing = juniors.find(
      (j) => j.enrollment_no && j.enrollment_no.trim() === cleanEnroll
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        duplicate: true,
        error: "Already registered",
        junior: existing,
      });
    }

    const maxId = juniors.reduce((max, j) => Math.max(max, Number(j.id) || 0), 0);
    const newJunior = {
      id: maxId + 1,
      enrollment_no: cleanEnroll,
      full_name: cleanName,
      dob: cleanDob,
      created_at: new Date().toISOString(),
    };

    const updated = [newJunior, ...juniors];

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

    return res.status(201).json({
      success: true,
      message: "Registration successful! Welcome to Saarthi 2026.",
      junior: newJunior,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error during registration",
    });
  }
}
