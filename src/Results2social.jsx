import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

export default function Results2social() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [spiele, setSpiele] = useState([]);
  const canvasRef = useRef(null);

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
      const textLines = textElement.innerText.split('\n');

      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      let y = 40;
      textLines.forEach((line) => {
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

  useEffect(() => {
    fetch('/api/spiele')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data.actualMatches)) {
          console.error('Unerwartetes API-Format:', data);
          return;
        }

        setSpiele(data.actualMatches);

        const spieleText = data.actualMatches.map((spiel) => {
          const datum = new Date(spiel.spielDate).toLocaleDateString();
          return `${datum}: ${spiel.vereinHeim} ${spiel.punkteHeim} - ${spiel.punkteGast} ${spiel.vereinGast}`;
        }).join('<br>');

        setText(`<p>${spieleText}</p>`);
      })
      .catch((err) => console.error('Fehler beim Laden der API:', err));
  }, []);

  return (
    <div className="p-4 grid gap-4">
      <div className="bg-white p-4 rounded shadow">
        <div className="flex flex-col gap-4">
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {typeof window !== 'undefined' && (
            <Editor
              apiKey="p30gy5eeutuee4wn3lu2qhygp2z7mw3ds5xgsc08bji4nokn"
              value={text}
              init={{
                height: 300,
                menubar: false,
                plugins: ['lists', 'link', 'image', 'code'],
                toolbar:
                  'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
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
