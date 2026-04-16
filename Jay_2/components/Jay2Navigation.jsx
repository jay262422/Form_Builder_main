import React from 'react';
import Link from 'next/link';

/**
 * FormBuilderNavigation - Navigation component for form builder features
 */
export default function FormBuilderNavigation() {
  const navItems = [
    {
      name: 'Form Builder',
      href: '/',
      description: 'Main form builder interface',
      icon: '📝'
    },

    {
      name: 'Theme Editor Demo',
      href: '/theme-editor-demo',
      description: 'Customize form themes visually',
      icon: '🎨'
    },
    {
      name: 'Form Manager',
      href: '/FormManagerDemo',
      description: 'Manage and organize forms',
      icon: '🗂️'
    },
    {
      name: 'Visual Builder',
      href: '/VisualFormBuilder',
      description: 'Drag & drop form builder',
      icon: '🖱️'
    }
  ];

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Form Builder Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-blue-700">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
