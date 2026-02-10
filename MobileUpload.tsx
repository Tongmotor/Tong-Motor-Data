import React, { useState } from 'react';
import { supabase } from './lib/supabase';

export const MobileUpload: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // ดึง sessionId จาก URL (เช่น ?id=xxxx)
  const query = new URLSearchParams(window.location.search);
  const sessionId = query.get('id');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // บีบความกว้าง
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // ✅ บีบอัดเหลือ 0.6 (60%) เพื่อให้ Realtime ส่งข้อมูลผ่านได้เสถียร
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); 
          setPreviewUrl(compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    // ✅ ใช้ previewUrl ที่บีบอัดแล้วส่งได้เลย ไม่ต้องใช้ตัวแปร image
    if (!previewUrl || !sessionId) {
        alert("กรุณาถ่ายรูปก่อนครับ");
        return;
    }
    
    setUploading(true);

    try {
      // ✅ อัปเดตที่ตาราง motorcycles โดยตรง
      const { error } = await supabase
        .from('motorcycles') 
        .update({ image_url: previewUrl }) 
        .eq('id', sessionId);

      if (error) {
        throw error;
      } else {
        setStatus('success');
      }
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-green-600 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="text-7xl mb-4 animate-bounce">✅</div>
        <h1 className="text-4xl font-black mb-2">ส่งรูปเรียบร้อย!</h1>
        <p className="text-xl opacity-90">รูปเด้งไปที่หน้าคอมเรียบร้อยแล้วครับ<br/>คุณสามารถปิดหน้านี้ได้เลย</p>
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
            <p className="font-bold text-lg">กดเพื่อถ่ายรูป</p>
          </div>
        )}
        
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {previewUrl && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`mt-10 w-full max-w-sm py-5 rounded-full text-2xl font-black shadow-xl transition-all active:scale-95 ${
            uploading ? 'bg-slate-400' : 'bg-yellow-400 text-blue-900'
          }`}
        >
          {uploading ? 'กำลังส่งข้อมูล...' : 'กดเพื่อส่งรูปเข้าคอม ✅'}
        </button>
      )}

      {previewUrl && !uploading && (
        <button 
          onClick={() => setPreviewUrl(null)}
          className="mt-4 text-white/70 font-bold underline"
        >
          ถ่ายใหม่
        </button>
      )}

      <p className="mt-8 text-[10px] opacity-30">ID: {sessionId}</p>
    </div>
  );
};
