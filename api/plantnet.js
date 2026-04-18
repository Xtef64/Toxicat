// api/plantnet.js — Proxy Vercel → Pl@ntNet (server-to-server, no CORS needed)
// IMPORTANT: "expose my API key" doit être DÉCOCHÉ dans les settings Pl@ntNet

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const PLANTNET_KEY = process.env.PLANTNET_KEY || '2b106tJxkhFKun8WbpsU2BVjfO';

  try {
    // Lire le body brut (multipart/form-data)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] || '';

    // Transférer directement à Pl@ntNet
    const plantnetResp = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?lang=fr&nb-results=5&api-key=${PLANTNET_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': contentType },
        body: rawBody,
      }
    );

    const text = await plantnetResp.text();
    console.log(`PlantNet → ${plantnetResp.status}: ${text.slice(0, 200)}`);

    try {
      const data = JSON.parse(text);
      return res.status(plantnetResp.status).json(data);
    } catch {
      return res.status(plantnetResp.status).send(text);
    }

  } catch (err) {
    console.error('PlantNet proxy error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}


