// api/plantnet.js — Proxy Vercel pour Pl@ntNet
const PLANTNET_KEY = '2b106tJxkhFKun8WbpsU2BVjfO';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    // Reconstruct image buffer from base64
    const buffer = Buffer.from(imageBase64, 'base64');
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';

    // Build FormData manually
    const boundary = '----ToxiCatBoundary' + Date.now();
    const CRLF = '\r\n';

    const organPart =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="organs"${CRLF}${CRLF}` +
      `auto${CRLF}`;

    const imageHeader =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="images"; filename="plant.${ext}"${CRLF}` +
      `Content-Type: ${mimeType || 'image/jpeg'}${CRLF}${CRLF}`;

    const closing = `${CRLF}--${boundary}--${CRLF}`;

    const body = Buffer.concat([
      Buffer.from(organPart, 'utf8'),
      Buffer.from(imageHeader, 'utf8'),
      buffer,
      Buffer.from(closing, 'utf8'),
    ]);

    const plantnetResp = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?lang=fr&nb-results=5&api-key=${PLANTNET_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body,
      }
    );

    const data = await plantnetResp.json();
    return res.status(plantnetResp.status).json(data);

  } catch (err) {
    console.error('PlantNet proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}

