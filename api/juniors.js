const CLOUD_OBJECT_ID = "ff808181a09d98f701a198731b8a01cf";
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // DELETE /api/juniors/:id or with query id
  if (req.method === "DELETE") {
    try {
      const { id } = req.query || {};
      const targetId = Number(id);

      const getRes = await fetch(CLOUD_API_URL);
      if (!getRes.ok) throw new Error("Could not fetch database");
      const doc = await getRes.json();
      let juniors = (doc.data && doc.data.juniors) || [];

      juniors = juniors.filter((j) => Number(j.id) !== targetId);

      await fetch(CLOUD_API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Saarthi 2026 Juniors Database",
          data: {
            count: juniors.length,
            juniors,
          },
        }),
      });

      return res.status(200).json({ success: true, message: `Junior ${id} deleted` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/juniors
  if (req.method === "GET") {
    try {
      const q = (req.query?.q || "").trim().toLowerCase();
      const getRes = await fetch(CLOUD_API_URL);
      if (!getRes.ok) throw new Error("Could not fetch database");
      const doc = await getRes.json();
      let juniors = (doc.data && doc.data.juniors) || [];

      if (q) {
        juniors = juniors.filter(
          (j) =>
            (j.enrollment_no && j.enrollment_no.toLowerCase().includes(q)) ||
            (j.full_name && j.full_name.toLowerCase().includes(q)) ||
            (j.dob && j.dob.toLowerCase().includes(q))
        );
      }

      return res.status(200).json({
        success: true,
        total: juniors.length,
        juniors,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
