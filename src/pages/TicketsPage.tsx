import { Layout } from '../components/layout/Layout';
import TicketTable from '../components/dashboard/TicketTable';
import { useSocketTickets } from '../hooks/useSocket';

export function TicketsPage() {
  const refreshKey = useSocketTickets();

  return (
    <Layout>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Ticket Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all event tickets, entries, and attendee information
          </p>
        </div>
        <TicketTable refreshKey={refreshKey} />
      </div>
    </Layout>
  );
}
