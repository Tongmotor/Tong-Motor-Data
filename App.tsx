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
      const { data, error } = await supabase.storage.from('motorcycle_images').upload(fileName, file);
      
      if (error) throw error;

      if (data) {
        const { data: urlData } = supabase.storage.from('motorcycle_images').getPublicUrl(fileName);
        await supabase.from('temp_uploads').insert({ session_id: sid, image_url: urlData.publicUrl });
        setSuccess(true);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการส่งรูป");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <h1 className="text-4xl font-black mb-6 text-yellow-500">ตงมอเตอร์ 🏍️</h1>
      {!success ? (
        <label className="w-full max-w-xs aspect-square bg-green-600 rounded-3xl flex flex-col items-center justify-center shadow-2xl border-4 border-green-400 active:scale-95 transition-all cursor-pointer">
          <span className="text-7xl mb-4">{loading ? '⏳' : '📸'}</span>
          <span className="text-2xl font-bold">{loading ? 'กำลังส่งรูป...' : 'กดเพื่อถ่ายรูปรถ'}</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} disabled={loading} />
        </label>
      ) : (
        <div className="text-green-400 font-bold text-2xl animate-bounce">
          <div className="text-7xl mb-4">✅</div>
          ส่งรูปสำเร็จ!<br/>ดูที่หน้าจอคอมได้เลย
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [cars, setCars] = useState<Motorcycle[]>([]);
  const [filter, setFilter] = useState<'ทั้งหมด' | CarStatus>('ทั้งหมด');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Motorcycle | null>(null);
  const [loading, setLoading] = useState(true);

  // --- ส่วนที่เพิ่มใหม่: เช็คว่าสแกน QR มาหรือไม่ ---
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const sid = queryParams.get('sid');

  const fetchCars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('motorcycles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setCars(data as Motorcycle[]);
    } catch (e) {
      console.error("Error fetching from Supabase:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  // ถ้ามี sid ให้แสดงหน้าถ่ายรูปสำหรับมือถือทันที
  if (sid) {
    return <MobileUploadPage sid={sid} />;
  }

  const handleAddCar = async (carData: Omit<Motorcycle, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('motorcycles')
        .insert([{ ...carData, status: carData.status || 'พร้อมขาย' }])
        .select();

      if (error) throw error;
      if (data) {
        setCars([data[0] as Motorcycle, ...cars]);
        setIsFormOpen(false);
        alert("บันทึกข้อมูลรถสำเร็จ!");
      }
    } catch (e: any) {
      console.error("Error:", e.message);
    }
  };

  const handleUpdateCar = async (updatedCar: Motorcycle) => {
    try {
      const { error } = await supabase
        .from('motorcycles')
        .update(updatedCar)
        .eq('id', updatedCar.id);
      if (error) throw error;
      setCars(cars.map(c => c.id === updatedCar.id ? updatedCar : c));
      setEditingCar(null);
    } catch (e) {
      console.error("Update error:", e);
    }
  };

  const handleDeleteCar = async (id: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลรถคันนี้?')) return;
    try {
      const { error } = await supabase.from('motorcycles').delete().eq('id', id);
      if (error) throw error;
      setCars(cars.filter(c => c.id !== id));
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const filteredCars = useMemo(() => {
    if (filter === 'ทั้งหมด') return cars;
    return cars.filter(c => c.status === filter);
  }, [cars, filter]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header />
      <main className="max-w-6xl mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-2">
            {(['ทั้งหมด', CarStatus.AVAILABLE, CarStatus.SOLD] as const).map((type) => (
              <button 
                key={type}
                onClick={() => setFilter(type)}
                className={`px-8 py-3 rounded-xl font-bold text-3xl transition-all border-2 ${
                  filter === type 
                  ? 'bg-blue-700 text-white border-blue-800 shadow-md scale-105' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {type === 'ทั้งหมด' ? `รถทั้งหมด (${cars.length})` : type}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-full md:w-auto bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-3xl flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มรถเข้าร้าน
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-700 mb-4"></div>
            <p className="text-xl font-bold text-slate-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredCars.length > 0 ? (
              filteredCars.map(car => (
                <CarCard key={car.id} car={car} onEdit={() => setEditingCar(car)} onDelete={() => handleDeleteCar(car.id)} />
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-white rounded-3xl border-4 border-dashed border-slate-200 shadow-inner">
                <div className="text-6xl mb-4">🏍️</div>
                <p className="text-3xl font-black text-slate-400 mb-2">ยังไม่มีข้อมูลรถในหมวดนี้</p>
                <p className="text-xl text-slate-400">กดปุ่มสีเขียว "เพิ่มรถเข้าร้าน" เพื่อเริ่มบันทึก</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Button สำหรับมือถือ */}
      <div className="fixed bottom-8 right-8 md:hidden z-30">
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-green-600 text-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center hover:bg-green-700 transition-transform active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {(isFormOpen || editingCar) && (
        <CarForm 
          car={editingCar}
          onClose={() => { setIsFormOpen(false); setEditingCar(null); }}
          onSubmit={(data) => {
            if (editingCar) { handleUpdateCar({ ...data, id: editingCar.id } as Motorcycle); }
            else { handleAddCar(data); }
          }}
        />
      )}
    </div>
  );
};

export default App;
