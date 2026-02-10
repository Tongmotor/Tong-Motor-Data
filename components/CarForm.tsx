import React, { useState } from 'react';
import { Motorcycle, CarStatus, TransferType } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

interface CarFormProps {
  car: Motorcycle | null;
  onClose: () => void;
  onSubmit: (data: Omit<Motorcycle, 'id'>) => void;
}

export const CarForm: React.FC<CarFormProps> = ({ car, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [showQR, setShowQR] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Motorcycle, 'id'>>(car || {
    image_url: '',
    status: CarStatus.AVAILABLE,
    purchase_date: new Date().toISOString().split('T')[0],
    brand: '',
    model_type: '',
    year_model: '',
    reg_number: '',
    reg_province: '',
    color: '',
    chassis_number: '',
    engine_number: '',
    original_owner_name: '',
    nationality: 'ไทย',
    transfer_type: TransferType.SHOP,
  } as any);

  // 📱 ฟังก์ชันเริ่มอัปโหลดด้วยมือถือ
  const startMobileUpload = async () => {
    let currentId = car?.id || sessionId;

    if (!currentId) {
      // ถ้ายังไม่มีรถในฐานข้อมูล ให้สร้าง "แถวจอง" ไว้ก่อน
      const { data } = await supabase
        .from('motorcycles')
        .insert([{ status: CarStatus.AVAILABLE, brand: 'กำลังเพิ่ม...' }])
        .select().single();
      if (data) {
        currentId = data.id;
        setSessionId(currentId);
      }
    }

    if (currentId) {
      setShowQR(true);
      // ดักฟัง Realtime: ถ้ารูปถูกอัปเดตใน DB ให้เอามาโชว์ในฟอร์มทันที
      supabase.channel(`sync-${currentId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'motorcycles', filter: `id=eq.${currentId}` }, 
        (payload) => {
          if (payload.new.image_url) {
            setFormData(prev => ({ ...prev, image_url: payload.new.image_url }));
            setShowQR(false);
          }
        }).subscribe();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = car?.id || sessionId;

    if (targetId) {
      // ถ้ามี ID แล้ว (จากการแก้ไข หรือถ่ายรูปไว้) ให้ UPDATE
      await supabase.from('motorcycles').update(formData).eq('id', targetId);
    } else {
      // ถ้าไม่มี ID เลย ให้ INSERT ใหม่
      await supabase.from('motorcycles').insert([formData]);
    }
    
    onSubmit(formData); // แจ้งหน้าหลักให้รีเฟรชข้อมูลในลิสต์
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-green-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">ข้อมูลรถ - ตงมอเตอร์</h2>
          <button onClick={onClose} className="text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ส่วนรูปภาพ */}
            <div className="border-2 border-dashed rounded-xl p-4 text-center">
              {formData.image_url ? (
                <img src={formData.image_url} className="w-full aspect-video object-cover rounded-lg mb-2" />
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center mb-2">📸 ไม่มีรูป</div>
              )}
              <button type="button" onClick={startMobileUpload} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                📱 ถ่ายรูปด้วยมือถือ
              </button>
            </div>

            {/* ข้อมูลพื้นฐาน */}
            <div className="space-y-2">
              <label className="block font-bold">ยี่ห้อ</label>
              <input className="w-full border p-2 rounded" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
              <label className="block font-bold">ทะเบียน</label>
              <input className="w-full border p-2 rounded" value={formData.reg_number} onChange={e => setFormData({...formData, reg_number: e.target.value})} />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-green-700 text-white py-4 rounded-xl text-xl font-bold">
            บันทึกข้อมูล
          </button>
        </form>

        {showQR && (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[60]">
            <div className="bg-white p-6 rounded-2xl"><QRCodeSVG value={`${window.location.origin}/upload?id=${car?.id || sessionId}`} size={250} /></div>
            <p className="text-white mt-4 text-xl">สแกนเพื่อถ่ายรูป</p>
            <button onClick={() => setShowQR(false)} className="mt-8 text-red-400 underline">ยกเลิก</button>
          </div>
        )}
      </div>
    </div>
  );
};
