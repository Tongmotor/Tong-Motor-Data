
export enum CarStatus {
  AVAILABLE = 'พร้อมขาย',
  SOLD = 'ขายแล้ว'
}

export enum TransferType {
  SELF = 'โอนเอง',
  SHOP = 'โอนให้'
}

export interface Motorcycle {
  id: string;
  image_url?: string;
  status: CarStatus;
  
  // รายละเอียดตัวรถ (ร้านซื้อมา)
  purchase_date: string;
  brand: string;
  model_type: string;
  year_model: string;
  reg_date: string;
  reg_number: string;
  reg_province: string;
  color: string;
  chassis_number: string;
  chassis_location: string;
  engine_brand: string;
  engine_number: string;
  cylinders: string;
  cc: string;
  
  // ข้อมูลเจ้าของเดิม
  original_owner_name: string;
  id_card_number: string;
  birth_date: string;
  nationality: string;
  original_owner_address: string;

  // รายละเอียดการขาย (ผู้ซื้อใหม่)
  sale_date: string;
  buyer_name: string;
  buyer_address: string;
  sale_price: string;
  transfer_type: TransferType;
  transfer_details: string;
  received_book_date: string;
}
