
import React from 'react';
import { Motorcycle, CarStatus } from '../types';

interface CarCardProps {
  car: Motorcycle;
  onEdit: () => void;
  onDelete: () => void;
}

export const CarCard: React.FC<CarCardProps> = ({ car, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-xl border-2 border-gray-200 hover:border-blue-400 transition-all flex flex-col">
      {/* ส่วนรูปภาพ */}
      <div className="relative h-64 bg-gray-200">
        <img 
          src={car.image_url || `https://picsum.photos/seed/${car.id}/600/400`} 
          alt={car.brand} 
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-4 right-4 px-4 py-2 rounded-full font-bold text-white shadow-md ${car.status === CarStatus.AVAILABLE ? 'bg-green-600' : 'bg-red-600'}`}>
          {car.status}
        </div>
      </div>

      {/* ส่วนเล่มเขียวจำลอง */}
      <div className="p-1 bg-green-700"></div> {/* ขอบเล่มเขียว */}
      <div 
        onClick={onEdit}
        className="flex-1 bg-green-50 p-6 cursor-pointer hover:bg-green-100 transition-colors"
      >
        <div className="flex justify-between items-start mb-4 border-b-2 border-green-200 pb-2">
          <div>
            <h3 className="text-2xl font-bold text-green-900">{car.brand} {car.model_type}</h3>
            <p className="text-lg text-green-700 font-bold">ทะเบียน: {car.reg_number} {car.reg_province}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold bg-green-200 text-green-800 px-2 py-1 rounded">คลิกเพื่อดูเล่มเขียว</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-3 text-xl text-gray-800">
          <div><span className="text-black text-base block uppercase tracking-wide">เลขตัวรถ:</span> <b>{car.chassis_number || '-'}</b></div>
          <div><span className="text-black text-base block uppercase tracking-wide">เลขเครื่อง:</span> <b>{car.engine_number || '-'}</b></div>
          <div><span className="text-black text-base block uppercase tracking-wide">สีรถ:</span> <b>{car.color || '-'}</b></div>
          <div><span className="text-black text-base block uppercase tracking-wide">ราคาขาย:</span> <b className="text-blue-700 text-xl">{car.sale_price ? Number(car.sale_price).toLocaleString() + ' บาท' : 'ยังไม่ระบุ'}</b></div>
        </div>
      </div>

      {/* ปุ่มกดลบ */}
      <div className="flex border-t border-gray-200">
        <button 
          onClick={onDelete}
          className="w-full py-4 text-red-600 font-bold hover:bg-red-50 transition-colors border-r border-gray-100"
        >
          ลบข้อมูล
        </button>
        <button 
          onClick={onEdit}
          className="w-full py-4 text-blue-700 font-bold hover:bg-blue-50 transition-colors"
        >
          แก้ไข/ดูข้อมูล
        </button>
      </div>
    </div>
  );
};
