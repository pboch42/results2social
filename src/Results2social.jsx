// === File: src/Results2social.jsx ===
import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;
const FIELD_OPTIONS = [
  { label: 'Datum', value: 'datum' },
  { label: 'Uhrzeit', value: 'time' },
  { label: 'Heim (Lang)', value: 'homeTeam.teamname' },
  { label: 'Gast (Lang)', value: 'guestTeam.teamname' },
  { label: 'Heim-Kurz', value: 'homeTeam.teamnameSmall' },
  { label: 'Gast-Kurz', value: 'guestTeam.teamnameSmall' },
  { label: 'Ergebnis', value: 'result' },
  { label: 'Liga', value: 'ligaData.liganame' }
];

export default function Results2social() {
  const [image, setImage] = useState(null);
  const [matches, setMatches] = useState([]);
  const [leagueData, setLeagueData] = useState(null);
  const [text, setText] = useState('');
  const [selectedFields, setSelectedFields] = useState([
    'datum',
    'homeTeam.teamnameSmall',
    'result',
    'guestTeam.teamnameSmall'
  ]);
  const [rangeDays, setRangeDays] = useState(8);
  const [homeOnly, setHomeOnly] = useState(false);
  const canvasRef = useRef(null);

  const getValue = (obj, path) => path.split('.').reduce((o, k) => o?.[k] ?? '', obj);

  useEffect(() => {
    fetch(`/api/spiele?justHome=${homeOnly}&rangeDays=${rangeDays}`)
      .then(r => r.json())
      .then(data => {
        const arr = data.data?.matches || [];
        setMatches(arr);
        setLeagueData(data.data?.ligaData || null);
      });
  }, [homeOnly, rangeDays]);

  useEffect(() => {
    const html = matches.map(match => {
      const dt = new Date(`${match.kickoffDate}T${match.kickoffTime}`);
      const context = { ...match, datum: dt.toLocaleDateString(), time: dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), ligaData };
      const parts = selectedFields.map(f => getValue(context, f));
      return parts.join(' • ');
    }).join('\n');
    setText(html);
  }, [matches, selectedFields, leagueData]);

  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setImage(ev.target.result);
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
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      const lines = text.split('\n');
      let y = 40;
      lines.forEach(line => {
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
      {/* Feld-Auswahl */}
      <div className="mb-4">
        <select
          multiple
          value={selectedFields}
          onChange={e => setSelectedFields([...e.target.selectedOptions].map(o => o.value))}
          className="border p-2 rounded w-full h-24"
        >
          {FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Uploader & Editor */}
      <div className="bg-white p-4 rounded shadow">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {image && (
          <div className="flex flex-col gap-4 mt-4">
            <Editor
              apiKey={TINYMCE_API_KEY}
              init={{
                height: 200,
                menubar: true,
                toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist',
                plugins: ['lists', 'link'],
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px; }'
              }}
              value={text}
              onEditorChange={setText}
            />
            <button onClick={drawImageWithText} className="bg-blue-500 text-white px-4 py-2 rounded">
              Vorschau generieren
            </button>
            <button onClick={downloadImage} className="bg-green-500 text-white px-4 py-2 rounded">
              Fertiges Bild herunterladen
            </button>
            <canvas ref={canvasRef} className="border rounded shadow" />
          </div>
        )}
      </div>
    </div>
  );
}
