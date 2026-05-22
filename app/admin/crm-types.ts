// ─── CRM Types ────────────────────────────────────────────────────────────────

export type CrmClientStatus  = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type CrmProjectStatus = 'DISCOVERY' | 'PROPOSAL' | 'ACTIVE' | 'REVIEW' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type CrmInvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface CrmClient {
  id:        string;
  createdAt: string;
  updatedAt: string;
  name:      string;
  company:   string | null;
  email:     string;
  phone:     string | null;
  country:   string | null;
  status:    CrmClientStatus;
  notes:     string | null;
  tags:      string[];
  projects?: CrmProject[];
  invoices?: CrmInvoice[];
}

export interface CrmProject {
  id:          string;
  createdAt:   string;
  updatedAt:   string;
  title:       string;
  description: string | null;
  status:      CrmProjectStatus;
  budget:      number | null;
  currency:    string;
  startDate:   string | null;
  endDate:     string | null;
  notes:       string[];
  clientId:    string;
  client?:     Pick<CrmClient, 'id' | 'name' | 'company'>;
}

export interface CrmInvoice {
  id:            string;
  createdAt:     string;
  updatedAt:     string;
  invoiceNumber: string;
  amount:        number;
  currency:      string;
  status:        CrmInvoiceStatus;
  issuedAt:      string;
  dueAt:         string | null;
  paidAt:        string | null;
  notes:         string | null;
  clientId:      string;
  client?:       Pick<CrmClient, 'id' | 'name' | 'company'>;
  projectId:     string | null;
  project?:      Pick<CrmProject, 'id' | 'title'> | null;
}

export interface CrmStats {
  totalRevenue:     number;
  pendingAmount:    number;
  pendingCount:     number;
  overdueCount:     number;
  activeProjects:   number;
  totalClients:     number;
  leadsCount:       number;
  revenueThisMonth: number;
  revenueLastMonth: number;
}
