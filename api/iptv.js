const BASE = (process.env.IPTV_BASE_URL || "").replace(/\/+$/, "");
const USER = process.env.IPTV_USERNAME || "";
const PASS = process.env.IPTV_PASSWORD || "";

function providerUrl(action, extra = {}) {
  const q = new URLSearchParams({ username: USER, password: PASS, action, ...extra });
  return `${BASE}/player_api.php?${q.toString()}`;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "NEXOR-TV/1.0" } });
  if (!res.ok) throw new Error(`Provider HTTP ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  if (!BASE || !USER || !PASS) {
    return res.status(500).json({ error: "Configure IPTV_BASE_URL, IPTV_USERNAME e IPTV_PASSWORD na Vercel." });
  }

  try {
    const action = req.query.action || "home";

    if (action === "home") {
      const [liveCats, movieCats, seriesCats] = await Promise.all([
        getJson(providerUrl("get_live_categories")),
        getJson(providerUrl("get_vod_categories")),
        getJson(providerUrl("get_series_categories"))
      ]);
      return res.json({
        liveCategories: liveCats,
        movieCategories: movieCats,
        seriesCategories: seriesCats
      });
    }

    const allowed = new Set([
      "get_live_categories", "get_vod_categories", "get_series_categories",
      "get_live_streams", "get_vod_streams", "get_series",
      "get_short_epg", "get_simple_data_table"
    ]);

    if (!allowed.has(action)) return res.status(400).json({ error: "Ação não permitida." });

    const extra = {};
    for (const key of ["category_id", "stream_id", "limit", "start"]) {
      if (req.query[key]) extra[key] = req.query[key];
    }

    const data = await getJson(providerUrl(action, extra));
    return res.json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message || "Falha ao consultar IPTV." });
  }
}