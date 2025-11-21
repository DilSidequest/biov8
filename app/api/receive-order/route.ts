import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/connection';
import { ensureDatabaseInitialized } from '@/lib/db/init';

// This endpoint is called by n8n to save orders to the database
// It stores customer and order information for later retrieval

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();

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

    // Start a transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert or update customer
      const customerResult = await client.query(
        `INSERT INTO customers (email, name, created_at, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (email)
         DO UPDATE SET name = $2, updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [customerEmail, customerName]
      );

      const customerId = customerResult.rows[0].id;
      console.log(`[receive-order POST] Customer ${customerId} created/updated`);

      // 2. Insert order (check if order already exists)
      const existingOrder = await client.query(
        'SELECT id FROM orders WHERE order_id = $1',
        [orderId]
      );

      if (existingOrder.rows.length > 0) {
        console.log(`[receive-order POST] Order ${orderId} already exists, skipping insert`);
        await client.query('COMMIT');
        client.release();

        return NextResponse.json({
          success: true,
          message: 'Order already exists',
          orderId: orderId,
          customerId: customerId
        });
      }

      // Insert new order
      const orderResult = await client.query(
        `INSERT INTO orders (
          customer_id, order_id, order_number, order_date, total_amount, currency,
          shipping_address, tags, sex, weight, height, over_18,
          weight_satisfaction, diet_description, sexual_issues_impact_relationship,
          worried_about_fast_aging, look_older_than_feel, decline_in_balance_function_mental,
          overtaken_by_aging, aging_process_impact, interest_in_slowing_aging,
          lack_of_muscle_mass_strength_impact, desired_muscle_mass_definition,
          desired_response_to_exercise, muscle_function_improvement_impact,
          steps_taken_for_muscle_health, effectiveness_of_actions_taken,
          mentally_sharp_as_before, concern_about_cognitive_decline,
          taken_actions_to_improve_brain_function, nutritional_support_helps_for_brain,
          concerned_about_future_brain_function, more_unwell_than_before,
          less_effective_recovery_than_before, less_resilient_than_before,
          immune_health_helps_on_overall_wellness, immune_system_functioning_well,
          immune_measures_improve_health, satisfied_with_gut_health,
          taken_actions_to_improve_gut_health, steps_taken_for_gut_health,
          gut_health_improve_overall_health, symptoms_might_related_to_gut_health,
          impact_of_better_gut_health, mental_health_history,
          ever_received_counseling_or_treatment, current_mental_emotional_state_rating,
          difficulty_sleeping, feel_refreshed_eager_upon_waking
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49
        ) RETURNING id`,
        [
          customerId,
          orderId,
          orderNumber,
          body.orderDate || new Date().toISOString(),
          body.totalAmount,
          body.currency,
          body.shippingAddress,
          body.tags,
          body.Sex,
          body.Weight,
          body.Height,
          body.Over18c,
          body.weightsatisfaction,
          body.dietdescription,
          body.SexualIssuesImpactRelationshipc,
          body.WorriedAboutFastAgingc,
          body.LookOlderThanFeelc,
          body.DeclineInBalanceFunctionMentalc,
          body.OvertakenByAgingc,
          body.AgingProcessImpactc,
          body.InterestInSlowingAgingc,
          body.LackOfMuscleMassStrengthImpactc,
          body.DesiredMuscleMassDefinitionc,
          body.DesiredResponseToExercisec,
          body.MuscleFunctionImprovementImpactc,
          body.StepsTakenForMuscleHealthc,
          body.EffectivenessOfActionsTakenc,
          body.MentallySharpAsBeforec,
          body.ConcernAboutCognitiveDeclinec,
          body.TakenActionsToImproveBrainFunctionc,
          body.NutritionalSupportHelpsForBrainc,
          body.ConcernedAboutFutureBrainFunctionc,
          body.MoreUnwellThanBeforec,
          body.LessEffectiveRecoveryThanBeforec,
          body.LessResilientThanBeforec,
          body.ImmuneHealthHelpsOnOverallWellnessc,
          body.ImmuneSystemFunctioningWellc,
          body.ImmuneMeasuresImproveHealthc,
          body.SatisfiedWithGutHealthc,
          body.TakenActionsToImproveGutHealthc,
          body.StepsTakenForGutHealthc,
          body.GutHealthImproveOverallHealthc,
          body.SymptomsMightRelatedToGutHealthc,
          body.ImpactOfBetterGutHealthc,
          body.MentalHealthHistoryc,
          body.EverReceivedCounselingOrTreatmentc,
          body.CurrentMentalEmotionalStateRatingc,
          body.DifficultySleepingc,
          body.FeelRefreshedEagerUponWaking_c
        ]
      );

      const orderDbId = orderResult.rows[0].id;
      console.log(`[receive-order POST] Order ${orderId} saved to database with ID ${orderDbId}`);

      await client.query('COMMIT');
      client.release();

      return NextResponse.json({
        success: true,
        message: 'Order saved to database',
        orderId: orderId,
        customerId: customerId,
        orderDbId: orderDbId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('[receive-order POST] Error processing order:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

