"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import FormManagerDemo from "../FormManagerDemo";
import FieldOptionsManager from "../components/FieldOptionsManager";
import ErrorBoundary from "../components/ErrorBoundary";
import ThemeEditorDemo from "../ThemeEditorDemo";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";

const HOME_TABS = [
  { id: "manager", label: "Form Manager", hint: "Create, organize, and edit forms" },
  { id: "fieldOptions", label: "Field Options", hint: "Create choice lists and reuse them on forms", devOnly: true },
  { id: "themeEditor", label: "Theme Editor (Dev)", hint: "Customize visual themes", devOnly: true }
];

export default function FormBuilderPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [activeDemo, setActiveDemo] = useState("manager");
  const [toast, setToast] = useState(null);
  const [managerViewState, setManagerViewState] = useState("manager");

  const canAccessDevTools = useMemo(() => (
    user?.role === "admin" || user?.workspaceRole === "owner" || user?.workspaceRole === "admin"
  ), [user]);

  const visibleTabs = useMemo(() => (
    HOME_TABS.filter((tab) => (tab.devOnly ? canAccessDevTools : true))
  ), [canAccessDevTools]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (activeDemo !== "manager") {
      setManagerViewState("manager");
    }
  }, [activeDemo]);

  const isFocusedManagerWorkspace = activeDemo === "manager" && managerViewState !== "manager";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {!isFocusedManagerWorkspace && (
          <div className="bg-white border-b border-gray-200 px-6 py-6">
            <div className="w-full">
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dynamic Form System</h1>
                  <p className="text-gray-600 mt-2">Create, manage, and preview dynamic forms with ease</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended flow: Form Manager -&gt; Builder -&gt; Preview -&gt; Publish
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {user && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Welcome, <span className="font-medium">{user.name}</span>
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  )}
                  <button
                    onClick={() => router.push("/settings")}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Logout
                  </button>
                </div>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 ${visibleTabs.length >= 3 ? "xl:grid-cols-3" : "xl:grid-cols-2"} gap-3`}>
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDemo(tab.id)}
                    className={`px-4 py-3 rounded-lg text-left transition-colors border ${
                      activeDemo === tab.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                        : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-semibold text-sm">{tab.label}</div>
                    <div className={`text-xs mt-1 ${activeDemo === tab.id ? "text-blue-100" : "text-gray-500"}`}>
                      {tab.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <ErrorBoundary>
            {activeDemo === "manager" ? (
              <FormManagerDemo
                onViewStateChange={setManagerViewState}
              />
            ) : activeDemo === "fieldOptions" ? (
              <FieldOptionsManager />
            ) : activeDemo === "themeEditor" ? (
              <ThemeEditorDemo />
            ) : (
              <FormManagerDemo
                onViewStateChange={setManagerViewState}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </ProtectedRoute>
  );
}
