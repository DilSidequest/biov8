import { NextRequest, NextResponse } from 'next/server';

// This endpoint is called by n8n to add orders to the queue
// It stores the order in a way that the client can retrieve it

let orderQueue: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[receive-order POST] Received order data:', JSON.stringify(body, null, 2));

    // Validate required fields
    const { orderId, orderNumber, customerName, customerEmail } = body;

    // Check which fields are missing
    const missingFields = [];
    if (!orderId) missingFields.push('orderId');
    if (!orderNumber) missingFields.push('orderNumber');
    if (!customerName) missingFields.push('customerName');
    if (!customerEmail) missingFields.push('customerEmail');

    if (missingFields.length > 0) {
      console.error('[receive-order POST] Missing required fields:', missingFields);
      console.error('[receive-order POST] Received values:', { orderId, orderNumber, customerName, customerEmail });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields: missingFields,
          received: { orderId, orderNumber, customerName, customerEmail }
        },
        { status: 400 }
      );
    }

    // Add to queue
    orderQueue.push(body);
    console.log(`[receive-order POST] Order ${orderId} added to queue. Queue length: ${orderQueue.length}`);

    return NextResponse.json({
      success: true,
      message: 'Order added to queue',
      orderId: orderId
    });

  } catch (error) {
    console.error('[receive-order POST] Error processing order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return all pending orders and clear the queue
  const orders = [...orderQueue];
  console.log(`[receive-order GET] Returning ${orders.length} order(s) from queue`);
  orderQueue = [];

  return NextResponse.json({
    orders
  });
}

