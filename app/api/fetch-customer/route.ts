import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    console.log('Fetching customer data for email:', email);

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get n8n webhook URL for customer data fetching from environment
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_FETCH_CUSTOMER_WEBHOOK_URL;

    console.log('Fetch customer webhook URL configured:', webhookUrl ? 'Yes' : 'No');

    if (!webhookUrl) {
      console.error('N8N fetch customer webhook URL not configured');
      return NextResponse.json(
        { error: 'Customer data fetch webhook URL not configured' },
        { status: 500 }
      );
    }

    console.log('Sending email to n8n webhook to fetch customer data...');

    // Send to n8n webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('n8n webhook response status:', response.status);

      if (!response.ok) {
        console.error('n8n webhook returned error:', response.status, response.statusText);
        return NextResponse.json(
          { error: 'Failed to fetch customer data from n8n' },
          { status: response.status }
        );
      }

      const customerData = await response.json();
      console.log('Customer data received from n8n');

      // Poll to ensure the order has been received by the webapp
      // This ensures the HTTP request from n8n has been processed before showing the form
      console.log('Waiting for order to be fully received by webapp...');

      const maxPollingAttempts = 10; // Poll for up to 10 seconds
      const pollingInterval = 1000; // 1 second between polls
      let pollingAttempts = 0;
      let orderReceived = false;

      while (pollingAttempts < maxPollingAttempts && !orderReceived) {
        // Check if order exists in the receive-order queue
        try {
          const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/receive-order`, {
            method: 'GET',
          });

          if (checkResponse.ok) {
            const queueData = await checkResponse.json();
            // Check if the order for this email exists in the queue
            const orderExists = queueData.orders?.some((order: any) => order.customerEmail === email);

            if (orderExists) {
              console.log('Order confirmed in webapp queue');
              orderReceived = true;
              break;
            }
          }
        } catch (pollError) {
          console.error('Error polling for order:', pollError);
        }

        pollingAttempts++;
        if (pollingAttempts < maxPollingAttempts) {
          console.log(`Polling attempt ${pollingAttempts}/${maxPollingAttempts}...`);
          await new Promise(resolve => setTimeout(resolve, pollingInterval));
        }
      }

      if (!orderReceived) {
        console.log('Order not confirmed in queue after polling, but proceeding with customer data');
      }

      // Return customer data
      return NextResponse.json({
        success: true,
        customerData,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        console.error('n8n webhook request timed out after 30 seconds');
        return NextResponse.json(
          { error: 'Customer data fetch request timed out' },
          { status: 500 }
        );
      }

      throw fetchError;
    }

  } catch (error: any) {
    console.error('Error fetching customer data:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching customer data' },
      { status: 500 }
    );
  }
}

