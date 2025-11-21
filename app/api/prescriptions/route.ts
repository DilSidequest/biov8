import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/connection';

/**
 * POST /api/prescriptions
 * Save a prescription to the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[prescriptions POST] Received prescription data');

    // Validate required fields
    const { 
      customerEmail,
      orderId,
      doctorName,
      medicineName,
      doctorNotes
    } = body;

    const missingFields = [];
    if (!customerEmail) missingFields.push('customerEmail');
    if (!orderId) missingFields.push('orderId');
    if (!doctorName) missingFields.push('doctorName');
    if (!medicineName) missingFields.push('medicineName');

    if (missingFields.length > 0) {
      console.error('[prescriptions POST] Missing required fields:', missingFields);
      return NextResponse.json(
        { error: 'Missing required fields', missingFields },
        { status: 400 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Get customer ID
      const customerResult = await client.query(
        'SELECT id FROM customers WHERE email = $1',
        [customerEmail]
      );

      if (customerResult.rows.length === 0) {
        throw new Error(`Customer with email ${customerEmail} not found`);
      }

      const customerId = customerResult.rows[0].id;

      // 2. Get order database ID
      const orderResult = await client.query(
        'SELECT id FROM orders WHERE order_id = $1 AND customer_id = $2',
        [orderId, customerId]
      );

      if (orderResult.rows.length === 0) {
        throw new Error(`Order ${orderId} not found for customer ${customerEmail}`);
      }

      const orderDbId = orderResult.rows[0].id;

      // 3. Insert prescription
      const prescriptionResult = await client.query(
        `INSERT INTO prescriptions (
          customer_id, order_id, doctor_name, clinic_state,
          medicine_name, medicine_quantity, medicine_description,
          doctor_notes, health_changes, health_changes_details,
          taking_medications, taking_medications_details,
          had_medication_before, pregnancy_status, allergic_reaction,
          allergies, allergies_details, medical_conditions,
          medical_conditions_details, signature_pdf_path
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING id`,
        [
          customerId,
          orderDbId,
          doctorName,
          body.clinicState,
          medicineName,
          body.medicineQuantity,
          body.medicineDescription,
          doctorNotes,
          body.healthChanges,
          body.healthChangesDetails,
          body.takingMedications,
          body.takingMedicationsDetails,
          body.hadMedicationBefore,
          body.pregnancyStatus,
          body.allergicReaction,
          body.allergies,
          body.allergiesDetails,
          body.medicalConditions,
          body.medicalConditionsDetails,
          body.signaturePdfPath
        ]
      );

      const prescriptionId = prescriptionResult.rows[0].id;
      console.log(`[prescriptions POST] Prescription ${prescriptionId} saved for order ${orderId}`);

      await client.query('COMMIT');
      client.release();

      return NextResponse.json({
        success: true,
        message: 'Prescription saved successfully',
        prescriptionId: prescriptionId,
        orderId: orderId,
        customerId: customerId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('[prescriptions POST] Error saving prescription:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/prescriptions?customerId=<id>&orderId=<id>
 * Get prescriptions for a customer or order
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const orderId = searchParams.get('orderId');

    if (!customerId && !orderId) {
      return NextResponse.json(
        { error: 'Either customerId or orderId is required' },
        { status: 400 }
      );
    }

    let query = `
      SELECT 
        p.*,
        c.email as customer_email,
        c.name as customer_name,
        o.order_id as order_external_id,
        o.order_number
      FROM prescriptions p
      JOIN customers c ON p.customer_id = c.id
      JOIN orders o ON p.order_id = o.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (customerId) {
      params.push(customerId);
      query += ` AND p.customer_id = $${params.length}`;
    }
    
    if (orderId) {
      params.push(orderId);
      query += ` AND o.order_id = $${params.length}`;
    }
    
    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);

    console.log(`[prescriptions GET] Found ${result.rows.length} prescription(s)`);

    return NextResponse.json({
      success: true,
      prescriptions: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('[prescriptions GET] Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

