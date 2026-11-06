import { Link } from 'react-router-dom';
import { Download, ShieldCheck } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import TicketTable from '../components/dashboard/TicketTable';
import { useSocketTickets } from '../hooks/useSocket';
import { api } from '../lib/api';

export function TicketsPage() {
  const refreshKey = useSocketTickets();

  return (
    <Layout>
      <PageHeader
        eyebrow="Guest list"
        title="Tickets"
        description="Every ticket on file, with its entries, remaining scans and door status. Changes reach the gates immediately."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href={api.exportCsv()}>
                <Download className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Export CSV
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/authorized">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Authorisation
              </Link>
            </Button>
          </>
        }
      />
      <TicketTable refreshKey={refreshKey} />
    </Layout>
  );
}
