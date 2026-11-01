const CLOUD_OBJECT_ID = "ff808181a09d98f701a198731b8a01cf";
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const getRes = await fetch(CLOUD_API_URL);
    let juniors = [];
    if (getRes.ok) {
      const doc = await getRes.json();
      if (doc && doc.data && Array.isArray(doc.data.juniors)) {
        juniors = doc.data.juniors;
      }
    }

    const headers = ["ID", "Enrollment Number", "Full Name", "Date of Birth", "Registered At (UTC)"];
    const csvLines = [headers.join(",")];

    for (const j of juniors) {
      const escapedEnroll = `"${j.enrollment_no || ""}"`;
      const escapedName = `"${(j.full_name || "").replace(/"/g, '""')}"`;
      const escapedDob = `"${j.dob || ""}"`;
      const escapedDate = `"${j.created_at || ""}"`;
      csvLines.push([j.id, escapedEnroll, escapedName, escapedDob, escapedDate].join(","));
    }

    const csvContent = "\uFEFF" + csvLines.join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="saarthi-2026-juniors.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to generate CSV" });
  }
}
