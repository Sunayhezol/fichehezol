export const config = { runtime: 'edge' };

function getIdFromUrl(req) {
  const u = new URL(req.url);
  const parts = u.pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || 'default');
}

async function kvGet(key) {
  const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
  });
  const j = await r.json();
  try { return JSON.parse(j.result); } catch { return j.result; }
}

async function kvSet(key, val) {
  const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(val)
  });
}

export default async function handler(req) {
  try {
    const id = getIdFromUrl(req);
    const key = `sheet:${id}`;

    if (req.method === 'GET') {
      const data = await kvGet(key);
      return new Response(JSON.stringify({ ok: true, data }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    if (req.method === 'PUT') {
      const b = await req.json();
      const now = Date.now(); // horodatage serveur
      await kvSet(key, { payload: b.payload, updatedAt: now });
      return new Response(JSON.stringify({ ok: true, updatedAt: now }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method Not Allowed', { status: 405 });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
