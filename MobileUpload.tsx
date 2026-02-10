import React, { useState } from 'react';
import { supabase } from './lib/supabase';

export const MobileUpload: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const sessionId = new URLSearchParams(window.location.search).get('id');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        const img = new Image();
        img.src = ev.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxW = 800;
          const scale = maxW / img.width;
          canvas.width = maxW;
          canvas.height = img.height * scale;
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          setPreviewUrl(canvas.toDataURL('image/jpeg', 0.6)); // บีบอัด 60%
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const upload = async () => {
    if (!previewUrl || !sessionId) return;
    setUploading(true);
    const { error } = await supabase.from('motorcycles').update({ image_url: previewUrl }).eq('id', sessionId);
    if (!error) setSuccess(true);
    else alert("ส่งไม่สำเร็จ: " + error.message);
    setUploading(false);
  };

  if (success) return <div className="p-10 text-center text-2xl font-bold text-green-600">✅ ส่งรูปสำเร็จ! ปิดหน้านี้ได้เลย</div>;

  return (
    <div className="min-h-screen bg-blue-700 p-6 flex flex-col items-center justify-center text-white">
      <h1 className="text-2xl font-bold mb-6">ถ่ายรูปมอเตอร์ไซค์</h1>
      <div className="w-full aspect-square bg-white rounded-3xl overflow-hidden relative mb-6">
        {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-400">กดเพื่อเปิดกล้อง</div>}
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="absolute inset-0 opacity-0" />
      </div>
      {previewUrl && (
        <button onClick={upload} disabled={uploading} className="w-full bg-yellow-400 text-blue-900 py-4 rounded-full text-xl font-black">
          {uploading ? 'กำลังส่ง...' : 'ยืนยันส่งรูป ✅'}
        </button>
      )}
    </div>
  );
};
