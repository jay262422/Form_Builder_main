"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import FormManagerDemo from "../FormManagerDemo";
import VisualBuilder from "../VisualBuilder";
import ALL_Form_view from "../ALL_Form_view";
import FieldOptionsTester from "../components/FieldOptionsTester";
import ErrorBoundary from "../components/ErrorBoundary";
import ThemeEditorDemo from "../ThemeEditorDemo";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import LoadingSpinner from "../components/LoadingSpinner";

export default function FormBuilderPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [activeDemo, setActiveDemo] = useState('manager'); // 'manager', 'builder', 'demo', 'fieldOptions', 'themeEditor'

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

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
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dynamic Form System</h1>
                <p className="text-gray-600 mt-2">Create, manage, and preview dynamic forms with ease</p>
              </div>
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Welcome, <span className="font-medium">{user.name}</span></p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                )}
                <button
                  onClick={() => router.push('/settings')}
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
          
          {/* Navigation */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveDemo('manager')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeDemo === 'manager' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>📋</span>
              <span>Form Manager</span>
              <span className="text-xs opacity-75">(Manage & Edit Forms)</span>
            </button>
            <button
              onClick={() => setActiveDemo('builder')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeDemo === 'builder' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>🎨</span>
              <span>Visual Form Builder</span>
              <span className="text-xs opacity-75">(Drag & Drop Builder)</span>
            </button>
            <button
              onClick={() => setActiveDemo('demo')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeDemo === 'demo' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>🎯</span>
              <span>Form Demos</span>
              <span className="text-xs opacity-75">(See Demo Forms)</span>
            </button>
            <button
              onClick={() => setActiveDemo('fieldOptions')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeDemo === 'fieldOptions'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>🔧</span>
              <span>Field Options</span>
              <span className="text-xs opacity-75">(Test API)</span>
            </button>

            <button
              onClick={() => setActiveDemo('themeEditor')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeDemo === 'themeEditor'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>🎨</span>
              <span>Theme Editor</span>
              <span className="text-xs opacity-75">(Customize Themes)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <ErrorBoundary>
          {activeDemo === 'manager' ? (
            <FormManagerDemo />
          ) : activeDemo === 'builder' ? (
            <VisualBuilder />
          ) : activeDemo === 'fieldOptions' ? (
            <FieldOptionsTester />
          ) : activeDemo === 'themeEditor' ? (
            <ThemeEditorDemo />
          ) : (
            <ALL_Form_view />
          )}
        </ErrorBoundary>
      </div>
      </div>
    </ProtectedRoute>
  );
}
