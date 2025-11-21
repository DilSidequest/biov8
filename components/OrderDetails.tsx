'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/lib/types';

interface OrderDetailsProps {
  order: Order | null;
  onSubmitSuccess: (orderId: string) => void;
}

export default function OrderDetails({ order, onSubmitSuccess }: OrderDetailsProps) {
  // Step 1: Email lookup state
  const [step, setStep] = useState<'email-lookup' | 'form'>('email-lookup');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerData, setCustomerData] = useState<Order | null>(null);
  const [isFetchingCustomer, setIsFetchingCustomer] = useState(false);

  // Form fields
  const [doctorName, setDoctorName] = useState('');
  const [clinicState, setClinicState] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [medicineQuantity, setMedicineQuantity] = useState('');
  const [medicineDescription, setMedicineDescription] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [signaturePdf, setSignaturePdf] = useState<File | null>(null);

  // Health Assessment fields
  const [healthChanges, setHealthChanges] = useState('');
  const [healthChangesDetails, setHealthChangesDetails] = useState('');
  const [takingMedications, setTakingMedications] = useState('');
  const [takingMedicationsDetails, setTakingMedicationsDetails] = useState('');
  const [hadMedicationBefore, setHadMedicationBefore] = useState('');
  const [pregnancyStatus, setPregnancyStatus] = useState('');
  const [allergicReaction, setAllergicReaction] = useState('');
  const [allergies, setAllergies] = useState('');
  const [allergiesDetails, setAllergiesDetails] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [medicalConditionsDetails, setMedicalConditionsDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when starting over
  const resetForm = () => {
    setStep('email-lookup');
    setCustomerEmail('');
    setCustomerData(null);
    setDoctorName('');
    setClinicState('');
    setMedicineName('');
    setMedicineQuantity('');
    setMedicineDescription('');
    setDoctorNotes('');
    setSignaturePdf(null);
    setHealthChanges('');
    setHealthChangesDetails('');
    setTakingMedications('');
    setTakingMedicationsDetails('');
    setHadMedicationBefore('');
    setPregnancyStatus('');
    setAllergicReaction('');
    setAllergies('');
    setAllergiesDetails('');
    setMedicalConditions('');
    setMedicalConditionsDetails('');
    setError('');
    setSuccess('');
  };

  // When order prop changes, automatically load it into the form
  useEffect(() => {
    if (order) {
      // Order was selected from the pending list, load it directly
      console.log('[OrderDetails] Order selected from pending list:', order.orderId, order.orderNumber);
      setCustomerData(order);
      setCustomerEmail(order.customerEmail);
      setStep('form');
      setError('');
      setSuccess('');
    } else {
      // No order selected, reset to email lookup
      console.log('[OrderDetails] No order selected, resetting form');
      resetForm();
    }
  }, [order]);

  // Handle email lookup
  const handleEmailLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsFetchingCustomer(true);

    // Start timer for minimum loading time (10 seconds)
    const startTime = Date.now();
    const minimumLoadingTime = 10000; // 10 seconds in milliseconds

    try {
      const response = await fetch('/api/fetch-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: customerEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch customer data');
      }

      const data = await response.json();

      // Calculate remaining time to meet minimum loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

      // Wait for remaining time if needed
      if (remainingTime > 0) {
        console.log(`[OrderDetails] Waiting ${remainingTime}ms to meet minimum loading time`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      if (data.success && data.customerData) {
        setCustomerData(data.customerData);
        setStep('form');
        setSuccess('Customer data loaded successfully!');
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err: any) {
      // Even on error, wait for minimum loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setError(err.message || 'Failed to fetch customer data. Please try again.');
      console.error('Customer fetch error:', err);
    } finally {
      setIsFetchingCustomer(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - accept images and PDFs
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf'
    ];

    if (!validTypes.includes(file.type)) {
      setError('Please upload an image file (JPEG, PNG, GIF, WebP, SVG) or PDF');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSignaturePdf(file);
    setError('');
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., data:image/png;base64, or data:application/pdf;base64,)
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData) return;

    setError('');
    setSuccess('');

    // Validate form
    if (!doctorName || doctorName.trim().length < 2) {
      setError('Doctor\'s name is required (minimum 2 characters)');
      return;
    }

    if (!clinicState || clinicState.trim().length < 2) {
      setError('Clinic state is required');
      return;
    }

    if (!medicineName || medicineName.trim().length < 2) {
      setError('Medicine name is required');
      return;
    }

    if (!medicineQuantity || medicineQuantity.trim().length < 1) {
      setError('Medicine quantity is required');
      return;
    }

    if (!medicineDescription || medicineDescription.trim().length < 5) {
      setError('Medicine description is required (minimum 5 characters)');
      return;
    }

    if (!doctorNotes || doctorNotes.length < 10) {
      setError('Doctor\'s notes must be at least 10 characters');
      return;
    }

    if (!signaturePdf) {
      setError('Please upload a signature file');
      return;
    }

    // Validate health assessment fields
    if (!healthChanges) {
      setError('Please answer if the patient had any health changes');
      return;
    }

    if (!takingMedications) {
      setError('Please answer if the patient is taking any medications');
      return;
    }

    if (!hadMedicationBefore) {
      setError('Please answer if the patient had this medication before');
      return;
    }

    if (!pregnancyStatus) {
      setError('Please answer about pregnancy/breastfeeding status');
      return;
    }

    if (!allergicReaction) {
      setError('Please answer if the patient had allergic reactions to medication');
      return;
    }

    if (!allergies) {
      setError('Please answer if the patient has any allergies');
      return;
    }

    if (!medicalConditions) {
      setError('Please answer if the patient has any current medical conditions');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert file to base64
      const signatureBase64 = await convertFileToBase64(signaturePdf);

      // Prepare payload for prescription API
      const payload = {
        // Required fields
        customerEmail: customerData.customerEmail,
        orderId: customerData.orderId,
        doctorName,
        medicineName,
        doctorNotes,
        // Optional fields
        clinicState,
        medicineQuantity,
        medicineDescription,
        signaturePdfPath: signatureBase64, // Store as base64 for now
        // Health Assessment
        healthChanges,
        healthChangesDetails: healthChanges === 'yes' ? healthChangesDetails : null,
        takingMedications,
        takingMedicationsDetails: takingMedications === 'yes' ? takingMedicationsDetails : null,
        hadMedicationBefore,
        pregnancyStatus,
        allergicReaction,
        allergies,
        allergiesDetails: allergies === 'yes' ? allergiesDetails : null,
        medicalConditions,
        medicalConditionsDetails: medicalConditions === 'yes' ? medicalConditionsDetails : null,
      };

      console.log('[OrderDetails] Submitting prescription to database...');

      // Submit to prescription API
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      const result = await response.json();
      console.log('[OrderDetails] Prescription saved:', result);

      setSuccess('Prescription saved successfully to database!');

      // Reset form after a short delay
      setTimeout(() => {
        resetForm();
        if (customerData.orderId) {
          onSubmitSuccess(customerData.orderId);
        }
      }, 2000);

    } catch (err) {
      setError(`Failed to save prescription: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = customerData &&
    doctorName.trim().length >= 2 &&
    clinicState.trim().length >= 2 &&
    medicineName.trim().length >= 2 &&
    medicineQuantity.trim().length >= 1 &&
    medicineDescription.trim().length >= 5 &&
    doctorNotes.length >= 10 &&
    signaturePdf &&
    healthChanges &&
    takingMedications &&
    hadMedicationBefore &&
    pregnancyStatus &&
    allergicReaction &&
    allergies &&
    medicalConditions;

  // Step 1: Show loading state while fetching customer data (highest priority)
  if (isFetchingCustomer) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-blue-500 mb-4">
            <svg className="w-24 h-24 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-slate-300 font-medium text-xl">Fetching customer data...</p>
          <p className="text-slate-500 text-sm mt-2">Please wait while we load the information</p>
        </div>
      </div>
    );
  }

  // Step 2: Email Lookup Form
  if (step === 'email-lookup') {
    return (
      <div className="h-full flex flex-col bg-slate-900">
        <div className="p-6 border-b border-slate-700 bg-slate-800">
          <h2 className="text-2xl font-bold text-slate-100 text-center">Prescription Generation</h2>
          <p className="text-sm text-slate-400 mt-2 text-center">Enter customer email to fetch information</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <form onSubmit={handleEmailLookup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
                  Customer Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter customer email address"
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  required
                  disabled={isFetchingCustomer}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <p className="text-green-300 text-sm text-center">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!customerEmail || isFetchingCustomer}
                className={`
                  w-full py-4 px-6 rounded-lg font-semibold text-white transition-all text-lg
                  ${customerEmail && !isFetchingCustomer
                    ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-lg hover:shadow-xl'
                    : 'bg-slate-700 cursor-not-allowed'
                  }
                `}
              >
                {isFetchingCustomer ? 'Fetching Customer Data...' : 'Fetch Customer Information'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Full Form (after customer data is fetched)
  if (!customerData) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-slate-600 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-300 font-medium text-xl">No customer data loaded</p>
          <p className="text-slate-500 text-sm mt-2">Please fetch customer information first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="p-6 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center justify-between">
          <button
            onClick={resetForm}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            title="Start over"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-100 text-center">Prescription Form</h2>
            <p className="text-sm text-slate-400 mt-2 text-center">Order #{customerData.orderNumber}</p>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          {/* Customer Information Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 text-center">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Number:</span>
                <span className="text-slate-200 font-semibold">#{customerData.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer Name:</span>
                <span className="text-slate-200">{customerData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{customerData.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Order Date:</span>
                <span className="text-slate-200">{new Date(customerData.orderDate).toLocaleDateString()}</span>
              </div>
              {customerData.totalAmount && customerData.currency && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Amount:</span>
                  <span className="text-slate-200">{customerData.currency} {customerData.totalAmount}</span>
                </div>
              )}
              {customerData.shippingAddress && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipping Address:</span>
                  <span className="text-slate-200 text-right">{customerData.shippingAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Patient Health Assessment - Comprehensive */}
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-blue-100 mb-6 text-center">📋 Patient Health Assessment</h3>

            {/* Basic Patient Information */}
            {(customerData.Sex || customerData.Weight || customerData.Height || customerData.Over18c) && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-200 mb-3 border-b border-blue-700 pb-2">Basic Patient Information</h4>
                <div className="space-y-2">
                  {customerData.Sex && customerData.Sex !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sex:</span>
                      <span className="text-slate-200">{customerData.Sex}</span>
                    </div>
                  )}
                  {customerData.Weight && customerData.Weight !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weight:</span>
                      <span className="text-slate-200">{customerData.Weight}</span>
                    </div>
                  )}
                  {customerData.Height && customerData.Height !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Height:</span>
                      <span className="text-slate-200">{customerData.Height}</span>
                    </div>
                  )}
                  {customerData.Over18c && customerData.Over18c !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Over 18:</span>
                      <span className="text-slate-200">{customerData.Over18c}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weight & Diet */}
            {(customerData.weightsatisfaction || customerData.dietdescription) && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-200 mb-3 border-b border-blue-700 pb-2">Weight & Diet</h4>
                <div className="space-y-2">
                  {customerData.weightsatisfaction && customerData.weightsatisfaction !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weight Satisfaction:</span>
                      <span className="text-slate-200">{customerData.weightsatisfaction}</span>
                    </div>
                  )}
                  {customerData.dietdescription && customerData.dietdescription !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Diet Description:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.dietdescription}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sexual Health */}
            {customerData.SexualIssuesImpactRelationshipc && customerData.SexualIssuesImpactRelationshipc !== "Not Provided" && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-200 mb-3 border-b border-blue-700 pb-2">Sexual Health</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sexual Issues Impact Relationship:</span>
                    <span className="text-slate-200">{customerData.SexualIssuesImpactRelationshipc}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Aging & Appearance */}
            {(customerData.WorriedAboutFastAgingc || customerData.LookOlderThanFeelc || customerData.DeclineInBalanceFunctionMentalc ||
              customerData.OvertakenByAgingc || customerData.AgingProcessImpactc || customerData.InterestInSlowingAgingc) && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-200 mb-3 border-b border-blue-700 pb-2">Aging & Appearance</h4>
                <div className="space-y-2">
                  {customerData.WorriedAboutFastAgingc && customerData.WorriedAboutFastAgingc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Worried About Fast Aging:</span>
                      <span className="text-slate-200">{customerData.WorriedAboutFastAgingc}</span>
                    </div>
                  )}
                  {customerData.LookOlderThanFeelc && customerData.LookOlderThanFeelc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Look Older Than Feel:</span>
                      <span className="text-slate-200">{customerData.LookOlderThanFeelc}</span>
                    </div>
                  )}
                  {customerData.DeclineInBalanceFunctionMentalc && customerData.DeclineInBalanceFunctionMentalc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Decline In Balance/Function/Mental:</span>
                      <span className="text-slate-200">{customerData.DeclineInBalanceFunctionMentalc}</span>
                    </div>
                  )}
                  {customerData.OvertakenByAgingc && customerData.OvertakenByAgingc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Overtaken By Aging:</span>
                      <span className="text-slate-200">{customerData.OvertakenByAgingc}</span>
                    </div>
                  )}
                  {customerData.AgingProcessImpactc && customerData.AgingProcessImpactc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Aging Process Impact:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.AgingProcessImpactc}</span>
                    </div>
                  )}
                  {customerData.InterestInSlowingAgingc && customerData.InterestInSlowingAgingc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Interest In Slowing Aging:</span>
                      <span className="text-slate-200">{customerData.InterestInSlowingAgingc}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Muscle Health */}
            {(customerData.LackOfMuscleMassStrengthImpactc || customerData.DesiredMuscleMassDefinitionc || customerData.DesiredResponseToExercisec ||
              customerData.MuscleFunctionImprovementImpactc || customerData.StepsTakenForMuscleHealthc || customerData.EffectivenessOfActionsTakenc) && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-200 mb-3 border-b border-blue-700 pb-2">Muscle Health</h4>
                <div className="space-y-2">
                  {customerData.LackOfMuscleMassStrengthImpactc && customerData.LackOfMuscleMassStrengthImpactc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lack Of Muscle Mass/Strength Impact:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.LackOfMuscleMassStrengthImpactc}</span>
                    </div>
                  )}
                  {customerData.DesiredMuscleMassDefinitionc && customerData.DesiredMuscleMassDefinitionc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Desired Muscle Mass/Definition:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.DesiredMuscleMassDefinitionc}</span>
                    </div>
                  )}
                  {customerData.DesiredResponseToExercisec && customerData.DesiredResponseToExercisec !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Desired Response To Exercise:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.DesiredResponseToExercisec}</span>
                    </div>
                  )}
                  {customerData.MuscleFunctionImprovementImpactc && customerData.MuscleFunctionImprovementImpactc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Muscle Function Improvement Impact:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.MuscleFunctionImprovementImpactc}</span>
                    </div>
                  )}
                  {customerData.StepsTakenForMuscleHealthc && customerData.StepsTakenForMuscleHealthc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Steps Taken For Muscle Health:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.StepsTakenForMuscleHealthc}</span>
                    </div>
                  )}
                  {customerData.EffectivenessOfActionsTakenc && customerData.EffectivenessOfActionsTakenc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Effectiveness Of Actions Taken:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.EffectivenessOfActionsTakenc}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cognitive/Brain Function */}
            {(customerData.MentallySharpAsBeforec || customerData.ConcernAboutCognitiveDeclinec || customerData.TakenActionsToImproveBrainFunctionc ||
              customerData.NutritionalSupportHelpsForBrainc || customerData.ConcernedAboutFutureBrainFunctionc) && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-200 mb-3 border-b border-blue-700 pb-2">Cognitive/Brain Function</h4>
                <div className="space-y-2">
                  {customerData.MentallySharpAsBeforec && customerData.MentallySharpAsBeforec !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mentally Sharp As Before:</span>
                      <span className="text-slate-200">{customerData.MentallySharpAsBeforec}</span>
                    </div>
                  )}
                  {customerData.ConcernAboutCognitiveDeclinec && customerData.ConcernAboutCognitiveDeclinec !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Concern About Cognitive Decline:</span>
                      <span className="text-slate-200">{customerData.ConcernAboutCognitiveDeclinec}</span>
                    </div>
                  )}
                  {customerData.TakenActionsToImproveBrainFunctionc && customerData.TakenActionsToImproveBrainFunctionc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Taken Actions To Improve Brain Function:</span>
                      <span className="text-slate-200">{customerData.TakenActionsToImproveBrainFunctionc}</span>
                    </div>
                  )}
                  {customerData.NutritionalSupportHelpsForBrainc && customerData.NutritionalSupportHelpsForBrainc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nutritional Support Helps For Brain:</span>
                      <span className="text-slate-200">{customerData.NutritionalSupportHelpsForBrainc}</span>
                    </div>
                  )}
                  {customerData.ConcernedAboutFutureBrainFunctionc && customerData.ConcernedAboutFutureBrainFunctionc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Concerned About Future Brain Function:</span>
                      <span className="text-slate-200">{customerData.ConcernedAboutFutureBrainFunctionc}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Immune System */}
            {(customerData.MoreUnwellThanBeforec || customerData.LessEffectiveRecoveryThanBeforec || customerData.LessResilientThanBeforec ||
              customerData.ImmuneHealthHelpsOnOverallWellnessc || customerData.ImmuneSystemFunctioningWellc || customerData.ImmuneMeasuresImproveHealthc) && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-200 mb-3 border-b border-blue-700 pb-2">Immune System</h4>
                <div className="space-y-2">
                  {customerData.MoreUnwellThanBeforec && customerData.MoreUnwellThanBeforec !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">More Unwell Than Before:</span>
                      <span className="text-slate-200">{customerData.MoreUnwellThanBeforec}</span>
                    </div>
                  )}
                  {customerData.LessEffectiveRecoveryThanBeforec && customerData.LessEffectiveRecoveryThanBeforec !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Less Effective Recovery Than Before:</span>
                      <span className="text-slate-200">{customerData.LessEffectiveRecoveryThanBeforec}</span>
                    </div>
                  )}
                  {customerData.LessResilientThanBeforec && customerData.LessResilientThanBeforec !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Less Resilient Than Before:</span>
                      <span className="text-slate-200">{customerData.LessResilientThanBeforec}</span>
                    </div>
                  )}
                  {customerData.ImmuneHealthHelpsOnOverallWellnessc && customerData.ImmuneHealthHelpsOnOverallWellnessc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Immune Health Helps On Overall Wellness:</span>
                      <span className="text-slate-200">{customerData.ImmuneHealthHelpsOnOverallWellnessc}</span>
                    </div>
                  )}
                  {customerData.ImmuneSystemFunctioningWellc && customerData.ImmuneSystemFunctioningWellc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Immune System Functioning Well:</span>
                      <span className="text-slate-200">{customerData.ImmuneSystemFunctioningWellc}</span>
                    </div>
                  )}
                  {customerData.ImmuneMeasuresImproveHealthc && customerData.ImmuneMeasuresImproveHealthc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Immune Measures Improve Health:</span>
                      <span className="text-slate-200">{customerData.ImmuneMeasuresImproveHealthc}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gut Health */}
            {(customerData.SatisfiedWithGutHealthc || customerData.TakenActionsToImproveGutHealthc || customerData.StepsTakenForGutHealthc ||
              customerData.GutHealthImproveOverallHealthc || customerData.SymptomsMightRelatedToGutHealthc || customerData.ImpactOfBetterGutHealthc) && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-200 mb-3 border-b border-blue-700 pb-2">Gut Health</h4>
                <div className="space-y-2">
                  {customerData.SatisfiedWithGutHealthc && customerData.SatisfiedWithGutHealthc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Satisfied With Gut Health:</span>
                      <span className="text-slate-200">{customerData.SatisfiedWithGutHealthc}</span>
                    </div>
                  )}
                  {customerData.TakenActionsToImproveGutHealthc && customerData.TakenActionsToImproveGutHealthc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Taken Actions To Improve Gut Health:</span>
                      <span className="text-slate-200">{customerData.TakenActionsToImproveGutHealthc}</span>
                    </div>
                  )}
                  {customerData.StepsTakenForGutHealthc && customerData.StepsTakenForGutHealthc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Steps Taken For Gut Health:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.StepsTakenForGutHealthc}</span>
                    </div>
                  )}
                  {customerData.GutHealthImproveOverallHealthc && customerData.GutHealthImproveOverallHealthc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gut Health Improve Overall Health:</span>
                      <span className="text-slate-200">{customerData.GutHealthImproveOverallHealthc}</span>
                    </div>
                  )}
                  {customerData.SymptomsMightRelatedToGutHealthc && customerData.SymptomsMightRelatedToGutHealthc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Symptoms Might Related To Gut Health:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.SymptomsMightRelatedToGutHealthc}</span>
                    </div>
                  )}
                  {customerData.ImpactOfBetterGutHealthc && customerData.ImpactOfBetterGutHealthc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Impact Of Better Gut Health:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.ImpactOfBetterGutHealthc}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mental Health */}
            {(customerData.MentalHealthHistoryc || customerData.EverReceivedCounselingOrTreatmentc || customerData.CurrentMentalEmotionalStateRatingc) && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-200 mb-3 border-b border-blue-700 pb-2">Mental Health</h4>
                <div className="space-y-2">
                  {customerData.MentalHealthHistoryc && customerData.MentalHealthHistoryc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mental Health History:</span>
                      <span className="text-slate-200 text-right max-w-md">{customerData.MentalHealthHistoryc}</span>
                    </div>
                  )}
                  {customerData.EverReceivedCounselingOrTreatmentc && customerData.EverReceivedCounselingOrTreatmentc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ever Received Counseling Or Treatment:</span>
                      <span className="text-slate-200">{customerData.EverReceivedCounselingOrTreatmentc}</span>
                    </div>
                  )}
                  {customerData.CurrentMentalEmotionalStateRatingc && customerData.CurrentMentalEmotionalStateRatingc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Mental/Emotional State Rating:</span>
                      <span className="text-slate-200">{customerData.CurrentMentalEmotionalStateRatingc}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sleep & Energy */}
            {(customerData.DifficultySleepingc || customerData.FeelRefreshedEagerUponWaking_c) && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-200 mb-3 border-b border-blue-700 pb-2">Sleep & Energy</h4>
                <div className="space-y-2">
                  {customerData.DifficultySleepingc && customerData.DifficultySleepingc !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Difficulty Sleeping:</span>
                      <span className="text-slate-200">{customerData.DifficultySleepingc}</span>
                    </div>
                  )}
                  {customerData.FeelRefreshedEagerUponWaking_c && customerData.FeelRefreshedEagerUponWaking_c !== "Not Provided" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Feel Refreshed/Eager Upon Waking:</span>
                      <span className="text-slate-200">{customerData.FeelRefreshedEagerUponWaking_c}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Doctor's Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
              Doctor&apos;s Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Enter doctor's full name"
              className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              required
            />
          </div>

          {/* Clinic State */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
              Clinic State <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={clinicState}
              onChange={(e) => setClinicState(e.target.value)}
              placeholder="Enter state (e.g., NSW, VIC, QLD)"
              className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              required
            />
          </div>

          {/* Medicine Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
              Medicine Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="Enter medicine name"
              className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              required
            />
          </div>

          {/* Medicine Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
              Medicine Quantity <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={medicineQuantity}
              onChange={(e) => setMedicineQuantity(e.target.value)}
              placeholder="Enter quantity (e.g., 30 tablets, 100ml)"
              className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              required
            />
          </div>

          {/* Medicine Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
              Medicine Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={medicineDescription}
              onChange={(e) => setMedicineDescription(e.target.value)}
              placeholder="Enter dosage instructions and usage details..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-sm text-slate-400 mt-2 text-center">
              {medicineDescription.length} characters (minimum 5)
            </p>
          </div>

          {/* Doctor's Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
              Doctor&apos;s Notes <span className="text-red-400">*</span>
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Enter prescription details and medical notes..."
              rows={8}
              className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-sm text-slate-400 mt-2 text-center">
              {doctorNotes.length} / 5000 characters (minimum 10)
            </p>
          </div>

          {/* Signature Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
              Signature Image <span className="text-red-400">*</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,.pdf"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            {signaturePdf && (
              <p className="text-sm text-green-400 mt-2 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {signaturePdf.name}
              </p>
            )}
            <p className="text-sm text-slate-400 mt-2 text-center">
              Accepts: JPEG, PNG, GIF, WebP, SVG, or PDF (Max: 5MB)
            </p>
          </div>

          {/* Health Assessment Section */}
          <div className="border-t border-slate-600 pt-6 mt-6">
            <h3 className="text-xl font-bold text-slate-100 mb-4 text-center">Patient Health Assessment</h3>

            {/* Health Changes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Has the patient had any health changes in the past 6 months? <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="healthChanges"
                    value="yes"
                    checked={healthChanges === 'yes'}
                    onChange={(e) => setHealthChanges(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="healthChanges"
                    value="no"
                    checked={healthChanges === 'no'}
                    onChange={(e) => setHealthChanges(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">No</span>
                </label>
              </div>
              {healthChanges === 'yes' && (
                <textarea
                  value={healthChangesDetails}
                  onChange={(e) => setHealthChangesDetails(e.target.value)}
                  placeholder="Please describe the health changes..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              )}
            </div>

            {/* Taking Medications */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Is the patient taking any medications? (Include vitamins and supplements) <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="takingMedications"
                    value="yes"
                    checked={takingMedications === 'yes'}
                    onChange={(e) => setTakingMedications(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="takingMedications"
                    value="no"
                    checked={takingMedications === 'no'}
                    onChange={(e) => setTakingMedications(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">No</span>
                </label>
              </div>
              {takingMedications === 'yes' && (
                <textarea
                  value={takingMedicationsDetails}
                  onChange={(e) => setTakingMedicationsDetails(e.target.value)}
                  placeholder="Please list all medications, vitamins, and supplements..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              )}
            </div>

            {/* Had Medication Before */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Has the patient had this medication before? <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="hadMedicationBefore"
                    value="yes"
                    checked={hadMedicationBefore === 'yes'}
                    onChange={(e) => setHadMedicationBefore(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="hadMedicationBefore"
                    value="no"
                    checked={hadMedicationBefore === 'no'}
                    onChange={(e) => setHadMedicationBefore(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">No</span>
                </label>
              </div>
            </div>

            {/* Pregnancy Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Is the patient trying to conceive, pregnant, or breastfeeding? <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pregnancyStatus"
                    value="yes"
                    checked={pregnancyStatus === 'yes'}
                    onChange={(e) => setPregnancyStatus(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pregnancyStatus"
                    value="no"
                    checked={pregnancyStatus === 'no'}
                    onChange={(e) => setPregnancyStatus(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">No</span>
                </label>
              </div>
            </div>

            {/* Allergic Reaction */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Has the patient ever had an allergic reaction to any medication? <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="allergicReaction"
                    value="yes"
                    checked={allergicReaction === 'yes'}
                    onChange={(e) => setAllergicReaction(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="allergicReaction"
                    value="no"
                    checked={allergicReaction === 'no'}
                    onChange={(e) => setAllergicReaction(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">No</span>
                </label>
              </div>
            </div>

            {/* Allergies */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Does the patient have any allergies? <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="allergies"
                    value="yes"
                    checked={allergies === 'yes'}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="allergies"
                    value="no"
                    checked={allergies === 'no'}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">No</span>
                </label>
              </div>
              {allergies === 'yes' && (
                <textarea
                  value={allergiesDetails}
                  onChange={(e) => setAllergiesDetails(e.target.value)}
                  placeholder="Please list all allergies..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              )}
            </div>

            {/* Medical Conditions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Does the patient have any current medical condition? <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="medicalConditions"
                    value="yes"
                    checked={medicalConditions === 'yes'}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="medicalConditions"
                    value="no"
                    checked={medicalConditions === 'no'}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-300">No</span>
                </label>
              </div>
              {medicalConditions === 'yes' && (
                <textarea
                  value={medicalConditionsDetails}
                  onChange={(e) => setMedicalConditionsDetails(e.target.value)}
                  placeholder="Please describe the medical conditions..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
              <p className="text-green-300 text-sm text-center">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`
              w-full py-4 px-6 rounded-lg font-semibold text-white transition-all text-lg
              ${isFormValid && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-lg hover:shadow-xl'
                : 'bg-slate-700 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Prescription Form'}
          </button>
        </form>
      </div>
    </div>
  );
}

