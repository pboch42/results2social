// === File: src/Results2social.jsx ===
import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import html2canvas from 'html2canvas';

export default function Results2social() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [spiele, setSpiele] = useState([]);
  const [rangeDays, setRangeDays] = useState(8);
  const [homeOnly, setHomeOnly] = useState(false);
  const [boxPos, setBoxPos] = useState({ x: 20, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Fetch matches
  useEffect(() => {
    fetch(`/api/spiele?justHome=${homeOnly}&rangeDays=${rangeDays}`)
      .then(res => res.json())
      .then(data => {
        if (!data.data || !Array.isArray(data.data.matches)) return;
        const matches = data.data.matches;
        const content = matches.map(spiel => {
          const dateTime = `${spiel.kickoffDate}T${spiel.kickoffTime}`;
          const datum = new Date(dateTime).toLocaleDateString();
          const [heimScore = 0, gastScore = 0] = spiel.result ? spiel.result.split(':').map(n => parseInt(n,10)) : [];
          const heim = spiel.homeTeam?.teamname || 'Heim';
          const gast = spiel.guestTeam?.teamname || 'Gast';
          return `<p>${datum}: <strong>${heim} ${heimScore}</strong> - <strong>${gastScore} ${gast}</strong></p>`;
        }).join('');
        setText(content);
      });
  }, [rangeDays, homeOnly]);

  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Drag handlers
  const onMouseDown = e => { if (!e.target.classList.contains('editable')) return; setIsDragging(true); setDragOffset({ x: e.clientX - boxPos.x, y: e.clientY - boxPos.y }); };
  const onMouseMove = e => { if (!isDragging) return; setBoxPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }); };
  const onMouseUp = () => setIsDragging(false);

  // Generate final image
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
      {/* Controls omitted for brevity */}
      <div className="bg-white p-4 rounded shadow">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {image && (
          <div ref={containerRef} className="relative inline-block mt-4">
            <img src={image} alt="Hintergrund" className="max-w-full" />
            <div
              className="absolute editable"
              style={{ left: boxPos.x, top: boxPos.y, minWidth: '100px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '5px' }}
              onMouseDown={onMouseDown}
            >
              <Editor
                apiKey="p30gy5eeutuee4wn3lu2qhygp2z7mw3ds5xgsc08bji4nokn"
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
      <button onClick={generateImage} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
        Fertiges Bild herunterladen
      </button>
    </div>
  );
}
