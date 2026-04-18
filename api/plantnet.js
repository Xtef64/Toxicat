// api/plantnet.js — Proxy Vercel pour Pl@ntNet (évite les problèmes CORS)
const PLANTNET_KEY = '2b106tJxkhFKun8WbpsU2BVjfO';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Collect raw body chunks
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);

    // Forward to PlantNet with the API key
    const contentType = req.headers['content-type'] || 'multipart/form-data';
    const plantnetResp = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?lang=fr&nb-results=5&api-key=${PLANTNET_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': contentType },
        body: rawBody,
      }
    );

    const data = await plantnetResp.json();
    return res.status(plantnetResp.status).json(data);
  } catch (err) {
    console.error('PlantNet proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
