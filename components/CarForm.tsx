import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

interface CarFormProps {
  car: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const CarForm: React.FC<CarFormProps> = ({ car, onClose, onSubmit }) => {
  const [formData, setFormData] = useState(car || { image_url: '', brand: '', status: 'พร้อมขาย' });
  const [sessionId] = useState(`tong_${Math.random().toString(36).substr(2, 9)}`);
  const uploadUrl = `${window.location.origin}?sid=${sessionId}`;

  useEffect(() => {
    const channel = supabase.channel(`sync_${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'temp_uploads', filter: `session_id=eq.${sessionId}` }, 
      (payload) => { setFormData((prev: any) => ({ ...prev, image_url: payload.new.image_url })); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl flex flex-col border-4 border-green-700">
        <div className="bg-green-700 text-white p-4 flex justify-between items-center text-2xl font-bold">
          <span>เพิ่ม/แก้ไข ข้อมูลรถ</span>
          <button onClick={onClose} className="text-4xl">×</button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh] grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="aspect-video bg-slate-200 rounded-2xl overflow-hidden border-2 border-dashed border-slate-400 relative">
              {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" alt="bike" /> : <div className="h-full flex items-center justify-center text-slate-500 font-bold">ยังไม่มีรูปถ่าย</div>}
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border-2 border-dashed border-green-400 flex flex-col items-center">
              <p className="font-bold text-green-800 mb-2 text-xl text-center">สแกนถ่ายรูปจากมือถือ</p>
              <div className="bg-white p-2 rounded-lg shadow-md border border-green-200">
                <QRCodeSVG value={uploadUrl} size={150} />
              </div>
              <p className="text-blue-600 mt-2 animate-pulse text-lg font-bold italic">รอรูปจากมือถือส่งมา...</p>
            </div>
          </div>
          <div className="space-y-4 text-slate-900">
            <div>
              <label className="block font-bold text-xl mb-1">ยี่ห้อ/รุ่น</label>
              <input type="text" className="w-full p-3 border-2 rounded-xl text-xl font-bold bg-white" value={formData.brand || ''} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
            </div>
            <button type="button" onClick={() => onSubmit(formData)} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-2xl shadow-lg mt-4 active:scale-95 transition-all">✅ บันทึกข้อมูลรถ</button>
          </div>
        </div>
      </div>
    </div>
  );
};
