import { createClient } from '@supabase/supabase-js';

// ค่า URL ที่ได้จาก ID โปรเจกต์ของคุณ
const supabaseUrl = 'https://idzmwblubxpkblhjasev.supabase.co';

// ค่า Publishable key จากรูปภาพที่คุณส่งมา (กดปุ่ม Copy ไอคอนสี่เหลี่ยมซ้อนกัน)
const supabaseAnonKey = 'sb_publishable_AYaD1Ws1aIQEDNMOF0pOoA_xyI5SUnm'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);