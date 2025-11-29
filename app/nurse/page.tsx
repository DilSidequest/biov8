'use client';

import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';

interface Patient {
  customerId: number;
  email: string;
  name: string;
  orders: Array<{
    id: number;
    orderId: string;
    orderNumber: string;
    orderDate: string;
    [key: string]: any;
  }>;
}

interface Prescription {
  id: number;
  customer_id: number;
  order_id: number;
  pre_approved_medicines: string | null;
  created_at: string;
  [key: string]: any;
}

export default function NurseDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [error, setError] = useState('');

  // Selected patient and their data
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [preApprovedMedicines, setPreApprovedMedicines] = useState<string[]>([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);

  // Medicine selection with details
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [medicineDetails, setMedicineDetails] = useState<{[key: string]: {quantity: string, description: string}}>({});
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');

  // Submission form
  const [nurseName, setNurseName] = useState('');
  const [signaturePdf, setSignaturePdf] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Search for patients
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Please enter a name or email to search');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results || []);

      if (data.results.length === 0) {
        setError('No patients found matching your search');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch pre-approved medicines for a patient
  const handlePatientClick = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsLoadingMedicines(true);
    setPreApprovedMedicines([]);
    setSelectedMedicines([]);
    setShowMedicineModal(true);
    setError('');

    try {
      // Fetch prescriptions for this patient
      const response = await fetch(`/api/prescriptions?customerId=${patient.customerId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }

      const data = await response.json();
      const prescriptions: Prescription[] = data.prescriptions || [];

      // Get pre-approved medicines from the most recent prescription
      const medicinesSet = new Set<string>();

      for (const prescription of prescriptions) {
        if (prescription.pre_approved_medicines) {
          try {
            const medicines = JSON.parse(prescription.pre_approved_medicines);
            if (Array.isArray(medicines)) {
              medicines.forEach(med => medicinesSet.add(med));
            }
          } catch (e) {
            console.error('Error parsing pre-approved medicines:', e);
          }
        }
      }

      const medicinesList = Array.from(medicinesSet);

      if (medicinesList.length === 0) {
        setError('No pre-approved medicines found for this patient. Please contact a doctor to approve medicines first.');
      }

      setPreApprovedMedicines(medicinesList);
    } catch (err) {
      console.error('Error fetching pre-approved medicines:', err);
      setError('Failed to load pre-approved medicines. Please try again.');
    } finally {
      setIsLoadingMedicines(false);
    }
  };

  // Toggle medicine selection
  const toggleMedicine = (medicine: string) => {
    setSelectedMedicines(prev => {
      if (prev.includes(medicine)) {
        // Remove medicine and its details
        const newDetails = {...medicineDetails};
        delete newDetails[medicine];
        setMedicineDetails(newDetails);
        return prev.filter(m => m !== medicine);
      } else {
        // Add medicine and initialize its details
        setMedicineDetails(prev => ({
          ...prev,
          [medicine]: { quantity: '1', description: '' }
        }));
        return [...prev, medicine];
      }
    });
  };

  // Update medicine detail
  const updateMedicineDetail = (medicine: string, field: 'quantity' | 'description', value: string) => {
    setMedicineDetails(prev => ({
      ...prev,
      [medicine]: {
        ...prev[medicine],
        [field]: value
      }
    }));
  };

  // Filter medicines based on search
  const filteredMedicines = preApprovedMedicines.filter(medicine =>
    medicine.toLowerCase().includes(medicineSearchQuery.toLowerCase())
  );

  // Close modal
  const closeModal = () => {
    setShowMedicineModal(false);
    setSelectedPatient(null);
    setPreApprovedMedicines([]);
    setSelectedMedicines([]);
    setMedicineDetails({});
    setMedicineSearchQuery('');
    setNurseName('');
    setSignaturePdf('');
    setSubmitSuccess('');
    setSubmitError('');
  };

  // Handle signature upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setSubmitError('Please upload a valid image (JPEG, PNG, GIF, WebP, SVG) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('File size must be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setSignaturePdf(reader.result as string);
      setSubmitError('');
    };
    reader.readAsDataURL(file);
  };

  // Submit prescription
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMedicines.length === 0) {
      setSubmitError('Please select at least one medicine to prescribe');
      return;
    }

    if (!nurseName.trim()) {
      setSubmitError('Please enter your name');
      return;
    }

    if (!selectedPatient || selectedPatient.orders.length === 0) {
      setSubmitError('No order data available for this patient');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      // Use the most recent order for this patient
      const mostRecentOrder = selectedPatient.orders[0];

      // Format medicines array with custom quantities and descriptions
      const medicines = selectedMedicines.map(medicine => ({
        name: medicine,
        quantity: medicineDetails[medicine]?.quantity || '1',
        description: medicineDetails[medicine]?.description || 'Prescribed from pre-approved medicines'
      }));

      // Prepare payload matching doctor page format
      const payload = {
        // Original order data
        orderId: mostRecentOrder.orderId,
        orderNumber: mostRecentOrder.orderNumber,
        customerName: selectedPatient.name,
        customerEmail: selectedPatient.email,
        totalAmount: mostRecentOrder.totalAmount || '0.00',
        currency: mostRecentOrder.currency || 'USD',
        orderDate: mostRecentOrder.orderDate,
        lineItems: mostRecentOrder.lineItems || '',
        shippingAddress: mostRecentOrder.shippingAddress || '',
        tags: mostRecentOrder.tags || '',
        // Nurse's additions
        doctorName: `${nurseName} (Nurse)`,
        medicines: medicines,
        doctorNotes: 'Nurse prescribed from pre-approved medicines list',
        signaturePdf: signaturePdf, // Nurse signature
        preApprovedMedicines: [], // Nurses don't set new pre-approved medicines
        // Health Assessment (from original order)
        healthChanges: mostRecentOrder.healthChanges || null,
        healthChangesDetails: mostRecentOrder.healthChangesDetails || null,
        takingMedications: mostRecentOrder.takingMedications || null,
        takingMedicationsDetails: mostRecentOrder.takingMedicationsDetails || null,
        hadMedicationBefore: mostRecentOrder.hadMedicationBefore || null,
        pregnancyStatus: mostRecentOrder.pregnancyStatus || null,
        allergicReaction: mostRecentOrder.allergicReaction || null,
        allergies: mostRecentOrder.allergies || null,
        allergiesDetails: mostRecentOrder.allergiesDetails || null,
        medicalConditions: mostRecentOrder.medicalConditions || null,
        medicalConditionsDetails: mostRecentOrder.medicalConditionsDetails || null,
      };

      console.log('[Nurse] Submitting prescription to n8n...');

      // Submit to n8n via /api/submit
      const response = await fetch('/api/submit', {
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
      console.log('[Nurse] Prescription sent to n8n:', result);

      setSubmitSuccess('Prescription submitted successfully!');

      // Close modal after a short delay
      setTimeout(() => {
        closeModal();
      }, 2000);

    } catch (err) {
      setSubmitError(`Failed to submit prescription: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-center">Nurse Dashboard</h1>
            <p className="text-green-100 text-sm mt-2 text-center">Prescribe pre-approved medicines</p>
          </div>
          <div className="ml-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Section */}
          <div className="bg-slate-800 rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">🔍 Search Patient</h2>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter patient name or email..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>

                {searchResults.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setError('');
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {error && !showMedicineModal && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Search Results ({searchResults.length})</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((patient) => (
                  <button
                    key={patient.customerId}
                    onClick={() => handlePatientClick(patient)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg p-6 text-left transition-all hover:shadow-lg hover:border-green-500"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-white truncate">{patient.name}</h4>
                        <p className="text-sm text-slate-400 truncate">{patient.email}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {patient.orders.length} order{patient.orders.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="text-green-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSearching && searchResults.length === 0 && !error && (
            <div className="text-center text-slate-400 mt-12">
              <div className="text-6xl mb-4">👩‍⚕️</div>
              <p className="text-lg">Search for a patient to prescribe pre-approved medicines</p>
              <p className="text-sm mt-2">Enter the patient&apos;s name or email address above</p>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Approved Medicines Modal */}
      {showMedicineModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Pre-Approved Medicines</h2>
                  <p className="text-slate-400 mt-1">
                    Patient: <span className="text-white font-semibold">{selectedPatient.name}</span>
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingMedicines && (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading pre-approved medicines...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!isLoadingMedicines && error && (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center max-w-md">
                  <div className="text-red-400 text-5xl mb-4">⚠️</div>
                  <p className="text-red-200">{error}</p>
                  <button
                    onClick={closeModal}
                    className="mt-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Medicine Selection and Details */}
            {!isLoadingMedicines && !error && preApprovedMedicines.length > 0 && (
              <>
                {/* Search Bar */}
                <div className="p-6 border-b border-slate-700">
                  <input
                    type="text"
                    value={medicineSearchQuery}
                    onChange={(e) => setMedicineSearchQuery(e.target.value)}
                    placeholder="Search medicines..."
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-sm text-slate-400 mt-2">
                    {selectedMedicines.length} of {preApprovedMedicines.length} medicine(s) selected
                  </p>
                </div>

                {/* Medicine List with Details */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    {filteredMedicines.map((medicine, index) => (
                      <div
                        key={index}
                        className="border border-slate-700 rounded-lg p-4 bg-slate-700/30"
                      >
                        {/* Medicine Checkbox */}
                        <label className="flex items-start gap-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMedicines.includes(medicine)}
                            onChange={() => toggleMedicine(medicine)}
                            className="mt-1 w-5 h-5 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-2"
                          />
                          <span className="text-white flex-1 font-semibold">{medicine}</span>
                        </label>

                        {/* Medicine Details (shown when selected) */}
                        {selectedMedicines.includes(medicine) && (
                          <div className="mt-4 ml-9 space-y-3">
                            {/* Quantity */}
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-1">
                                Quantity
                              </label>
                              <input
                                type="text"
                                value={medicineDetails[medicine]?.quantity || '1'}
                                onChange={(e) => updateMedicineDetail(medicine, 'quantity', e.target.value)}
                                placeholder="e.g., 1, 2 vials, 30 tablets"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>

                            {/* Description */}
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-1">
                                Description / Instructions
                              </label>
                              <textarea
                                value={medicineDetails[medicine]?.description || ''}
                                onChange={(e) => updateMedicineDetail(medicine, 'description', e.target.value)}
                                placeholder="e.g., Take once daily with food"
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {filteredMedicines.length === 0 && medicineSearchQuery && (
                    <div className="text-center text-slate-400 py-8">
                      <p>No medicines found matching &quot;{medicineSearchQuery}&quot;</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Nurse Information and Submit Section */}
            {!isLoadingMedicines && !error && preApprovedMedicines.length > 0 && (
              <>
                <div className="p-6 border-t border-slate-700 space-y-4">
                  {/* Nurse Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Nurse Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={nurseName}
                      onChange={(e) => setNurseName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  {/* Signature Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Signature <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleSignatureUpload}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {signaturePdf && (
                      <p className="text-sm text-green-400 mt-2">✓ Signature uploaded</p>
                    )}
                  </div>

                  {/* Error/Success Messages */}
                  {submitError && (
                    <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                      {submitError}
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
                      {submitSuccess}
                    </div>
                  )}

                  {/* Submit Button (Bottom Right) */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !nurseName.trim() || selectedMedicines.length === 0}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Prescription'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
