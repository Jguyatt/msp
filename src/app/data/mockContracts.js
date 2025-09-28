// Mock contract data
const mockContracts = [
  {
    id: 'CT001',
    vendor: 'Microsoft',
    contractName: 'Microsoft 365 Business Premium',
    startDate: '2023-01-15',
    endDate: '2024-01-15',
    value: 24000,
    daysUntil: 95,
    reminders: {
      d90: { sentAt: '2024-10-15T10:00:00Z' },
      d60: null,
      d30: null
    },
    emailLog: [
      {
        at: '2024-10-15T10:00:00Z',
        template: 'd90',
        status: 'sent'
      }
    ]
  },
  {
    id: 'CT002',
    vendor: 'Datto',
    contractName: 'Datto Backup & Recovery',
    startDate: '2023-06-01',
    endDate: '2024-12-31',
    value: 18000,
    daysUntil: 35,
    reminders: {
      d90: { sentAt: '2024-10-15T10:00:00Z' },
      d60: { sentAt: '2024-11-15T10:00:00Z' },
      d30: null
    },
    emailLog: [
      {
        at: '2024-10-15T10:00:00Z',
        template: 'd90',
        status: 'sent'
      },
      {
        at: '2024-11-15T10:00:00Z',
        template: 'd60',
        status: 'sent'
      }
    ]
  },
  {
    id: 'CT003',
    vendor: 'ConnectWise',
    contractName: 'ConnectWise Manage',
    startDate: '2023-03-01',
    endDate: '2025-03-01',
    value: 36000,
    daysUntil: 145,
    reminders: {
      d90: null,
      d60: null,
      d30: null
    },
    emailLog: []
  },
  {
    id: 'CT004',
    vendor: 'Salesforce',
    contractName: 'Sales Cloud Enterprise',
    startDate: '2023-07-01',
    endDate: '2024-07-01',
    value: 28000,
    daysUntil: 22,
    reminders: {
      d90: { sentAt: '2024-04-15T10:00:00Z' },
      d60: { sentAt: '2024-05-15T10:00:00Z' },
      d30: { sentAt: '2024-06-15T10:00:00Z' }
    },
    emailLog: [
      {
        at: '2024-04-15T10:00:00Z',
        template: 'd90',
        status: 'sent'
      },
      {
        at: '2024-05-15T10:00:00Z',
        template: 'd60',
        status: 'sent'
      },
      {
        at: '2024-06-15T10:00:00Z',
        template: 'd30',
        status: 'sent'
      }
    ]
  },
  {
    id: 'CT005',
    vendor: 'Kaseya',
    contractName: 'VSA Professional',
    startDate: '2023-09-01',
    endDate: '2024-03-01',
    value: 15000,
    daysUntil: 8,
    reminders: {
      d90: { sentAt: '2024-12-15T10:00:00Z' },
      d60: { sentAt: '2024-01-15T10:00:00Z' },
      d30: { sentAt: '2024-02-15T10:00:00Z' }
    },
    emailLog: [
      {
        at: '2024-12-15T10:00:00Z',
        template: 'd90',
        status: 'sent'
      },
      {
        at: '2024-01-15T10:00:00Z',
        template: 'd60',
        status: 'sent'
      },
      {
        at: '2024-02-15T10:00:00Z',
        template: 'd30',
        status: 'sent'
      }
    ]
  }
];

export { mockContracts };
