import {
  addJunior,
  getAllJuniors,
  deleteJunior,
  getStats,
  exportJuniorsCSV,
  isValidEnrollment,
} from "./db.js";

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        // 1MB limit protection
        req.connection.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(payload));
}

export async function handleApiRequest(req, res, next) {
  const host = req.headers.host || "localhost";
  const reqUrl = new URL(req.url, `http://${host}`);
  const pathname = reqUrl.pathname;

  // Handle CORS preflight
  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  // 1. POST /api/register - Add new junior
  if (pathname === "/api/register" && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      const { enrollmentNo, fullName, dob } = body;

      // Validate Enrollment Number (range 3060826001 to 3060826063)
      if (!isValidEnrollment(enrollmentNo)) {
        return sendJson(res, 400, {
          success: false,
          error: "Invalid enrollment number",
        });
      }

      if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
        return sendJson(res, 400, {
          success: false,
          error: "Full Name is required and must be at least 2 characters.",
        });
      }

      if (!dob || typeof dob !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) {
        return sendJson(res, 400, {
          success: false,
          error: "Valid Date of Birth (YYYY-MM-DD) is required.",
        });
      }

      const result = addJunior(enrollmentNo, fullName, dob);

      if (result.success) {
        // Sync to cloud database
        fetch("https://api.restful-api.dev/objects/ff808181a09d98f701a198731b8a01cf")
          .then((r) => r.json())
          .then((doc) => {
            const list = (doc.data && doc.data.juniors) || [];
            if (!list.some((j) => j.enrollment_no === String(enrollmentNo).trim())) {
              list.unshift(result.junior);
              fetch("https://api.restful-api.dev/objects/ff808181a09d98f701a198731b8a01cf", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: "Saarthi 2026 Juniors Database",
                  data: { count: list.length, juniors: list },
                }),
              }).catch(() => {});
            }
          })
          .catch(() => {});
      }

      if (!result.success && result.duplicate) {
        return sendJson(res, 409, {
          success: false,
          duplicate: true,
          error: "Already registered",
          junior: result.junior,
        });
      }

      if (!result.success && result.invalidEnrollment) {
        return sendJson(res, 400, {
          success: false,
          error: "Invalid enrollment number",
        });
      }

      return sendJson(res, 201, {
        success: true,
        message: "Registration successful! Welcome to Saarthi 2026.",
        junior: result.junior,
      });
    } catch (err) {
      return sendJson(res, 500, {
        success: false,
        error: err.message || "Failed to process registration",
      });
    }
  }

  // 2. GET /api/juniors - List juniors (with optional ?q= search)
  if (pathname === "/api/juniors" && req.method === "GET") {
    try {
      const query = reqUrl.searchParams.get("q") || "";
      const juniors = getAllJuniors(query);
      return sendJson(res, 200, {
        success: true,
        total: juniors.length,
        juniors,
      });
    } catch (err) {
      return sendJson(res, 500, {
        success: false,
        error: err.message || "Failed to fetch juniors",
      });
    }
  }

  // 3. GET /api/juniors/export - Download CSV file for Excel
  if (pathname === "/api/juniors/export" && req.method === "GET") {
    try {
      const csv = exportJuniorsCSV();
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="saarthi-2026-juniors.csv"'
      );
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(csv);
      return;
    } catch (err) {
      return sendJson(res, 500, {
        success: false,
        error: err.message || "Failed to export CSV",
      });
    }
  }

  // 4. DELETE /api/juniors/:id - Delete entry by ID
  const deleteMatch = pathname.match(/^\/api\/juniors\/(\d+)$/);
  if (deleteMatch && req.method === "DELETE") {
    try {
      const id = deleteMatch[1];
      deleteJunior(id);
      return sendJson(res, 200, {
        success: true,
        message: `Junior with ID ${id} deleted successfully.`,
      });
    } catch (err) {
      return sendJson(res, 500, {
        success: false,
        error: err.message || "Failed to delete junior",
      });
    }
  }

  // 5. GET /api/stats - Get registration count
  if (pathname === "/api/stats" && req.method === "GET") {
    try {
      const stats = getStats();
      return sendJson(res, 200, {
        success: true,
        ...stats,
      });
    } catch (err) {
      return sendJson(res, 500, {
        success: false,
        error: err.message || "Failed to fetch stats",
      });
    }
  }

  // Fallback to Vite/next middleware if not handled
  if (next) {
    next();
  } else {
    sendJson(res, 404, { success: false, error: "Endpoint not found" });
  }
}
