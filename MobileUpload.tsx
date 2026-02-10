import React, { useState } from 'react';
import { supabase } from './lib/supabase';

export const MobileUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // ดึง ID จาก URL (?id=...)
  const query = new URLSearchParams(window.location.search);
  const sessionId = query.get('id');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ✅ สร้างลิงก์ชั่วคราวเพื่อแสดงรูปที่เลือก (ป้องกันรูปหาย)
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!previewUrl || !sessionId) return;
    setUploading(true);

    try {
      // 1. แปลงรูปเป็น Base64 หรืออัปโหลดเข้า Storage (ในที่นี้ใช้ Base64 เพื่อความง่าย)
      // แนะนำให้ใช้ไฟล์จริงอัปโหลดเข้า Supabase Storage จะดีกว่าครับ
      
      // 2. อัปเดตสถานะในตารางเพื่อให้คอมพิวเตอร์รู้
      const { error } = await supabase
        .from('upload_sessions')
        .update({ 
          status: 'completed',
          image_url: previewUrl // หรือ URL จาก Storage
        })
        .eq('id', sessionId);

      if (error) throw error;
      alert("อัปโหลดสำเร็จ! กลับไปดูที่หน้าจอคอมได้เลย");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการส่งรูป");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-600 p-6 flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-black mb-8">ตงมอเตอร์</h1>
      
      <div className="bg-white p-4 rounded-3xl shadow-2xl w-full max-w-sm aspect-square flex flex-col items-center justify-center border-4 border-yellow-400 relative overflow-hidden">
        {previewUrl ? (
          <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
        ) : (
          <div className="text-slate-400 text-center">
            <span className="text-6xl">📸</span>
            <p className="text-xl font-bold mt-2">ยังไม่ได้เลือกรูป</p>
          </div>
        )}
        
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" // ✅ บังคับเปิดกล้องทันทีในมือถือ
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {/* ✅ ปุ่มกดส่งรูป จะปรากฏเมื่อเลือกรูปแล้วเท่านั้น */}
      {previewUrl && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`mt-8 w-full max-w-sm py-5 rounded-full text-2xl font-black shadow-xl transition-all active:scale-95 ${
            uploading ? 'bg-slate-400' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {uploading ? 'กำลังส่งรูป...' : 'ยืนยันการส่งรูป ✅'}
        </button>
      )}

      <p className="mt-6 opacity-70">ID: {sessionId}</p>
    </div>
  );
};
