
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-blue-900 text-white p-6 shadow-md border-b-4 border-yellow-500">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-6xl font-extrabold tracking-tight">ร้านตงมอเตอร์</h1>
          <p className="text-xl mt-1 opacity-90">ตงมอเตอร์ - ระบบจัดการรถจักรยานยนต์มือสอง</p>
        </div>
        <div className="text-right bg-blue-800 p-3 rounded-lg border border-blue-700">
          <p className="font-bold text-lg">เลขที่ 13 ถ. วิฑูรอุทิศ 1 ต.สะเตง อ.เมือง จ.ยะลา</p>
          <p className="text-xl font-bold text-yellow-400">โทร 073-214391</p>
        </div>
      </div>
    </header>
  );
};
