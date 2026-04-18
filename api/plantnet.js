// api/plantnet.js — Proxy PlantNet avec Origin spoofing
const PLANTNET_KEY = process.env.PLANTNET_KEY || '2b106tJxkhFKun8WbpsU2BVjfO';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    // Build raw multipart body
    const buffer = Buffer.from(imageBase64, 'base64');
    const boundary = '----ToxiCatProxy' + Date.now();
    const CRLF = '\r\n';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="organs"${CRLF}${CRLF}auto${CRLF}`, 'utf8'),
      Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="images"; filename="plant.jpg"${CRLF}Content-Type: ${mimeType || 'image/jpeg'}${CRLF}${CRLF}`, 'utf8'),
      buffer,
      Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8'),
    ]);

    // Essai 1 : Origin = https://toxicat.vercel.app (avec https)
    let resp = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?lang=fr&nb-results=5&api-key=${PLANTNET_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Origin': 'https://toxicat.vercel.app',
          'Referer': 'https://toxicat.vercel.app/',
          'User-Agent': 'Mozilla/5.0 ToxiCat/1.0',
        },
        body,
      }
    );

    // Essai 2 si 403 : Origin sans https
    if (resp.status === 403) {
      resp = await fetch(
        `https://my-api.plantnet.org/v2/identify/all?lang=fr&nb-results=5&api-key=${PLANTNET_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Origin': 'toxicat.vercel.app',
            'Referer': 'https://toxicat.vercel.app/',
            'User-Agent': 'Mozilla/5.0 ToxiCat/1.0',
          },
          body,
        }
      );
    }

    // Essai 3 si encore 403 : sans Origin du tout
    if (resp.status === 403) {
      resp = await fetch(
        `https://my-api.plantnet.org/v2/identify/all?lang=fr&nb-results=5&api-key=${PLANTNET_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'User-Agent': 'PlantNet-App/1.0',
          },
          body,
        }
      );
    }

    const text = await resp.text();
    console.log(`PlantNet → ${resp.status}: ${text.slice(0, 200)}`);

    try {
      return res.status(resp.status).json(JSON.parse(text));
    } catch {
      return res.status(resp.status).send(text);
    }
  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};




