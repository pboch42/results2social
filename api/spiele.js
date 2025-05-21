export default async function handler(req, res) {
  const url = 'https://www.basketball-bund.net/rest/club/id/4307/actualmatches?justHome=false&rangeDays=30';

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Spieldaten' });
  }
}
