// App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Motorcycle, CarStatus } from './types';
import { Header } from './components/Header';
import { CarCard } from './components/CarCard';
import { CarForm } from './components/CarForm';
import { supabase } from './lib/supabase';

// --- ส่วนที่เพิ่มใหม่: หน้าสำหรับมือถือสแกนมาถ่ายรูป ---
const MobileUploadPage = ({ sid }: { sid: string }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileName = `mobile_${Date.now()}.jpg`;
      const { data } = await supabase.storage.from('motorcycle_images').upload(fileName, file);
      if (data) {
        const { data: urlData } = supabase.storage.from('motorcycle_images').getPublicUrl(fileName);
        await supabase.from('temp_uploads').insert({ session_id: sid, image_url: urlData.publicUrl });
        setSuccess(true);
      }
    } catch (err) { alert("เกิดข้อผิดพลาด"); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-black mb-6 text-yellow-500">ตงมอเตอร์ 🏍️</h1>
      {!success ? (
        <label className="w-full max-w-xs aspect-square bg-green-600 rounded-3xl flex flex-col items-center justify-center shadow-2xl border-4 border-green-400">
          <span className="text-7xl mb-4">{loading ? '⌛' : '📸'}</span>
          <span className="text-2xl font-bold">{loading ? 'กำลังส่ง...' : 'กดเพื่อถ่ายรูปรถ'}</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        </label>
      ) : (
        <div className="text-green-400 font-bold text-2xl animate-bounce">✅ ส่งรูปสำเร็จ! ดูหน้าจอคอมได้เลย</div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  // --- ส่วนที่เช็ค SID เพื่อสลับไปหน้ามือถือ ---
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const sid = queryParams.get('sid');
  if (sid) return <MobileUploadPage sid={sid} />;
  // ----------------------------------------

  // ... โค้ดเดิมของคุณทั้งหมด (fetchCars, handleAddCar, ฯลฯ) ...
  // ก๊อปปี้ส่วนที่เหลือจากไฟล์ App.tsx เดิมมาวางต่อตรงนี้ได้เลยครับ
