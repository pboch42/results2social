// === File: src/Results2social.jsx ===
import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

export default function Results2social() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [spiele, setSpiele] = useState([]);
  const [rangeDays, setRangeDays] = useState(8);
  const [homeOnly, setHomeOnly] = useState(false);
  const [boxPos, setBoxPos] = useState({ x: 20, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Fetch matches as before
  const fetchSpiele = () => {
    fetch(`/api/spiele?justHome=${homeOnly}&rangeDays=${rangeDays}`)
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
            let [heimScore = 0, gastScore = 0] = spiel.result ? spiel.result.split(':').map(n => parseInt(n, 10)) : [];
            const heim = spiel.homeTeam?.teamname || 'Heim';
            const gast = spiel.guestTeam?.teamname || 'Gast';
            return `${datum}: ${heim} ${heimScore} - ${gastScore} ${gast}`;
          })
          .join('<br>');
        setText(spieleText);
      })
      .catch((err) => console.error('Fehler beim Laden der API:', err));
  };

  useEffect(() => { fetchSpiele(); }, [rangeDays, homeOnly]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Drawing on canvas with textbox
  const drawImageWithText = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      const lines = text.split(/<br\s*\/?>/i).map(line => line.replace(/<[^>]+>/g, ''));
      let y = boxPos.y;
      lines.forEach(line => {
        ctx.fillText(line, boxPos.x, y);
        y += 30;
      });
    };
    img.src = image;
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = 'ergebnisse.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  // Drag handlers for textbox overlay
  const onMouseDown = e => {
    setIsDragging(true);
    setDragOffset({ x: e.clientX - boxPos.x, y: e.clientY - boxPos.y });
  };
  const onMouseMove = e => {
    if (!isDragging) return;
    setBoxPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };
  const onMouseUp = () => setIsDragging(false);

  return (
    <div className="p-4 grid gap-4" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <div className="bg-gray-100 p-4 rounded shadow flex gap-4 items-center">
        <label>Tage zurück:
          <input type="number" value={rangeDays} min={1} max={60}
            onChange={e => setRangeDays(Number(e.target.value))}
            className="ml-2 p-1 border rounded w-16" />
        </label>
        <label>Nur Heimspiele:
          <input type="checkbox" checked={homeOnly}
            onChange={e => setHomeOnly(e.target.checked)}
            className="ml-2" />
        </label>
        <button onClick={fetchSpiele} className="bg-yellow-500 text-white px-3 py-1 rounded">
          Aktualisieren
        </button>
      </div>
      <div className="bg-white p-4 rounded shadow relative">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {image && (
          <div className="relative mt-4">
            <img src={image} alt="Hintergrund" className="max-w-full" />
            <div
              className="absolute bg-black bg-opacity-50 text-white p-2 cursor-move"
              style={{ left: boxPos.x, top: boxPos.y }}
              onMouseDown={onMouseDown}
            >
              <Editor
                apiKey="DEIN_API_KEY"
                value={text}
                init={{ toolbar: false, menubar: false, readonly: true }}
              />
            </div>
          </div>
        )}
      </div>
      <button onClick={drawImageWithText} className="bg-blue-500 text-white px-4 py-2 rounded">
        Bild mit Text generieren
      </button>
      <button onClick={downloadImage} className="bg-green-500 text-white px-4 py-2 rounded">
        Bild herunterladen
      </button>
      <canvas ref={canvasRef} className="border rounded shadow mt-4" />
    </div>
  );
}
