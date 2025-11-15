'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/lib/types';

interface OrderDetailsProps {
  order: Order | null;
  onSubmitSuccess: (orderId: string) => void;
}

export default function OrderDetails({ order, onSubmitSuccess }: OrderDetailsProps) {
  const [doctorNotes, setDoctorNotes] = useState('');
  const [signaturePdf, setSignaturePdf] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when order changes
  useEffect(() => {
    if (order) {
      setDoctorNotes('');
      setSignaturePdf(null);
      setError('');
      setSuccess('');
    }
  }, [order]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
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

  const convertPdfToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:application/pdf;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setError('');
    setSuccess('');

    // Validate form
    if (!doctorNotes || doctorNotes.length < 10) {
      setError('Doctor\'s notes must be at least 10 characters');
      return;
    }

    if (!signaturePdf) {
      setError('Please upload a signature PDF');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert PDF to base64
      const signatureBase64 = await convertPdfToBase64(signaturePdf);

      // Prepare payload
      const payload = {
        orderId: order.orderId,
        customerEmail: order.customerEmail,
        doctorNotes,
        signaturePdf: signatureBase64,
      };

      // Submit to API
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      setSuccess('Prescription form submitted successfully!');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSubmitSuccess(order.orderId);
      }, 1000);

    } catch (err) {
      setError('Failed to submit prescription form. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = order && doctorNotes.length >= 10 && signaturePdf;

  if (!order) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-slate-600 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-300 font-medium text-xl">Select an order</p>
          <p className="text-slate-500 text-sm mt-2">Choose an order from the left to fill prescription details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="p-6 border-b border-slate-700 bg-slate-800">
        <h2 className="text-2xl font-bold text-slate-100 text-center">Order Details</h2>
        <p className="text-sm text-slate-400 mt-2 text-center">Order #{order.orderNumber}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          {/* Customer Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
              Customer Email
            </label>
            <input
              type="email"
              value={order.customerEmail}
              readOnly
              className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-slate-400 cursor-not-allowed text-center"
            />
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

          {/* Signature PDF Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
              Signature PDF <span className="text-red-400">*</span>
            </label>
            <input
              type="file"
              accept=".pdf"
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
              Maximum file size: 5MB
            </p>
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

