// === File: src/Results2social.jsx ===
import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import html2canvas from 'html2canvas';

// Lade TinyMCE API Key aus Umgebungsvariablen (Vite)
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;

// Feldoptionen für Editor
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
  const [boxPos, setBoxPos] = useState({ x: 20, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Hilfsfunktion für verschachtelte Felder
  const getValue = (obj, path) => {
    return path.split('.').reduce((o, key) => (o && o[key] != null ? o[key] : ''), obj);
  };

  // Inhalte basierend auf Auswahl generieren
  const buildText = () => {
    const html = matches.map(match => {
      // Datum und Zeit vorbereiten
      const dateTime = `${match.kickoffDate}T${match.kickoffTime}`;
      const datum = new Date(dateTime).toLocaleDateString();
      const time = new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const context = { ...match, datum, time, ligaData: leagueData || {} };
      // Baue Zeile
      const parts = selectedFields.map(field => getValue(context, field));
      return `<p>${parts.join(' • ')}</p>`;
    }).join('');
    setText(html);
  };

  // Fetch matches & leagueData
  useEffect(() => {
    fetch(`/api/spiele?justHome=${homeOnly}&rangeDays=${rangeDays}`)
      .then(res => res.json())
      .then(data => {
        if (!data.data || !Array.isArray(data.data.matches)) return;
        setMatches(data.data.matches);
        setLeagueData(data.data.ligaData);
      })
      .catch(err => console.error('API error:', err));
  }, [rangeDays, homeOnly]);

  // Rebuild text when matches or fields change
  useEffect(() => buildText(), [matches, selectedFields]);

  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Drag handlers
  const onMouseDown = e => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({ x: e.clientX - boxPos.x, y: e.clientY - boxPos.y });
  };
  const onMouseMove = e => {
    if (!isDragging) return;
    setBoxPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };
  const onMouseUp = () => setIsDragging(false);

  // Finales Bild generieren
  const generateImage = () => {
    if (!containerRef.current) return;
    html2canvas(containerRef.current).then(canvas => {
      const link = document.createElement('a');
      link.download = 'ergebnis_poster.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div className="p-4" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      {/* Feld-Auswahl */}
      <div className="mb-4">
        <label className="block mb-1">Felder auswählen (Reihenfolge via Strg+Klick):</label>
        <select
          multiple
          value={selectedFields}
          onChange={e => setSelectedFields([...e.target.selectedOptions].map(o => o.value))}
          className="border p-2 rounded w-full h-24"
        >
          {FIELD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {/* Bild und Editor Overlay */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {image && (
          <div
            ref={containerRef}
            className="relative inline-block mt-4"
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
          >
            <img src={image} alt="Hintergrund" className="max-w-full" />
            <div
              className="absolute"
              style={{ left: boxPos.x, top: boxPos.y, minWidth: '150px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '5px', cursor: 'grab' }}
              onMouseDown={onMouseDown}
            >
              <Editor
                apiKey={TINYMCE_API_KEY}
                inline
                value={text}
                onEditorChange={setText}
                init={{
                  menubar: true,
                  toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px; color:white; }',
                  plugins: ['lists', 'link']
                }}
              />
            </div>
          </div>
        )}
      </div>
      <button onClick={generateImage} className="bg-blue-600 text-white px-4 py-2 rounded">
        Fertiges Bild herunterladen
      </button>
    </div>
  );
}
