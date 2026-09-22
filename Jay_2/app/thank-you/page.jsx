"use client";

import { useEffect, useState } from 'react';
import AutoSuccessMessage from '../../components/AutoSuccessMessage';
import { readThankYouHandoff } from '../../utils/thankYouHandoff';

export default function ThankYouPage() {
  const [handoff, setHandoff] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHandoff(readThankYouHandoff());
    setReady(true);
  }, []);

  const returnUrl = handoff?.returnUrl && handoff.returnUrl.startsWith('/') && !handoff.returnUrl.startsWith('/thank-you')
    ? handoff.returnUrl
    : '';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-8 py-8 border-b border-slate-200 bg-slate-900 text-white">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-300">Thank you</div>
            <h1 className="mt-3 text-3xl font-bold">{handoff?.formName || 'Response received'}</h1>
          </div>
          <div className="px-8 py-6">
            {!ready ? null : handoff ? (
              <AutoSuccessMessage
                settings={{
                  successMessage: handoff.successMessage,
                  redirectUrl: '',
                  postSubmission: {
                    showSubmittedData: Boolean(handoff.showSubmittedData),
                    successIcon: handoff.successIcon || 'OK',
                    allowResubmit: Boolean(handoff.allowResubmit && returnUrl),
                    resubmitText: handoff.resubmitText,
                    autoRedirect: { enabled: false }
                  }
                }}
                submittedData={handoff.submittedData}
                schema={handoff.schema}
                onResubmit={returnUrl ? () => { window.location.href = returnUrl; } : undefined}
              />
            ) : (
              <div className="py-12 text-center">
                <div className="text-5xl text-green-600 mb-4">OK</div>
                <h2 className="text-2xl font-bold text-gray-900">Thank you</h2>
                <p className="mt-3 text-gray-600">Your response was submitted.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
