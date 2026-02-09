import React, { useState, useEffect } from 'react';
import { Motorcycle, CarStatus, TransferType } from '../types';
import { QRCodeSVG } from 'qrcode.react'; // นำเข้าตัวสร้าง QR Code
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
      className="w-full p-2 text-lg text-slate-900 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-100 outline-none transition-all bg-white font-bold"
    />
  </div>
);

export const CarForm: React.FC<CarFormProps> = ({ car, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState<Omit<Motorcycle, 'id'>>(car || {
    image_url: '',
    status: CarStatus.AVAILABLE,
    purchase_date: '',
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

  // สร้าง Session ID เฉพาะสำหรับการเปิดฟอร์มครั้งนี้
  const [sessionId] = useState(`tong_${Math.random().toString(36).substr(2, 9)}`);
  
  // URL สำหรับหน้าถ่ายรูป (เปลี่ยนให้ตรงกับ IP หรือ Domain จริงเมื่อ Deploy)
  const uploadUrl = `${window.location.origin}?sid=${sessionId}`;

  // ระบบดักรับรูปจากมือถือแบบ Realtime
  useEffect(() => {
    const channel = supabase
      .channel('sync_photo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'temp_uploads', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.new && payload.new.image_url) {
            setFormData(prev => ({ ...prev, image_url: payload.new.image_url }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
            <h2 className="text-3xl font-black">รายละเอียดข้อมูลรถ</h2>
          </div>
          <button onClick={onClose} className="bg-red-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-xl hover:bg-red-600 transition-colors shadow-inner">×</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 border-b border-slate-200 p-1 gap-1 ">
          {[
            { id: 1, icon: "🏍️", label: "ข้อมูลตัวรถ" },
            { id: 2, icon: "👤", label: "เจ้าของเดิม" },
            { id: 3, icon: "📑", label: "การขาย/โอน" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-1 text-2xl font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${
                activeTab === tab.id 
                ? 'bg-white text-green-800 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              <span className="text-xl">{tab.icon}</span> 
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form id="car-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 font-sans">
          
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <label className="block text-2xl font-black text-slate-800 mb-2 text-center">รูปถ่ายรถ</label>
                    <div className="aspect-[4/3] w-full bg-slate-100 rounded-xl overflow-hidden mb-3 border-2 border-dashed border-slate-300 relative">
                      {formData.image_url ? (
                        <img src={formData.image_url} alt="รถ" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                          <span className="text-4xl mb-1">📸</span>
                          <span className="text-2xl font-bold">เลือกรูปในเครื่อง</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>

                    {/* ส่วน QR Code ที่เพิ่มเข้ามา */}
                    <div className="mt-4 p-3 bg-green-50 rounded-xl border-2 border-dashed border-green-600 flex flex-col items-center">
                      <p className="text-sm font-bold text-green-800 mb-2 text-center leading-tight">ใช้มือถือสแกนถ่ายรูป<br/>รูปจะเข้าคอมทันที</p>
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-green-200">
                        <QRCodeSVG value={uploadUrl} size={110} />
                      </div>
                      <p className="text-[12px] text-blue-600 mt-2 animate-pulse">กำลังรอรูปจากมือถือ...</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <InputField label="วันที่ซื้อเข้าร้าน" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleChange} />
                    <div className="mb-3">
                      <label className="block text-2xl font-bold text-slate-700 mb-1">สถานะรถ</label>
                      <select 
                        name="status" 
                        value={formData.status} 
                        onChange={handleChange}
                        className="w-full p-2 text-black text-lg border-2 border-slate-300 rounded-lg bg-white font-bold"
                      >
                        <option value={CarStatus.AVAILABLE}>🟢 พร้อมขาย</option>
                        <option value={CarStatus.SOLD}>🔴 ขายแล้ว</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-x-4">
                    <InputField label="ยี่ห้อรถ" name="brand" value={formData.brand} onChange={handleChange} placeholder="Honda" />
                    <InputField label="แบบ/รุ่น" name="model_type" value={formData.model_type} onChange={handleChange} placeholder="Wave 110i" />
                    <InputField label="ปี ค.ศ." name="year_model" value={formData.year_model} onChange={handleChange} placeholder="2024" />
                    <InputField label="เลขทะเบียน" name="reg_number" value={formData.reg_number} onChange={handleChange} />
                    <InputField label="จังหวัด" name="reg_province" value={formData.reg_province} onChange={handleChange} />
                    <InputField label="วันจดทะเบียน" name="reg_date" type="date" value={formData.reg_date} onChange={handleChange} />
                  </div>
                </div>

                <div className="lg:col-span-12">
                   <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-x-4 ">
                    <InputField label="สีรถ" name="color" value={formData.color} onChange={handleChange} />
                    <InputField label="ซีซี (CC)" name="cc" value={formData.cc} onChange={handleChange} />
                    <InputField label="สูบ" name="cylinders" value={formData.cylinders} onChange={handleChange} />
                    <InputField label="ยี่ห้อเครื่อง" name="engine_brand" value={formData.engine_brand} onChange={handleChange} />
                    <InputField label="เลขตัวรถ" name="chassis_number" className="col-span-2" value={formData.chassis_number} onChange={handleChange} />
                    <InputField label="เลขเครื่อง" name="engine_number" className="col-span-2" value={formData.engine_number} onChange={handleChange} />
                    <InputField label="ตำแหน่งเลขตัวรถ" name="chassis_location" className="col-span-full" value={formData.chassis_location} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm font-sans">
                <div className="flex items-center gap-3 mb-4 border-b pb-3">
                  <h3 className="text-xl font-black text-slate-800">ข้อมูลเจ้าของรถคนเดิม</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="ชื่อ-นามสกุล" name="original_owner_name" value={formData.original_owner_name} onChange={handleChange} />
                  <InputField label="เลขบัตรประชาชน" name="id_card_number" value={formData.id_card_number} onChange={handleChange} />
                  <InputField label="สัญชาติ" name="nationality" value={formData.nationality} onChange={handleChange} />
                  <InputField label="วันเกิด" name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} />
                  <div className="col-span-full">
                    <label className="block text-2xl font-bold text-slate-700 mb-1">ที่อยู่เดิม</label>
                    <textarea 
                      name="original_owner_address" 
                      value={formData.original_owner_address} 
                      onChange={handleChange}
                      rows={2}
                      className="w-full p-2 text-lg border-2 border-slate-300 rounded-lg focus:border-blue-600 outline-none font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="วันที่ขาย" name="sale_date" type="date" value={formData.sale_date} onChange={handleChange} />
                  <InputField label="ราคาขาย (บาท)" name="sale_price" type="number" value={formData.sale_price} onChange={handleChange} />
                  <InputField label="ชื่อผู้ซื้อใหม่" name="buyer_name" className="col-span-full" value={formData.buyer_name} onChange={handleChange} />
                  <div className="col-span-full">
                    <label className="block text-2xl font-bold text-slate-700 mb-1">ที่อยู่ผู้ซื้อใหม่</label>
                    <textarea 
                      name="buyer_address" 
                      value={formData.buyer_address} 
                      onChange={handleChange}
                      rows={2}
                      className="w-full p-2 text-lg border-2 border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-2xl font-black text-slate-800 mb-2 text-center">การโอนทะเบียน</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, transfer_type: TransferType.SHOP }))}
                      className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                        formData.transfer_type === TransferType.SHOP 
                        ? 'bg-blue-600 text-white border-blue-800 shadow-md' 
                        : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      ร้านโอนให้
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, transfer_type: TransferType.SELF }))}
                      className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                        formData.transfer_type === TransferType.SELF 
                        ? 'bg-blue-600 text-white border-blue-800 shadow-md' 
                        : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      ลูกค้าโอนเอง
                    </button>
                  </div>
                </div>

                {formData.transfer_type === TransferType.SHOP && (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <InputField label="สถานะการโอน" name="transfer_details" value={formData.transfer_details} onChange={handleChange} placeholder="เช่น ยื่นเอกสารแล้ว..." />
                    <InputField label="วันที่รับเล่มกลับ" name="received_book_date" type="date" value={formData.received_book_date} onChange={handleChange} />
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-200">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-white text-slate-600 text-lg font-bold rounded-xl border-2 border-slate-300 active:scale-95 transition-all">ยกเลิก</button>
          <button type="submit" form="car-form" className="flex-[2] py-3 bg-green-700 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-green-800 active:scale-95 transition-all">
            {car ? '💾 บันทึกแก้ไข' : '✅ เพิ่มข้อมูลรถ'}
          </button>
        </div>
      </div>
    </div>
  );
};
