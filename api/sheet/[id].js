export const config = { runtime: 'edge' };

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

export default async function handler(req, ctx) {
  const { id } = ctx.params;
  const key = `sheet:${id}`;

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ ok: true, data: await kvGet(key) }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (req.method === 'PUT') {
    const b = await req.json();
    await kvSet(key, { payload: b.payload, updatedAt: b.updatedAt || Date.now() });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
