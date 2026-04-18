// api/plantnet.js - Proxy PlantNet pour ToxiCat
const PLANTNET_KEY = process.env.PLANTNET_KEY || '2b106tJxkhFKun8WbpsU2BVjfO';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // req.body is auto-parsed JSON by Vercel
    const { imageBase64, mimeType } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'No imageBase64 in request body' });
    }

    // Convert base64 to Buffer then to Blob
    const buffer = Buffer.from(imageBase64, 'base64');
    const blob = new Blob([buffer], { type: mimeType || 'image/jpeg' });

    // Build FormData with native Node 18 API
    const form = new FormData();
    form.append('organs', 'auto');
    form.append('images', blob, 'plant.jpg');

    // Call PlantNet
    const plantnetResp = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?lang=fr&nb-results=5&api-key=${PLANTNET_KEY}`,
      { method: 'POST', body: form }
    );

    const text = await plantnetResp.text();
    console.log('PlantNet status:', plantnetResp.status);
    console.log('PlantNet response:', text.slice(0, 300));

    if (!plantnetResp.ok) {
      return res.status(plantnetResp.status).json({ 
        error: `PlantNet error ${plantnetResp.status}: ${text}` 
      });
    }

    const data = JSON.parse(text);
    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(500).json({ error: `Proxy error: ${err.message}` });
  }
};

