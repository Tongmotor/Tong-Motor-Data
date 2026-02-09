import React, { useState, useEffect, useMemo } from 'react';
import { Motorcycle, CarStatus } from './types';
import { Header } from './components/Header';
import { CarCard } from './components/CarCard';
import { CarForm } from './components/CarForm';
import { supabase } from './lib/supabase';

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
        <label className="w-full max-w-xs aspect-square bg-green-600 rounded-3xl flex flex-col items-center justify-center shadow-2xl border-4 border-green-400 active:scale-95 transition-all">
          <span className="text-7xl mb-4">{loading ? '⏳' : '📸'}</span>
          <span className="text-2xl font-bold">{loading ? 'กำลังส่ง...' : 'กดเพื่อถ่ายรูป'}</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        </label>
      ) : (
        <div className="text-green-400 font-bold text-2xl animate-bounce">
          <div className="text-7xl mb-4">✅</div>ส่งรูปสำเร็จ! ดูหน้าจอคอมได้เลย
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [cars, setCars] = useState<Motorcycle[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Motorcycle | null>(null);

  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const sid = queryParams.get('sid');
  if (sid) return <MobileUploadPage sid={sid} />;

  const fetchCars = async () => {
    const { data } = await supabase.from('motorcycles').select('*').order('created_at', { ascending: false });
    if (data) setCars(data as Motorcycle[]);
  };

  useEffect(() => { fetchCars(); }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <Header />
      <main className="max-w-6xl mx-auto p-4 text-center">
        <button onClick={() => setIsFormOpen(true)} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold text-3xl shadow-lg mb-8">+ เพิ่มรถเข้าร้าน</button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {cars.map(car => (
            <CarCard key={car.id} car={car} onEdit={() => setEditingCar(car)} onDelete={() => {}} />
          ))}
        </div>
      </main>
      {(isFormOpen || editingCar) && (
        <CarForm 
          car={editingCar}
          onClose={() => { setIsFormOpen(false); setEditingCar(null); }}
          onSubmit={async (data: any) => {
             await supabase.from('motorcycles').insert([data]);
             setIsFormOpen(false);
             fetchCars();
          }}
        />
      )}
    </div>
  );
};
export default App;
