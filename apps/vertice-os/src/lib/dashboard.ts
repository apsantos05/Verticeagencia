import { z } from "zod";
const item = z.object({ id: z.string().uuid(), title: z.string() });
export const dashboardSchema = z.object({
  finance: z
    .object({
      expected: z.number(),
      received: z.number(),
      outstanding: z.number(),
      overdue: z.number(),
      expenses: z.number(),
      paid: z.number(),
    })
    .nullable(),
  operations: z.object({
    clients: z.number(),
    content: z.number(),
    approvals: z.number(),
    lateContent: z.number(),
    tasks: z.number(),
    projects: z.number(),
    websites: z.number(),
  }),
  commercial: z
    .object({
      newLeads: z.number(),
      meetings: z.number(),
      proposals: z.number(),
      negotiations: z.number(),
      won: z.number(),
      pipeline: z.number(),
    })
    .nullable(),
  agenda: z.array(item.extend({ starts_at: z.string() })),
  lateTasks: z.array(item.extend({ due_at: z.string() })),
  deliveries: z.array(item.extend({ due_at: z.string() })),
  approvals: z.array(item.extend({ scheduled_at: z.string().nullable() })),
  dueAccounts: z.array(
    item.extend({ due_date: z.string(), balance: z.number() }),
  ),
});
export type DashboardData = z.infer<typeof dashboardSchema>;
