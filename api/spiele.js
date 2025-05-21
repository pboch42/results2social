export default async function handler(req, res) {
  const url = 'https://www.basketball-bund.net/rest/club/id/466/actualmatches?justHome=false&rangeDays=30';
  try {
    const response = await fetch(url);
    const payload = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: 'Fehler beim Laden der Spieldaten' });
  }
}
