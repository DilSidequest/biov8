import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/connection';

/**
 * GET /api/search?query=<name or email>
 * Search for customers by name or email and return their order history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    console.log('[search GET] Searching for:', query);

    // Search for customers by name or email (case-insensitive, partial match)
    const searchQuery = `%${query.toLowerCase()}%`;
    
    const result = await pool.query(
      `SELECT 
        c.id as customer_id,
        c.email,
        c.name,
        c.created_at as customer_created_at,
        json_agg(
          json_build_object(
            'id', o.id,
            'orderId', o.order_id,
            'orderNumber', o.order_number,
            'orderDate', o.order_date,
            'totalAmount', o.total_amount,
            'currency', o.currency,
            'shippingAddress', o.shipping_address,
            'tags', o.tags,
            'sex', o.sex,
            'weight', o.weight,
            'height', o.height,
            'over18', o.over_18,
            'weightsatisfaction', o.weight_satisfaction,
            'dietdescription', o.diet_description,
            'SexualIssuesImpactRelationshipc', o.sexual_issues_impact_relationship,
            'WorriedAboutFastAgingc', o.worried_about_fast_aging,
            'LookOlderThanFeelc', o.look_older_than_feel,
            'DeclineInBalanceFunctionMentalc', o.decline_in_balance_function_mental,
            'OvertakenByAgingc', o.overtaken_by_aging,
            'AgingProcessImpactc', o.aging_process_impact,
            'InterestInSlowingAgingc', o.interest_in_slowing_aging,
            'LackOfMuscleMassStrengthImpactc', o.lack_of_muscle_mass_strength_impact,
            'DesiredMuscleMassDefinitionc', o.desired_muscle_mass_definition,
            'DesiredResponseToExercisec', o.desired_response_to_exercise,
            'MuscleFunctionImprovementImpactc', o.muscle_function_improvement_impact,
            'StepsTakenForMuscleHealthc', o.steps_taken_for_muscle_health,
            'EffectivenessOfActionsTakenc', o.effectiveness_of_actions_taken,
            'MentallySharpAsBeforec', o.mentally_sharp_as_before,
            'ConcernAboutCognitiveDeclinec', o.concern_about_cognitive_decline,
            'TakenActionsToImproveBrainFunctionc', o.taken_actions_to_improve_brain_function,
            'NutritionalSupportHelpsForBrainc', o.nutritional_support_helps_for_brain,
            'ConcernedAboutFutureBrainFunctionc', o.concerned_about_future_brain_function,
            'MoreUnwellThanBeforec', o.more_unwell_than_before,
            'LessEffectiveRecoveryThanBeforec', o.less_effective_recovery_than_before,
            'LessResilientThanBeforec', o.less_resilient_than_before,
            'ImmuneHealthHelpsOnOverallWellnessc', o.immune_health_helps_on_overall_wellness,
            'ImmuneSystemFunctioningWellc', o.immune_system_functioning_well,
            'ImmuneMeasuresImproveHealthc', o.immune_measures_improve_health,
            'SatisfiedWithGutHealthc', o.satisfied_with_gut_health,
            'TakenActionsToImproveGutHealthc', o.taken_actions_to_improve_gut_health,
            'StepsTakenForGutHealthc', o.steps_taken_for_gut_health,
            'GutHealthImproveOverallHealthc', o.gut_health_improve_overall_health,
            'SymptomsMightRelatedToGutHealthc', o.symptoms_might_related_to_gut_health,
            'ImpactOfBetterGutHealthc', o.impact_of_better_gut_health,
            'MentalHealthHistoryc', o.mental_health_history,
            'EverReceivedCounselingOrTreatmentc', o.ever_received_counseling_or_treatment,
            'CurrentMentalEmotionalStateRatingc', o.current_mental_emotional_state_rating,
            'DifficultySleepingc', o.difficulty_sleeping,
            'FeelRefreshedEagerUponWaking_c', o.feel_refreshed_eager_upon_waking,
            'createdAt', o.created_at
          ) ORDER BY o.created_at DESC
        ) as orders
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE LOWER(c.name) LIKE $1 OR LOWER(c.email) LIKE $1
      GROUP BY c.id, c.email, c.name, c.created_at
      ORDER BY c.created_at DESC
      LIMIT 50`,
      [searchQuery]
    );

    console.log(`[search GET] Found ${result.rows.length} customer(s)`);

    // Format the response
    const customers = result.rows.map(row => ({
      customerId: row.customer_id,
      email: row.email,
      name: row.name,
      customerCreatedAt: row.customer_created_at,
      orders: row.orders.filter((order: any) => order.id !== null) // Remove null orders (customers with no orders)
    }));

    return NextResponse.json({
      success: true,
      query: query,
      results: customers,
      count: customers.length
    });

  } catch (error) {
    console.error('[search GET] Error searching:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

