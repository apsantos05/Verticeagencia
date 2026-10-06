// Test-only visual fixture. Never imported by src or exposed as an application route.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, mkdirSync } from "node:fs";
import { DashboardView } from "../src/components/dashboard-view";
import type { DashboardData } from "../src/lib/dashboard";
const empty: DashboardData = {
  finance: {
    expected: 0,
    received: 0,
    outstanding: 0,
    overdue: 0,
    expenses: 0,
    paid: 0,
  },
  operations: {
    clients: 0,
    content: 0,
    approvals: 0,
    lateContent: 0,
    tasks: 0,
    projects: 0,
    websites: 0,
  },
  commercial: {
    newLeads: 0,
    meetings: 0,
    proposals: 0,
    negotiations: 0,
    won: 0,
    pipeline: 0,
  },
  agenda: [],
  lateTasks: [],
  deliveries: [],
  approvals: [],
  dueAccounts: [],
};
mkdirSync("test-results", { recursive: true });
writeFileSync(
  "test-results/dashboard.html",
  renderToStaticMarkup(
    <main className="main-content">
      <DashboardView
        data={empty}
        name="Equipe"
        role="owner"
        now="2026-10-06T15:00:00Z"
      />
    </main>,
  ),
);
