import { Layout } from '../components/layout/Layout';
import ScannerDevices from '../components/dashboard/ScannerDevices';

export function ScannerDevicesPage() {
  return (
    <Layout>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Scanner Devices
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connected scanner devices and their status
          </p>
        </div>
        <ScannerDevices />
      </div>
    </Layout>
  );
}
