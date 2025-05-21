import React, { useRef, useState, useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function Results2social() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [spiele, setSpiele] = useState([]);
  const canvasRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hier Ergebnisse einfügen...</p>',
    onUpdate: ({ editor }) => {
      setText(editor.getHTML());
    },
  });

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
    fetch('https://www.basketball-bund.net/rest/club/id/5156/actualmatches?justHome=false&rangeDays=8')
      .then((res) => res.json())
      .then((data) => {
        setSpiele(data);

        const spieleText = data.map((spiel) => {
          const datum = new Date(spiel.spielDate).toLocaleDateString();
          return `${datum}: ${spiel.vereinHeim} ${spiel.punkteHeim} - ${spiel.punkteGast} ${spiel.vereinGast}`;
        }).join('<br>');

        if (editor) {
          editor.commands.setContent(`<p>${spieleText}</p>`);
        }
      });
  }, [editor]);

  return (
    <div className="p-4 grid gap-4">
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <EditorContent editor={editor} className="border p-2 rounded bg-white text-black" />
      <button onClick={drawImageWithText} className="bg-blue-500 text-white px-4 py-2 rounded">Vorschau generieren</button>
      <button onClick={downloadImage} className="bg-green-500 text-white px-4 py-2 rounded">Bild herunterladen</button>
      <canvas ref={canvasRef} className="border rounded shadow" />
    </div>
  );
}
