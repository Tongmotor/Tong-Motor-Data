import React, { useState, useEffect, useMemo } from 'react';
import { Motorcycle, CarStatus } from './types';
import { Header } from './components/Header';
import { CarCard } from './components/CarCard';
import { CarForm } from './components/CarForm';
import { supabase } from './lib/supabase';
import { MobileUpload } from './MobileUpload';

const App: React.FC = () => {
  // 1. ตรวจสอบ Route (หน้าเว็บปกติ หรือ หน้ามือถืออัปโหลด)
  const isUploadPage = window.location.pathname.includes('upload') || window.location.hash.includes('upload');

  const [cars, setCars] = useState<Motorcycle[]>([]);
  const [filter, setFilter] = useState<'ทั้งหมด' | CarStatus>('ทั้งหมด');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Motorcycle | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. ฟังก์ชันดึงข้อมูลจาก Supabase
  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('motorcycles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setCars(data as Motorcycle[]);
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  // 3. 🌟 ระบบ Real-time (หัวใจหลักที่ทำให้ข้อมูลเด้งเอง)
  useEffect(() => {
    if (isUploadPage) return; // ถ้าอยู่หน้าอัปโหลดไม่ต้องดักฟัง

    fetchCars(); // ดึงข้อมูลครั้งแรก

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'motorcycles' },
        (payload) => {
          console.log('Change detected:', payload);
          fetchCars(); // 🔄 เมื่อมีการเปลี่ยนแปลงใน DB ให้โหลดข้อมูลใหม่ทันที
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUploadPage]);

  // 4. จัดการเพิ่ม/แก้ไข/ลบ
  const handleAddCar = async (carData: Omit<Motorcycle, 'id'>) => {
    try {
      const { error } = await supabase.from('motorcycles').insert([carData]);
      if (error) throw error;
      // ไม่ต้องสั่ง fetchCars() ตรงๆ เพราะ Real-time จัดการให้แล้ว
      setIsFormOpen(false);
    } catch (e) {
      alert("ไม่สามารถเพิ่มข้อมูลได้");
    }
  };

  const handleUpdateCar = async (carData: Omit<Motorcycle, 'id'>) => {
    if (!editingCar) return;
    try {
      const { error } = await supabase
        .from('motorcycles')
        .update(carData)
        .eq('id', editingCar.id);
      
      if (error) throw error;
      setEditingCar(null);
    } catch (e) {
      alert("ไม่สามารถแก้ไขข้อมูลได้");
    }
  };

  const handleDeleteCar = async (id: string) => {
    if (window.confirm('ยืนยันว่าจะลบข้อมูลรถคันนี้?')) {
      try {
        const { error } = await supabase.from('motorcycles').delete().eq('id', id);
        if (error) throw error;
      } catch (e) {
        alert("ไม่สามารถลบข้อมูลได้");
      }
    }
  };

  const filteredCars = useMemo(() => {
    if (filter === 'ทั้งหมด') return cars;
    return cars.filter(car => car.status === filter);
  }, [cars, filter]);

  // --- แสดงหน้าจอตามเงื่อนไข ---
  if (isUploadPage) return <MobileUpload />;

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ส่วนตัวกรองและปุ่มเพิ่มรถ */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-200">
          <div className="flex bg-slate-100 p-2 rounded-2xl gap-2 w-full md:w-auto">
            {(['ทั้งหมด', CarStatus.AVAILABLE, CarStatus.SOLD] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xl transition-all ${
                  filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-full md:w-auto bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-2xl shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
          >
            + เพิ่มรถเข้าร้าน
          </button>
        </div>

        {/* ส่วนแสดงรายการรถ */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-2xl font-bold text-slate-600">กำลังโหลด...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCars.map(car => (
              <CarCard 
                key={car.id} 
                car={car} 
                onEdit={() => setEditingCar(car)}
                onDelete={() => handleDeleteCar(car.id)}
              />
            ))}
            {filteredCars.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border-4 border-dashed border-slate-200 text-slate-400">
                <p className="text-3xl font-black">ยังไม่มีข้อมูลในหมวดนี้</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ฟอร์ม เพิ่ม/แก้ไข */}
      {(isFormOpen || editingCar) && (
        <CarForm 
          car={editingCar}
          onClose={() => { setIsFormOpen(false); setEditingCar(null); }}
          onSubmit={editingCar ? handleUpdateCar : handleAddCar}
        />
      )}
    </div>
  );
};

export default App;
