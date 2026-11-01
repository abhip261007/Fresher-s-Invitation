const CLOUD_OBJECT_ID = "ff808181a09d98f701a198731b8a01cf";
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const response = await fetch(CLOUD_API_URL);
    if (response.ok) {
      const doc = await response.json();
      const count = doc?.data?.count ?? (Array.isArray(doc?.data?.juniors) ? doc.data.juniors.length : 0);
      return res.status(200).json({ success: true, total: count });
    }
    return res.status(200).json({ success: true, total: 0 });
  } catch (err) {
    return res.status(200).json({ success: true, total: 0 });
  }
}
