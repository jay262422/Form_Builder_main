import '../globals.css';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata = {
  title: 'Dynamic Form Builder',
  description: 'Create, manage, and preview dynamic forms with ease',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
