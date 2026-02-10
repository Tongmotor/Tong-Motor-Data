import React, { useState, useEffect, useMemo } from 'react';
import { Motorcycle, CarStatus } from './types';
import { Header } from './components/Header';
import { CarCard } from './components/CarCard';
import { CarForm } from './components/CarForm';
import { supabase } from './lib/supabase';
// ✅ Import หน้ามือถือมาใช้งาน
import { MobileUpload } from './MobileUpload';

const App: React.FC = () => {
  // ✅ เช็คว่าเป็นหน้าอัปโหลดรูปหรือไม่
  const isUploadPage = window.location.pathname.includes('/upload') || window.location.hash.includes('/upload');

  const [cars, setCars] = useState<Motorcycle[]>([]);
  const [filter, setFilter] = useState<'ทั้งหมด' | CarStatus>('ทั้งหมด');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Motorcycle | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
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

  const handleAddCar = async (carData: Omit<Motorcycle, 'id'>) => {
    try {
      const { error } = await supabase.from('motorcycles').insert([carData]);
      if (error) throw error;
      fetchCars();
      setIsFormOpen(false);
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
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
      fetchCars();
      setEditingCar(null);
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  };

  const handleDeleteCar = async (id: string) => {
    if (window.confirm('ยืนยันว่าจะลบข้อมูลรถคันนี้?')) {
      try {
        const { error } = await supabase.from('motorcycles').delete().eq('id', id);
        if (error) throw error;
        fetchCars();
      } catch (e) {
        alert("ไม่สามารถลบข้อมูลได้");
      }
    }
  };

  const filteredCars = useMemo(() => {
    if (filter === 'ทั้งหมด') return cars;
    return cars.filter(car => car.status === filter);
  }, [cars, filter]);

  // ✅ ถ้าเป็นหน้าอัปโหลด ให้แสดง MobileUpload ทันที
  if (isUploadPage) {
    return <MobileUpload />;
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-200">
          <div className="flex bg-slate-100 p-2 rounded-2xl gap-2 w-full md:w-auto">
            {(['ทั้งหมด', CarStatus.AVAILABLE, CarStatus.SOLD] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xl transition-all ${
                  filter === f 
                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f === CarStatus.AVAILABLE ? '🟢 ' + f : f === CarStatus.SOLD ? '🔴 ' + f : f}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-full md:w-auto bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-2xl shadow-xl hover:bg-green-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-3xl">+</span> เพิ่มรถเข้าร้าน
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-2xl font-bold text-slate-600">กำลังโหลดข้อมูล...</p>
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
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border-4 border-dashed border-slate-200">
                <div className="text-6xl mb-4">🏍️</div>
                <p className="text-3xl font-black text-slate-400">ยังไม่มีข้อมูลรถในหมวดนี้</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-8 right-8 md:hidden z-30">
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-green-600 text-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {(isFormOpen || editingCar) && (
        <CarForm 
          car={editingCar}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCar(null);
          }}
          onSubmit={editingCar ? handleUpdateCar : handleAddCar}
        />
      )}
    </div>
  );
};

export default App;
