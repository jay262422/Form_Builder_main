"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FormBuilder from "../../../FormBuilder";
import FormWizard from "../../../components/FormWizard";
import AutoErrorMessage from "../../../components/AutoErrorMessage";
import AutoSuccessMessage from "../../../components/AutoSuccessMessage";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useAuth } from "../../../contexts/AuthContext";
import { isStepByStepForm } from "../../../utils/formHelpers";
import { generateSubmissionHandler } from "../../../utils/submissionHandler";

const getApiBaseURL = () => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";
  }
  return process.env.API_URL || "http://localhost:3004";
};

export default function PublishedFormPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const formId = params?.id;
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [submissionError, setSubmissionError] = useState("");

  useEffect(() => {
    const loadForm = async () => {
      if (!formId) return;
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${getApiBaseURL()}/api/forms/${encodeURIComponent(formId)}?publicOnly=true`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.message || "Published form not found");
        }

        const loadedForm = payload?.data || payload;
        setForm(loadedForm || null);
      } catch (err) {
        setError(err?.message || "Failed to load published form");
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId]);

  const schema = useMemo(() => (
    form?.schema?.sections || form?.schema || []
  ), [form]);

  const requiresLogin = Boolean(form?.settings?.requireAuthentication);
  const shouldBlockForAuth = requiresLogin && !authLoading && !isAuthenticated;

  const handleSubmit = async (formData) => {
    if (!form) return;

    const submissionHandler = generateSubmissionHandler(
      form,
      setIsSubmitting,
      setIsSubmitted,
      setSubmissionError,
      setSubmittedData
    );

    const result = await submissionHandler(formData);
    if (!result?.success) {
      setIsSubmitted(false);
    }
  };

  const handleResubmit = () => {
    setIsSubmitted(false);
    setSubmissionError("");
    setSubmittedData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-lg w-full bg-white rounded-lg border border-red-200 p-6">
          <h1 className="text-xl font-bold text-red-700">Form unavailable</h1>
          <p className="text-sm text-gray-700 mt-2">{error || "This form is not available right now."}</p>
        </div>
      </div>
    );
  }

  if (submissionError) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-8 py-8 border-b border-slate-200 bg-slate-900 text-white">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-300">Published Form</div>
              <h1 className="mt-3 text-3xl font-bold">{form.name}</h1>
              {form.description && <p className="mt-2 text-slate-300 max-w-2xl">{form.description}</p>}
            </div>
            <div className="px-8 py-10">
              <AutoErrorMessage
                settings={form.settings || {}}
                error={submissionError}
                onRetry={() => setSubmissionError("")}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted && form.settings?.postSubmission?.showSuccessPage !== false) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-8 py-8 border-b border-slate-200 bg-slate-900 text-white">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-300">Published Form</div>
              <h1 className="mt-3 text-3xl font-bold">{form.name}</h1>
              {form.description && <p className="mt-2 text-slate-300 max-w-2xl">{form.description}</p>}
            </div>
            <div className="px-8 py-10">
              <AutoSuccessMessage
                settings={form.settings || {}}
                submittedData={submittedData}
                schema={schema}
                formName={form.name}
                onResubmit={form.settings?.postSubmission?.allowResubmit ? handleResubmit : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-8 py-8 border-b border-slate-200 bg-slate-900 text-white">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-300">
              <span>Published Form</span>
              <span className="rounded-full border border-slate-700 px-3 py-1 tracking-normal text-[11px]">
                {isStepByStepForm(form) ? "Step by step" : "Standard"}
              </span>
              {form.settings?.requireAuthentication && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 tracking-normal text-[11px] text-amber-200">
                  Login required
                </span>
              )}
              {form.settings?.allowMultipleSubmissions === false && (
                <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 tracking-normal text-[11px] text-rose-200">
                  Single submission only
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-bold">{form.name}</h1>
            {form.description && <p className="mt-2 max-w-2xl text-slate-300">{form.description}</p>}
          </div>
          <div className="px-8 py-8">
            {authLoading ? (
              <div className="py-10">
                <LoadingSpinner />
              </div>
            ) : shouldBlockForAuth ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <h2 className="text-xl font-semibold text-slate-900">Login required to continue</h2>
                <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto">
                  Sign in first, then come back to this shared form and submit your response.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Login to submit
                </button>
              </div>
            ) : isStepByStepForm(form) ? (
              <FormWizard
                schema={schema}
                form={form}
                onSubmit={handleSubmit}
                loading={isSubmitting}
                title={form.name}
                description={form.description || ""}
                formTheme={form.schema?.formTheme || "modern"}
              />
            ) : (
              <FormBuilder
                schema={schema}
                form={form}
                onSubmit={handleSubmit}
                loading={isSubmitting}
                formTheme={form.schema?.formTheme || "modern"}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
