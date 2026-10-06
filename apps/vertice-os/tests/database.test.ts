import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { dashboardSchema } from "../src/lib/dashboard";

test("migrations, tenant isolation, role boundaries and financial invariants", async () => {
  const db = new PGlite();
  const uid = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const a = uid(101),
    b = uid(102),
    client = uid(201),
    otherClient = uid(202),
    invoice = uid(301);
  try {
    // Only Supabase-owned auth/storage scaffolding is emulated, not RLS or application SQL.
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
      create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to authenticated,anon;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
      alter default privileges in schema public grant all on tables to authenticated,anon;`);
    for (const name of [
      "202610060001_foundation.sql",
      "202610060002_dashboard.sql",
    ]) {
      await db.exec(
        readFileSync(resolve("../../supabase/migrations", name), "utf8"),
      );
    }
    await db.exec(`insert into auth.users(id) values ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `('${uid(n)}')`).join(",")};
      insert into public.workspaces(id,name) values('${a}','A'),('${b}','B');
      insert into public.workspace_members(workspace_id,user_id,role) values
      ('${a}','${uid(1)}','owner'),('${b}','${uid(2)}','owner'),('${a}','${uid(3)}','designer'),
      ('${a}','${uid(4)}','financeiro'),('${a}','${uid(5)}','gestor'),('${a}','${uid(6)}','social_media'),('${a}','${uid(7)}','editor'),('${a}','${uid(8)}','admin');
      insert into public.clients(id,workspace_id,name,status,responsible_id) values('${client}','${a}','Visible client','active','${uid(6)}'),('${otherClient}','${b}','Other tenant','active',null);
      insert into public.content_items(workspace_id,client_id,title,designer_id,responsible_id,editor_id,format) values
      ('${a}','${client}','Assigned content','${uid(3)}','${uid(6)}','${uid(7)}','reel'),('${a}','${client}','Unassigned content',null,null,null,'post');
      insert into public.receivables(id,workspace_id,client_id,description,competence,due_date,amount,recurrence_key)
      values('${invoice}','${a}','${client}','Monthly service',current_date,current_date-1,2000,'contract:2026-10');
      insert into public.payables(workspace_id,description,competence,due_date,amount) values('${a}','Software',current_date,current_date,200);`);
    const asUser = async (n: number) => {
      await db.exec(
        `reset role; set role authenticated; select set_config('request.jwt.claim.sub','${uid(n)}',false);`,
      );
    };
    const count = async (table: string) =>
      (
        await db.query<{ count: number }>(
          `select count(*)::int as count from public.${table}`,
        )
      ).rows[0].count;
    const summary = async () =>
      dashboardSchema.parse(
        (
          await db.query<{ data: unknown }>(
            `select public.dashboard_summary('${a}') as data`,
          )
        ).rows[0].data,
      );
    await asUser(1);
    assert.equal(
      await count("clients"),
      1,
      "owner must not see another tenant",
    );
    assert.equal((await summary()).operations.clients, 1);
    await assert.rejects(
      db.exec(`select public.dashboard_summary('${b}')`),
      /Access denied/,
    );
    await assert.rejects(
      db.exec(
        `insert into public.clients(workspace_id,name) values('${b}','injection')`,
      ),
      /row-level security/,
    );
    await assert.rejects(
      db.exec(
        `update public.workspace_members set role='owner' where user_id='${uid(3)}'`,
      ),
      /permission denied/,
    );
    await assert.rejects(
      db.exec(
        `insert into public.projects(workspace_id,client_id,title) values('${a}','${otherClient}','Cross tenant')`,
      ),
      /foreign key/,
    );
    await assert.rejects(
      db.exec(
        `update public.clients set workspace_id='${b}' where id='${client}'`,
      ),
      /immutable/,
    );
    await db.exec(`insert into public.receipts(workspace_id,receivable_id,amount,paid_on,method,idempotency_key)
      values('${a}','${invoice}',1000,current_date,'pix','${uid(401)}')`);
    const data = await summary();
    assert.equal(data.finance?.expected, 2000);
    assert.equal(data.finance?.received, 1000);
    assert.equal(data.finance?.outstanding, 1000);
    assert.equal(data.finance?.overdue, 1000);
    assert.equal(data.finance?.expenses, 200);
    await assert.rejects(
      db.exec(
        `insert into public.receipts(workspace_id,receivable_id,amount,paid_on,method,idempotency_key) values('${a}','${invoice}',1000,current_date,'pix','${uid(401)}')`,
      ),
      /unique/,
    );
    await assert.rejects(
      db.exec(
        `insert into public.receipts(workspace_id,receivable_id,amount,paid_on,method,idempotency_key) values('${a}','${invoice}',1001,current_date,'pix','${uid(402)}')`,
      ),
      /Invalid settlement/,
    );
    await assert.rejects(
      db.exec(`update public.receivables set amount=500 where id='${invoice}'`),
      /settlements/,
    );
    await assert.rejects(
      db.exec(
        `update public.receivables set cancelled=true where id='${invoice}'`,
      ),
      /settlements/,
    );
    await assert.rejects(
      db.exec(`delete from public.receipts`),
      /permission denied/,
    );
    await assert.rejects(
      db.exec(
        `insert into public.receivables(workspace_id,description,competence,due_date,amount,recurrence_key) values('${a}','Dup',current_date,current_date,10,'contract:2026-10')`,
      ),
      /unique/,
    );
    assert.ok((await count("activity_logs")) > 0);
    await assert.rejects(
      db.exec(
        `insert into public.activity_logs(workspace_id,entity,entity_id,action) values('${a}','test','${client}','fake')`,
      ),
      /permission denied/,
    );
    for (const n of [3, 6, 7]) {
      await asUser(n);
      assert.equal(
        await count("content_items"),
        1,
        "specialists only see assigned content",
      );
      assert.equal(await count("receivables"), 0);
      assert.equal((await summary()).finance, null);
      assert.equal((await summary()).commercial, null);
      await assert.rejects(
        db.exec(
          `insert into public.clients(workspace_id,name) values('${a}','Forbidden')`,
        ),
        /row-level security/,
      );
    }
    await asUser(4);
    assert.equal(await count("clients"), 0);
    assert.equal(await count("receivables"), 1);
    assert.equal((await summary()).finance?.received, 1000);
    await asUser(5);
    assert.equal(await count("content_items"), 2);
    assert.equal((await summary()).finance, null);
    await asUser(8);
    assert.equal((await summary()).finance?.outstanding, 1000);
    await db.exec(
      `reset role; update public.workspace_members set active=false where user_id='${uid(3)}'`,
    );
    await asUser(3);
    assert.equal(await count("content_items"), 0);
    await assert.rejects(summary(), /Access denied/);
    await db.exec(`reset role; set role anon`);
    await assert.rejects(
      db.exec(`select * from public.clients`),
      /permission denied/,
    );
    await assert.rejects(
      db.exec(`select public.dashboard_summary('${a}')`),
      /permission denied/,
    );
    await db.exec("reset role");
    const bucket = (
      await db.query<{ public: boolean }>(
        "select public from storage.buckets where id='workspace-files'",
      )
    ).rows[0];
    assert.equal(bucket.public, false);
  } finally {
    await db.close();
  }
});
