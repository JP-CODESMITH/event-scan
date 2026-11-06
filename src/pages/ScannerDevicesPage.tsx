import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import ScannerDevices from '../components/dashboard/ScannerDevices';

export function ScannerDevicesPage() {
  return (
    <Layout>
      <PageHeader
        eyebrow="Gates"
        title="Door devices"
        description="Phones currently checking tickets in. A device stays listed after it goes offline so you can see which gate dropped."
        actions={
          <Button asChild>
            <Link to="/scanner">
              Open scanner
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <ScannerDevices />
    </Layout>
  );
}
