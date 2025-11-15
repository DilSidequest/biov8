export interface Order {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  currency: string;
  orderDate: string;
  lineItems?: string;
  shippingAddress?: string;
  tags?: string;
}

export interface FormData {
  customerEmail: string;
  doctorNotes: string;
  signaturePdf: File | null;
}

export interface OrderState {
  pendingOrders: Order[];
  selectedOrder: Order | null;
  isSubmitting: boolean;
}

