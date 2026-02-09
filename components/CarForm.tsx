// เพิ่ม import ไว้ด้านบน
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

// ภายในฟังก์ชัน CarForm ให้เพิ่ม Logic นี้ครับ:
export const CarForm: React.FC<CarFormProps> = ({ car, onClose, onSubmit }) => {
  const [showQR, setShowQR] = useState(false); // สถานะเปิด/ปิด QR
  const [sessionId] = useState(`t_${Math.random().toString(36).substr(2, 9)}`);
  const uploadUrl = `${window.location.origin}?sid=${sessionId}`;

  // ดักฟังรูปจากมือถือ
  useEffect(() => {
    const channel = supabase.channel('mobile_sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'temp_uploads', filter: `session_id=eq.${sessionId}` }, 
      (payload) => {
        setFormData(prev => ({ ...prev, image_url: payload.new.image_url }));
        setShowQR(false); // ได้รูปแล้วปิด QR อัตโนมัติ
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // ตรงส่วนที่แสดงรูปภาพ ให้เพิ่มปุ่มเข้าไปครับ:
  return (
    // ... โค้ด HTML เดิมของคุณ ...
    <div className="aspect-[4/3] w-full bg-slate-100 rounded-xl overflow-hidden mb-3 border-2 border-dashed border-slate-300 relative">
      {formData.image_url ? (
        <img src={formData.image_url} alt="รถ" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
          <span className="text-4xl mb-1">📸</span>
          <span className="text-xl font-bold">เลือกรูปภาพ</span>
        </div>
      )}
      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
    </div>

    {/* --- ปุ่มกดสแกน QR Code ที่เพิ่มใหม่ --- */}
    <button 
      type="button"
      onClick={() => setShowQR(!showQR)}
      className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold mb-4 hover:bg-blue-700 transition-colors"
    >
      {showQR ? '❌ ปิด QR Code' : '📲 ถ่ายรูปผ่านมือถือ'}
    </button>

    {showQR && (
      <div className="bg-white p-4 mb-4 rounded-xl border-2 border-blue-500 flex flex-col items-center shadow-lg">
        <p className="text-lg font-bold text-blue-900 mb-2">สแกนเพื่อถ่ายรูปรถ</p>
        <QRCodeSVG value={uploadUrl} size={150} />
        <p className="text-sm text-blue-500 mt-2 animate-pulse">เมื่อถ่ายเสร็จ รูปจะเด้งเข้าฟอร์มทันที</p>
      </div>
    )}
    // ... โค้ดฟิลด์กรอกข้อมูลเดิมของคุณทั้งหมด (วันที่ซื้อ, ยี่ห้อ, ฯลฯ) ...
