import React, { useState, useEffect } from 'react';
import { Motorcycle, CarStatus, TransferType } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

interface CarFormProps {
  car: Motorcycle | null;
  onClose: () => void;
  onSubmit: (data: Omit<Motorcycle, 'id'>) => void;
}

const InputField = ({ label, name, value, onChange, type = "text", placeholder = "", className = "" }: any) => (
  <div className={`mb-3 ${className}`}>
    <label className="block text-2xl font-bold text-slate-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-2 text-lg text-slate-900 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-100 outline-none transition-all bg-white"
    />
  </div>
);

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
    reg_date: '',
    reg_number: '',
    reg_province: '',
    color: '',
    chassis_number: '',
    chassis_location: '',
    engine_brand: '',
    engine_number: '',
    cylinders: '',
    cc: '',
    original_owner_name: '',
    id_card_number: '',
    birth_date: '',
    nationality: 'ไทย',
    original_owner_address: '',
    sale_date: '',
    buyer_name: '',
    buyer_address: '',
    sale_price: '',
    transfer_type: TransferType.SHOP,
    transfer_details: '',
    received_book_date: '',
  });

  // --- 📱 ระบบ QR Code อัปโหลด (เวอร์ชันแก้บั๊กข้อมูลซ้ำ) ---
  const startMobileUpload = async () => {
    let currentId = car?.id || sessionId;

    // ถ้าไม่มี ID รถ และยังไม่เคยจอง ID (sessionId) ให้สร้างแถวว่างไว้ก่อน
    if (!currentId) {
      const { data, error } = await supabase
        .from('motorcycles')
        .insert([{ status: CarStatus.AVAILABLE, brand: 'กำลังเพิ่มข้อมูล...' }])
        .select()
        .single();
      
      if (data) {
        currentId = data.id;
        setSessionId(currentId);
      } else {
        console.error("Error creating session:", error);
        return;
      }
    }

    setShowQR(true);

    // เปิดช่องทาง Realtime รอรับรูป
    const channel = supabase.channel(`sync-${currentId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'motorcycles', filter: `id=eq.${currentId}` }, 
        (payload) => {
          if (payload.new.image_url) {
            setFormData(prev => ({ ...prev, image_url: payload.new.image_url }));
            setShowQR(false); 
            supabase.removeChannel(channel);
          }
        }
      ).subscribe();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- 💾 บันทึกข้อมูล (เวอร์ชันแก้ปัญหาต้องกด Refresh) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (car?.id || sessionId) {
        // ถ้ามี ID อยู่แล้ว (จากการจอง sessionId หรือการแก้ไข) ให้ใช้ UPDATE
        const targetId = car?.id || sessionId;
        const { error } = await supabase
          .from('motorcycles')
          .update(formData)
          .eq('id', targetId);
        
        if (error) throw error;
      } else {
        // กรณีเพิ่มรถใหม่แบบไม่ได้ใช้มือถือถ่ายรูป
        const { error } = await supabase
          .from('motorcycles')
          .insert([formData]);
        
        if (error) throw error;
      }
      
      // ส่งข้อมูลกลับไปหน้าหลักเพื่อสั่ง Refresh รายการรถ
      onSubmit(formData); 
      onClose();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      console.error(err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col border-[6px] border-green-800">
        
        {/* Header */}
        <div className="bg-green-800 text-white p-3 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white px-2 py-0.5 rounded text-green-800 font-black text-[20px]">ตงมอเตอร์</div>
            <h2 className="text-3xl font-black">{car ? 'แก้ไขข้อมูลรถ' : 'เพิ่มรถเข้าระบบ'}</h2>
          </div>
          <button onClick={onClose} className="bg-red-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-xl hover:bg-red-600 shadow-inner">×</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 border-b p-1 gap-1">
          {[ { id: 1, icon: "🏍️", label: "ตัวรถ" }, { id: 2, icon: "👤", label: "เจ้าของเดิม" }, { id: 3, icon: "📑", label: "ขาย/โอน" } ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-2xl font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white text-green-800 shadow-sm' : 'text-slate-500'}`}>
              <span>{tab.icon}</span> <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form id="car-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {activeTab === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm text-center">
                  <label className="block text-2xl font-black text-slate-800 mb-2">รูปถ่ายรถ</label>
                  <div className="aspect-[4/3] w-full bg-slate-100 rounded-xl overflow-hidden mb-3 border-2 border-dashed border-slate-300 relative group">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="รถ" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <span className="text-5xl">📸</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <button type="button" onClick={startMobileUpload} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all">
                    📱 สแกนถ่ายรูปด้วยมือถือ
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                 <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="วันที่ซื้อเข้า" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleChange} />
                    <div className="mb-3">
                      <label className="block text-2xl font-bold text-slate-700 mb-1">สถานะ</label>
                      <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 text-xl border-2 border-slate-300 rounded-lg bg-white font-bold">
                        <option value={CarStatus.AVAILABLE}>🟢 พร้อมขาย</option>
                        <option value={CarStatus.SOLD}>🔴 ขายแล้ว</option>
                      </select>
                    </div>
                 </div>
                 <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-x-4">
                    <InputField label="ยี่ห้อ" name="brand" value={formData.brand} onChange={handleChange} placeholder="เช่น Honda" />
                    <InputField label="รุ่น" name="model_type" value={formData.model_type} onChange={handleChange} placeholder="เช่น Wave 110i" />
                    <InputField label="ปี" name="year_model" value={formData.year_model} onChange={handleChange} placeholder="2024" />
                    <InputField label="ทะเบียน" name="reg_number" value={formData.reg_number} onChange={handleChange} />
                    <InputField label="จังหวัด" name="reg_province" value={formData.reg_province} onChange={handleChange} />
                    <InputField label="จดทะเบียนเมื่อ" name="reg_date" type="date" value={formData.reg_date} onChange={handleChange} />
                 </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="ชื่อเจ้าของเดิม" name="original_owner_name" value={formData.original_owner_name} onChange={handleChange} />
              <InputField label="เลขบัตร ปชช." name="id_card_number" value={formData.id_card_number} onChange={handleChange} />
              <div className="col-span-full">
                <label className="block text-2xl font-bold text-slate-700 mb-1">ที่อยู่ตามบัตร</label>
                <textarea name="original_owner_address" value={formData.original_owner_address} onChange={handleChange} rows={2} className="w-full p-2 text-lg border-2 border-slate-300 rounded-lg focus:border-blue-600 outline-none" />
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="วันที่ขาย" name="sale_date" type="date" value={formData.sale_date} onChange={handleChange} />
                <InputField label="ราคาขาย" name="sale_price" type="number" value={formData.sale_price} onChange={handleChange} />
                <InputField label="ชื่อผู้ซื้อ" name="buyer_name" className="col-span-full" value={formData.buyer_name} onChange={handleChange} />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-100 flex gap-3 border-t">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border-2 active:scale-95 transition-all">ยกเลิก</button>
          <button type="submit" form="car-form" className="flex-[2] py-3 bg-green-700 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-green-800 active:scale-95 transition-all">
            {car || sessionId ? '💾 บันทึกข้อมูล' : '✅ เพิ่มรถใหม่'}
          </button>
        </div>

        {/* QR Code Popup */}
        {showQR && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-6 text-white">
            <div className="bg-white p-6 rounded-3xl mb-4 shadow-2xl">
              <QRCodeSVG value={`${window.location.origin}/upload?id=${car?.id || sessionId}`} size={280} />
            </div>
            <h2 className="text-3xl font-bold mb-2">สแกนเพื่อถ่ายรูป</h2>
            <button type="button" onClick={() => setShowQR(false)} className="px-12 py-4 bg-red-600 rounded-full font-bold text-2xl active:scale-90 shadow-lg">ปิดหน้าต่าง</button>
          </div>
        )}
      </div>
    </div>
  );
};
