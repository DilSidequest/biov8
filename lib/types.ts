export interface Order {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount?: string;
  currency?: string;
  orderDate: string;
  lineItems?: string;
  shippingAddress?: string;
  tags?: string;
  // Basic Patient Information
  Sex?: string;
  Weight?: string;
  Height?: string;
  Over18c?: string;
  // Weight & Diet
  weightsatisfaction?: string;
  dietdescription?: string;
  // Sexual Health
  SexualIssuesImpactRelationshipc?: string;
  // Aging & Appearance
  WorriedAboutFastAgingc?: string;
  LookOlderThanFeelc?: string;
  DeclineInBalanceFunctionMentalc?: string;
  OvertakenByAgingc?: string;
  AgingProcessImpactc?: string;
  InterestInSlowingAgingc?: string;
  // Muscle Health
  LackOfMuscleMassStrengthImpactc?: string;
  DesiredMuscleMassDefinitionc?: string;
  DesiredResponseToExercisec?: string;
  MuscleFunctionImprovementImpactc?: string;
  StepsTakenForMuscleHealthc?: string;
  EffectivenessOfActionsTakenc?: string;
  // Cognitive/Brain Function
  MentallySharpAsBeforec?: string;
  ConcernAboutCognitiveDeclinec?: string;
  TakenActionsToImproveBrainFunctionc?: string;
  NutritionalSupportHelpsForBrainc?: string;
  ConcernedAboutFutureBrainFunctionc?: string;
  // Immune System
  MoreUnwellThanBeforec?: string;
  LessEffectiveRecoveryThanBeforec?: string;
  LessResilientThanBeforec?: string;
  ImmuneHealthHelpsOnOverallWellnessc?: string;
  ImmuneSystemFunctioningWellc?: string;
  ImmuneMeasuresImproveHealthc?: string;
  // Gut Health
  SatisfiedWithGutHealthc?: string;
  TakenActionsToImproveGutHealthc?: string;
  StepsTakenForGutHealthc?: string;
  GutHealthImproveOverallHealthc?: string;
  SymptomsMightRelatedToGutHealthc?: string;
  ImpactOfBetterGutHealthc?: string;
  // Mental Health
  MentalHealthHistoryc?: string;
  EverReceivedCounselingOrTreatmentc?: string;
  CurrentMentalEmotionalStateRatingc?: string;
  // Sleep & Energy
  DifficultySleepingc?: string;
  FeelRefreshedEagerUponWaking_c?: string;
  [key: string]: any; // Allow any additional fields
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

