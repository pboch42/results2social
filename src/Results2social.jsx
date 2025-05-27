// === File: src/Results2social.jsx ===
import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import html2canvas from 'html2canvas';

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
  const [selectedFields, setSelectedFields] = useState([ 'datum', 'homeTeam.teamnameSmall', 'result', 'guestTeam.teamnameSmall' ]);
  const [rangeDays, setRangeDays] = useState(8);
  const [homeOnly, setHomeOnly] = useState(false);
  const [boxPos, setBoxPos] = useState({ x: 20, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

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
      return `<p>${parts.join(' • ')}</p>`;
    }).join('');
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

  const onMouseDown = e => {
    if (e.target !== e.currentTarget) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - boxPos.x, y: e.clientY - boxPos.y });
  };
  const onMouseMove = e => isDragging && setBoxPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  const onMouseUp = () => setIsDragging(false);

  const generateImage = () => {
    if (!containerRef.current) return;
    html2canvas(containerRef.current).then(canvas => {
      const link = document.createElement('a'); link.download='ergebnis_poster.png'; link.href=canvas.toDataURL(); link.click();
    });
  };

  return (
    <div className="p-4" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      {/* Controls */}
      <div className="mb-4">
        <select multiple value={selectedFields} onChange={e=>setSelectedFields([...e.target.selectedOptions].map(o=>o.value))} className="border p-2 rounded w-full h-24">
          {FIELD_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="bg-white p-4 rounded shadow mb-4">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {image && (
          <div ref={containerRef} className="relative inline-block mt-4">
            <img src={image} alt="Hintergrund" className="max-w-full" />
            <div
              onMouseDown={onMouseDown}
              className="absolute border-dashed border-2 border-white"
              style={{ left: boxPos.x, top: boxPos.y, minWidth:150, minHeight:100, background:'transparent', cursor:isDragging?'grabbing':'grab' }}
            >
              <Editor
                apiKey={TINYMCE_API_KEY}
                inline value={text} onEditorChange={setText}
                init={{ menubar:true, toolbar:'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist', plugins:['lists','link'], content_style:'body{color:#fff;background:transparent;font-size:16px;}' }}
              />
            </div>
          </div>
        )}
      </div>
      <button onClick={generateImage} className="bg-blue-600 text-white px-4 py-2 rounded">Fertiges Bild herunterladen</button>
    </div>
  );
}
