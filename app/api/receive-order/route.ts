import { NextRequest, NextResponse } from 'next/server';

// This endpoint is called by n8n to add orders to the queue
// It stores the order in a way that the client can retrieve it

let orderQueue: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { orderId, orderNumber, customerName, customerEmail, totalAmount } = body;
    
    if (!orderId || !orderNumber || !customerName || !customerEmail || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add to queue
    orderQueue.push(body);

    return NextResponse.json({
      success: true,
      message: 'Order added to queue',
      orderId: orderId
    });

  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return all pending orders and clear the queue
  const orders = [...orderQueue];
  orderQueue = [];
  
  return NextResponse.json({
    orders
  });
}

