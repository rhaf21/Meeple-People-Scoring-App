import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
