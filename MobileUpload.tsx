import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export const MobileUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // ดึง sessionId จาก URL (เช่น ?id=xxxx)
  const query = new URLSearchParams(window.location.search);
  const sessionId = query.get('id');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      // ✅ สร้าง URL ชั่วคราวมาโชว์รูป ไม่ให้รูปหาย
      setPreviewUrl(URL.createObjectURL(file));
      setStatus('idle');
    }
  };

// ใน MobileUpload.tsx
const handleUpload = async () => {
  // ... (โค้ดแปลงไฟล์)
  const { error } = await supabase
    .from('motorcycles')
    .update({ image_url: base64data })
    .eq('id', sessionId);

  if (!error) {
    // พอมือถือ Update สำเร็จปุ๊บ... 
    // ตัว 'postgres_changes' ในคอมพิวเตอร์จะทำงานทันที!
    setStatus('success');
  }
};
  
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-green-600 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="text-7xl mb-4">✅</div>
        <h1 className="text-4xl font-black mb-2">ส่งรูปเรียบร้อย!</h1>
        <p className="text-xl opacity-90">คุณสามารถปิดหน้านี้ได้เลยครับ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-600 p-6 flex flex-col items-center justify-center text-white font-sans">
      <div className="bg-white px-4 py-1 rounded-lg mb-4">
        <span className="text-blue-600 font-black text-2xl">ตงมอเตอร์</span>
      </div>
      
      <h2 className="text-2xl font-bold mb-8 text-center">ถ่ายรูปมอเตอร์ไซค์</h2>

      {/* กรอบแสดงรูป */}
      <div className="w-full max-w-sm aspect-square bg-white rounded-[40px] shadow-2xl border-8 border-white/20 overflow-hidden relative flex flex-col items-center justify-center text-slate-400">
        {previewUrl ? (
          <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-7xl mb-2">📸</span>
            <p className="font-bold">กดตรงนี้เพื่อถ่ายรูป</p>
          </div>
        )}
        
        {/* Input สำหรับกดเลือกรูป/ถ่ายรูป */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" // บังคับเปิดกล้องหลังทันที
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {/* ✅ ปุ่มกดยืนยัน (จะโผล่มาเมื่อเลือกรูปแล้ว) */}
      {previewUrl && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`mt-10 w-full max-w-sm py-5 rounded-full text-2xl font-black shadow-xl transition-all active:scale-90 ${
            uploading ? 'bg-slate-400' : 'bg-yellow-400 text-blue-900'
          }`}
        >
          {uploading ? 'กำลังส่งข้อมูล...' : 'กดเพื่อส่งรูปเข้าคอม ✅'}
        </button>
      )}

      {previewUrl && (
        <button 
          onClick={() => { setPreviewUrl(null); setImage(null); }}
          className="mt-4 text-white/70 font-bold underline"
        >
          ถ่ายใหม่
        </button>
      )}

      <p className="mt-8 text-xs opacity-50">Session: {sessionId}</p>
    </div>
  );
};
