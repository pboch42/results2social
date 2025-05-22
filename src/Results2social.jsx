// === File: src/Results2social.jsx ===
import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

export default function Results2social() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [spiele, setSpiele] = useState([]);
  const [rangeDays, setRangeDays] = useState(8);
  const [homeOnly, setHomeOnly] = useState(false);
  const canvasRef = useRef(null);

  const fetchSpiele = () => {
    const url = `/api/spiele?justHome=${homeOnly}&rangeDays=${rangeDays}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.data || !Array.isArray(data.data.matches)) {
          console.error('Unerwartetes API-Format:', data);
          return;
        }
        const matches = data.data.matches;
        setSpiele(matches);
        const spieleText = matches
          .map((spiel) => {
            const dateTime = `${spiel.kickoffDate}T${spiel.kickoffTime}`;
            const datum = new Date(dateTime).toLocaleDateString();
            let punkteHeim = 0, punkteGast = 0;
            if (spiel.result) {
              const parts = spiel.result.split(':');
              punkteHeim = parseInt(parts[0], 10) || 0;
              punkteGast = parseInt(parts[1], 10) || 0;
            }
            const heim = spiel.homeTeam?.teamname || 'Heim';
            const gast = spiel.guestTeam?.teamname || 'Gast';
            return `${datum}: ${heim} ${punkteHeim} - ${punkteGast} ${gast}`;
          })
          .join('<br>');
        setText(spieleText);
      })
      .catch((err) => console.error('Fehler beim Laden der API:', err));
  };

  useEffect(() => {
    fetchSpiele();
  }, [rangeDays, homeOnly]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const drawImageWithText = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const textElement = document.createElement('div');
      textElement.innerHTML = text;
      const lines = textElement.innerText.split('\n');
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      let y = 40;
      lines.forEach((line) => {
        ctx.fillText(line, 20, y);
        y += 30;
      });
    };
    img.src = image;
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'ergebnisse.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="p-4 grid gap-4">
      <div className="bg-gray-100 p-4 rounded shadow">
        <label>
          Tage zurück:
          <input
            type="number"
            value={rangeDays}
            min={1}
            max={60}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            className="ml-2 p-1 border rounded w-16"
          />
        </label>
        <label className="ml-4">
          Nur Heimspiele:
          <input
            type="checkbox"
            checked={homeOnly}
            onChange={(e) => setHomeOnly(e.target.checked)}
            className="ml-2"
          />
        </label>
        <button
          onClick={fetchSpiele}
          className="ml-4 bg-yellow-500 text-white px-3 py-1 rounded"
        >
          Aktualisieren
        </button>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <div className="flex flex-col gap-4">
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {typeof window !== 'undefined' && (
            <Editor
              apiKey="p30gy5eeutuee4wn3lu2qhygp2z7mw3ds5xgsc08bji4nokn"
              value={text}
              init={{
                height: 300,
                menubar: true,
                plugins: ['lists', 'link', 'image', 'code'],
                toolbar:
                  'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link',
                content_style:
                  'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
              onEditorChange={(content) => setText(content)}
            />
          )}
          <button onClick={drawImageWithText} className="bg-blue-500 text-white px-4 py-2 rounded">
            Vorschau generieren
          </button>
          <button onClick={downloadImage} className="bg-green-500 text-white px-4 py-2 rounded">
            Bild herunterladen
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="border rounded shadow" />
    </div>
  );
}
