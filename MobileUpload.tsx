import React, { useState } from 'react';
import { supabase } from './lib/supabase';

export const MobileUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const sessionId = new URLSearchParams(window.location.search).get('id');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;

    setUploading(true);
    try {
      // 1. อัปโหลดเข้า Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. รับ Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(fileName);

      // 3. อัปเดตตาราง upload_sessions เพื่อส่งสัญญาณไปที่คอม
      const { error: updateError } = await supabase
        .from('upload_sessions')
        .update({ image_url: publicUrl, status: 'completed' })
        .eq('id', sessionId);

      if (updateError) throw updateError;
      setSuccess(true);
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-green-50 text-center">
        <div className="text-8xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-green-800">ส่งรูปสำเร็จ!</h1>
        <p className="text-xl text-green-600">กรุณากลับไปดูที่หน้าจอคอมพิวเตอร์ของคุณ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-black text-blue-900 mb-2">ตงมอเตอร์</h1>
      <p className="text-xl text-slate-500 mb-10">ระบบส่งรูปถ่ายรถเข้าร้าน</p>
      
      <label className={`
        w-full max-w-xs p-8 rounded-3xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
        ${uploading ? 'bg-gray-100 border-gray-300' : 'bg-white border-blue-400 active:scale-95 shadow-xl'}
      `}>
        <div className="text-6xl mb-4">{uploading ? '⏳' : '📸'}</div>
        <span className="text-2xl font-bold text-blue-600">
          {uploading ? 'กำลังส่งรูป...' : 'ถ่ายรูป / เลือกรูป'}
        </span>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileChange}
          className="hidden" 
          disabled={uploading}
        />
      </label>
      {uploading && <p className="mt-4 text-slate-500">กรุณารอซักครู่ ห้ามปิดหน้านี้</p>}
    </div>
  );
};
