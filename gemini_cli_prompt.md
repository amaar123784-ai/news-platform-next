# Gemini CLI Execution Prompt — Unified Accounting System

> **Copy each phase below and run it as a separate Gemini CLI prompt.**
> Wait for each phase to complete successfully before moving to the next.

---

## Phase 1: Delete Old Investment Finance Entities & Clean References

```
Use @codebase-cleanup-refactor-clean and @dotnet-backend to clean up the old investment finance entities.

CRITICAL: Before writing ANY code, read and strictly follow ALL rules in GEMINI.md at the project root.

## Context
We are replacing the old investment-only accounting system with a unified accounting module for the entire system ("الإدارة العامة لصندوق التقاعد الأمني"). There is NO data to preserve — delete everything related to the old finance entities.

## Task: Delete old entities and clean ALL references

### Step 1: Delete these files
- `PensionMS.Core/Entities/Investment/InvestmentChartOfAccount.cs`
- `PensionMS.Core/Entities/Investment/InvestmentJournalEntry.cs`
- `PensionMS.Core/Entities/Investment/InvestmentFinancialTransaction.cs`
- `PensionMS.Core/Entities/Investment/InvestmentTransactionType.cs`
- `PensionMS.Core/Interfaces/IInvestmentFinanceService.cs`
- `PensionMS.Infrastructure/Services/Investment/InvestmentFinanceService.cs`
- `PensionMS.API/Controllers/InvestmentFinanceController.cs`

### Step 2: Clean ALL references from these files
1. **`PensionMS.Core/Interfaces/IUnitOfWork.cs`** — Remove the repository properties for the 4 deleted entities (InvestmentChartOfAccounts, InvestmentJournalEntries, InvestmentFinancialTransactions, InvestmentTransactionTypes)
2. **`PensionMS.Infrastructure/Repositories/UnitOfWork.cs`** — Remove the implementation properties for the same 4 entities
3. **`PensionMS.Infrastructure/Data/PensionDbContext.cs`** — Remove the DbSet declarations and any OnModelCreating configurations for the 4 deleted entities
4. **`PensionMS.API/Program.cs`** — Remove the DI registration `AddScoped<IInvestmentFinanceService, InvestmentFinanceService>()`
5. **`PensionMS.Infrastructure/Data/Configurations/Investment/`** — Check for any EF Configuration classes referencing the deleted entities and remove them
6. **`PensionMS.Infrastructure/Data/Seeders/InvestmentDocumentTypeSeeder.cs`** — Remove any references to deleted entities if present

### Step 3: Clean Frontend references
1. Delete `ui/src/pages/investment/tabs/ChartOfAccountsTab.tsx`
2. Delete `ui/src/pages/investment/tabs/JournalEntriesTab.tsx`
3. Delete `ui/src/features/investment/JournalEntryDialog.tsx`
4. **`ui/src/pages/investment/InvestmentFinancePage.tsx`** — Remove the "الدليل المحاسبي" and "قيود اليومية" tabs and their imports. Keep ONLY the "الحركات المالية" tab (TransactionsTab) if it exists, otherwise delete the entire file.
5. **`ui/src/api/investment.ts`** — Remove all finance-related functions (accounts, journal entries, transactions) from the investmentApi object. Keep all non-finance investment API functions (portfolios, projects, properties, leasing, maintenance, governance).

### Step 4: Verify
Run: `cd PensionMS.API && dotnet build`
Fix any remaining compilation errors from dangling references.

DO NOT create any new files in this phase. Only delete and clean.
```

---

## Phase 2: Create New Accounting Entities, DTOs & Interface

```
Use @dotnet-backend, @database-architect, @csharp-pro, and @dotnet-architect to create the unified accounting entities.

CRITICAL: Before writing ANY code, read and strictly follow ALL rules in GEMINI.md at the project root. Pay special attention to:
- Constraint 3 (Backend Architecture)
- Constraint 15 (CRUD Page Creation Order — we are at steps 1-3)
- Constraint 12 (Language — XML Docs in Arabic, code in English)

## Context
Building a unified accounting system for "الإدارة العامة لصندوق التقاعد الأمني" with this organizational hierarchy:
```
الإدارة العامة لصندوق التقاعد الأمني
├── إدارة المعاشات (الرواتب التقاعدية، التسويات، الاستحقاقات)
├── إدارة الاستثمار (المحافظ، العقارات، التأجير)
└── الإدارة التشغيلية (الميزانية، الشؤون الإدارية، الموارد البشرية)
```

## Task: Create 5 new entities + DTOs + Interface

### Step 1: Create entities in `PensionMS.Core/Entities/Accounting/`

**ChartOfAccount.cs** — Unified Chart of Accounts (hierarchical tree)
Fields: AccountID (PK), AccountCode (string 50, Required), AccountName (string 200, Required), AccountNature (string 50 — Asset/Liability/Equity/Revenue/Expense), AccountLevel (int), ParentAccountID (int? FK→Self), IsPostable (bool — only leaf accounts), IsActive (bool), Description (string?), CreatedAt, UpdatedAt, IsDeleted, DeletedAt, DeletedByUserID, RowVersion.
Navigation: ParentAccount, SubAccounts (ICollection), JournalEntryLines (ICollection).
Implement ISoftDeletable.

**CostCenter.cs** — Hierarchical cost centers
Fields: CostCenterID (PK), Code (string 50, Required), Name (string 200, Required), ParentCostCenterID (int? FK→Self), IsActive (bool), CreatedAt, UpdatedAt, IsDeleted, DeletedAt, DeletedByUserID.
Navigation: ParentCostCenter, SubCostCenters (ICollection).
Implement ISoftDeletable.

**FiscalPeriod.cs** — Accounting periods (monthly)
Fields: PeriodID (PK), FiscalYearID (int FK→FiscalYear from OperationalBudget), PeriodName (string 100, Required), PeriodNumber (int), StartDate (DateTime), EndDate (DateTime), IsClosed (bool), ClosedByUserID (int? FK→User), ClosedAt (DateTime?), CreatedAt, UpdatedAt, IsDeleted, DeletedAt, DeletedByUserID.
Navigation: FiscalYear, ClosedByUser.
Implement ISoftDeletable.

**JournalEntry.cs** — Journal entry header
Fields: JournalEntryID (PK), EntryNumber (string 50), EntryDate (DateTime), PeriodID (int FK→FiscalPeriod), SourceModule (string 50 — Manual/Salary/Settlement/Budget/Investment), SourceReferenceID (int?), Description (string 500), TotalDebit (decimal), TotalCredit (decimal), Status (string 50 — Draft/Posted/Reversed), PostedByUserID (int? FK→User), PostedAt (DateTime?), ReversedEntryID (int? FK→Self — for reversal entries), CreatedByUserID (int FK→User), CreatedAt, UpdatedAt, IsDeleted, DeletedAt, DeletedByUserID, RowVersion.
Navigation: Period, PostedByUser, ReversedEntry, CreatedByUser, Lines (ICollection<JournalEntryLine>).
Implement ISoftDeletable.

**JournalEntryLine.cs** — Journal entry line items (debit/credit legs)
Fields: LineID (PK), JournalEntryID (int FK→JournalEntry), AccountID (int FK→ChartOfAccount), CostCenterID (int? FK→CostCenter), Debit (decimal), Credit (decimal), Description (string?), CreatedAt.
Navigation: JournalEntry, Account, CostCenter.
Implement ISoftDeletable (with IsDeleted, DeletedAt, DeletedByUserID).

### Step 2: Create DTOs in `PensionMS.Core/DTOs/Accounting/AccountingDtos.cs`

Create these DTOs in a single file:
- ChartOfAccountDto (all fields + ParentAccountName + SubAccountsCount + has children flag)
- CreateChartOfAccountDto (AccountCode, AccountName, AccountNature, ParentAccountID?, IsPostable, Description?)
- UpdateChartOfAccountDto (same as Create + IsActive)
- CostCenterDto (all fields + ParentCostCenterName)
- CreateCostCenterDto, UpdateCostCenterDto
- FiscalPeriodDto (all fields + FiscalYearName + ClosedByUserName)
- CreateFiscalPeriodDto (FiscalYearID, PeriodName, PeriodNumber, StartDate, EndDate)
- JournalEntryDto (all fields + PeriodName + CreatedByUserName + PostedByUserName + Lines list)
- JournalEntryLineDto (all fields + AccountName + AccountCode + CostCenterName)
- CreateJournalEntryDto (EntryDate, PeriodID, SourceModule, SourceReferenceID?, Description, Lines: List<CreateJournalEntryLineDto>)
- CreateJournalEntryLineDto (AccountID, CostCenterID?, Debit, Credit, Description?)
- TrialBalanceItemDto (AccountID, AccountCode, AccountName, AccountNature, TotalDebit, TotalCredit, Balance)
- AccountStatementItemDto (EntryDate, EntryNumber, Description, Debit, Credit, RunningBalance)

### Step 3: Create interface in `PensionMS.Core/Interfaces/IAccountingService.cs`

```csharp
public interface IAccountingService
{
    // Chart of Accounts
    Task<ApiResponse<List<ChartOfAccountDto>>> GetAllAccountsAsync();
    Task<ApiResponse<ChartOfAccountDto>> GetAccountByIdAsync(int id);
    Task<ApiResponse<int>> CreateAccountAsync(CreateChartOfAccountDto dto, int userId);
    Task<ApiResponse<bool>> UpdateAccountAsync(int id, UpdateChartOfAccountDto dto, int userId);
    Task<ApiResponse<bool>> DeleteAccountAsync(int id, int userId);

    // Cost Centers
    Task<ApiResponse<List<CostCenterDto>>> GetAllCostCentersAsync();
    Task<ApiResponse<int>> CreateCostCenterAsync(CreateCostCenterDto dto, int userId);
    Task<ApiResponse<bool>> UpdateCostCenterAsync(int id, UpdateCostCenterDto dto, int userId);
    Task<ApiResponse<bool>> DeleteCostCenterAsync(int id, int userId);

    // Journal Entries
    Task<ApiResponse<int>> CreateJournalEntryAsync(CreateJournalEntryDto dto, int userId);
    Task<ApiResponse<bool>> PostJournalEntryAsync(int id, int userId);
    Task<ApiResponse<bool>> ReverseJournalEntryAsync(int id, string reason, int userId);
    Task<ApiResponse<JournalEntryDto>> GetJournalEntryByIdAsync(int id);
    Task<ApiResponse<PagedResult<JournalEntryDto>>> GetAllJournalEntriesAsync(
        int page, int pageSize, string? sourceModule, string? status, int? periodId);

    // Auto-Posting
    Task<ApiResponse<int>> PostSalaryBatchEntryAsync(int batchId, int userId);
    Task<ApiResponse<int>> PostSettlementBatchEntryAsync(int batchId, int userId);
    Task<ApiResponse<int>> PostOperationalExpenseEntryAsync(int expenseId, int userId);
    Task<ApiResponse<int>> PostMinistryChequeEntryAsync(int chequeId, int userId);
    Task<ApiResponse<int>> PostInvestmentTransactionEntryAsync(
        decimal amount, int? projectId, string description, bool isCredit, int userId);

    // Fiscal Periods
    Task<ApiResponse<List<FiscalPeriodDto>>> GetFiscalPeriodsAsync(int fiscalYearId);
    Task<ApiResponse<int>> CreateFiscalPeriodAsync(CreateFiscalPeriodDto dto, int userId);
    Task<ApiResponse<bool>> CloseFiscalPeriodAsync(int periodId, int userId);
    Task<ApiResponse<bool>> ReopenFiscalPeriodAsync(int periodId, int userId);

    // Reports
    Task<ApiResponse<List<TrialBalanceItemDto>>> GetTrialBalanceAsync(int periodId);
    Task<ApiResponse<List<AccountStatementItemDto>>> GetAccountStatementAsync(
        int accountId, DateTime? fromDate, DateTime? toDate);
}
```

### Step 4: Verify
Run: `cd PensionMS.API && dotnet build`
The build WILL fail because IUnitOfWork and UnitOfWork don't have the new repositories yet. That is expected — we fix it in Phase 3.
```

---

## Phase 3: Build AccountingService, Controller, Register in DI

```
Use @dotnet-backend, @backend-architect, @csharp-pro, and @dotnet-backend-patterns to build the service layer.

CRITICAL: Before writing ANY code, read and strictly follow ALL rules in GEMINI.md at the project root. Pay special attention to:
- Constraint 3.2 (IUnitOfWork — MUST register every new entity)
- Constraint 3.3 (Controller Pattern — No business logic in controller, DI via constructor, Authorize policies)
- Constraint 3.4 (Unified Response Pattern — ApiResponse wrapper)
- Constraint 11.2 (Entity Registration — IUnitOfWork + UnitOfWork + Program.cs)

## Task: Build service + controller + register everything

### Step 1: Register entities in IUnitOfWork + UnitOfWork

**`PensionMS.Core/Interfaces/IUnitOfWork.cs`** — Add:
```csharp
IRepository<ChartOfAccount> ChartOfAccounts { get; }
IRepository<CostCenter> CostCenters { get; }
IRepository<FiscalPeriod> FiscalPeriods { get; }
IRepository<JournalEntry> JournalEntries { get; }
IRepository<JournalEntryLine> JournalEntryLines { get; }
```

**`PensionMS.Infrastructure/Repositories/UnitOfWork.cs`** — Implement the 5 new properties following the existing pattern in the file.

### Step 2: Register DbSets in PensionDbContext

**`PensionMS.Infrastructure/Data/PensionDbContext.cs`** — Add:
```csharp
public DbSet<ChartOfAccount> ChartOfAccounts { get; set; }
public DbSet<CostCenter> CostCenters { get; set; }
public DbSet<FiscalPeriod> FiscalPeriods { get; set; }
public DbSet<JournalEntry> JournalEntries { get; set; }
public DbSet<JournalEntryLine> JournalEntryLines { get; set; }
```
Add proper using statements for the Accounting namespace.

### Step 3: Create AccountingService

**`PensionMS.Infrastructure/Services/Accounting/AccountingService.cs`**

This service implements IAccountingService with the following business rules:

**Chart of Accounts:**
- Cannot delete account with children (sub-accounts)
- Cannot delete account that has journal entry lines
- Validate AccountNature is one of: Asset, Liability, Equity, Revenue, Expense

**Journal Entries:**
- CreateJournalEntryAsync: Validate TotalDebit == TotalCredit (balanced entry). Reject if not balanced. Validate all AccountIDs exist and are IsPostable=true. Validate PeriodID exists and IsClosed=false. Generate EntryNumber automatically (format: JE-YYYYMMDD-NNN). Use BeginTransaction/Commit/Rollback for atomicity.
- PostJournalEntryAsync: Change status from Draft to Posted. Set PostedByUserID and PostedAt. Validate period is still open.
- ReverseJournalEntryAsync: Create a NEW entry with swapped Debit/Credit amounts. Link via ReversedEntryID. Mark original as Reversed. The new reversal entry gets status=Posted immediately.

**Auto-Posting methods:**
- PostSalaryBatchEntryAsync: Read batch amount. Create entry: Debit 5110 (رواتب المتقاعدين), Credit 1120 (حساب الصندوق الجاري). CostCenter = CC-PENSION. SourceModule = "Salary".
- PostSettlementBatchEntryAsync: Debit 5120 (فروقات التسويات), Credit 1120. CostCenter = CC-PENSION. SourceModule = "Settlement".
- PostOperationalExpenseEntryAsync: Read expense. Debit the appropriate 52xx account, Credit 2130 (مصاريف تشغيلية مستحقة). CostCenter = CC-OPS. SourceModule = "Budget".
- PostMinistryChequeEntryAsync: Debit 1110 (النقدية لدى البنوك), Credit 4300 (تمويلات وزارة المالية). CostCenter = CC-HQ. SourceModule = "Budget".
- PostInvestmentTransactionEntryAsync: Based on isCredit flag, create appropriate entry. CostCenter = CC-INV. SourceModule = "Investment".

**Fiscal Periods:**
- CloseFiscalPeriodAsync: Set IsClosed=true, record ClosedByUserID and ClosedAt
- ReopenFiscalPeriodAsync: Set IsClosed=false, clear ClosedByUserID and ClosedAt

**Reports:**
- GetTrialBalanceAsync: Query all JournalEntryLines where entry is Posted and in the specified period. Group by AccountID. Sum Debit and Credit. Calculate Balance = TotalDebit - TotalCredit.
- GetAccountStatementAsync: Query all JournalEntryLines for the given account, date range, where entry is Posted. Order by EntryDate. Calculate running balance.

### Step 4: Create AccountingController

**`PensionMS.API/Controllers/AccountingController.cs`**

Route: `api/accounting`
Inject only IAccountingService via constructor.

Endpoints with policies:
- GET accounts [Accounting.View]
- POST/PUT/DELETE accounts [Accounting.Manage]
- GET cost-centers [Accounting.View]
- POST/PUT/DELETE cost-centers [Accounting.Manage]
- GET journal-entries (paginated) [Accounting.View]
- GET journal-entries/{id} [Accounting.View]
- POST journal-entries [Accounting.Manage]
- POST journal-entries/{id}/post [Accounting.Post]
- POST journal-entries/{id}/reverse [Accounting.Post]
- GET fiscal-periods [Accounting.View]
- POST fiscal-periods [Accounting.Manage]
- POST fiscal-periods/{id}/close [Accounting.ClosePeriod]
- POST fiscal-periods/{id}/reopen [Accounting.ClosePeriod]
- GET reports/trial-balance [Accounting.View]
- GET reports/account-statement [Accounting.View]

### Step 5: Register DI in Program.cs

**`PensionMS.API/Program.cs`** — Add:
```csharp
builder.Services.AddScoped<IAccountingService, AccountingService>();
```
Also add authorization policies: "Accounting.View", "Accounting.Manage", "Accounting.Post", "Accounting.ClosePeriod" following the existing pattern in the file.

### Step 6: Verify
Run: `cd PensionMS.API && dotnet build`
Fix ALL compilation errors. The build MUST succeed.
```

---

## Phase 4: Seed Data + Migration

```
Use @database-migrations-sql-migrations, @database-architect, and @dotnet-backend to create seed data and migration.

CRITICAL: Before writing ANY code, read and strictly follow ALL rules in GEMINI.md at the project root.

## Task: Create seed data and EF migration

### Step 1: Create ChartOfAccountSeeder

**`PensionMS.Infrastructure/Data/Seeders/ChartOfAccountSeeder.cs`**

Seed the following Chart of Accounts (use HasData in a seeder class following the existing seeder pattern):

```
1000 — الأصول (Level 1, Nature: Asset, IsPostable: false)
├── 1100 — الأصول المتداولة (Level 2, IsPostable: false)
│   ├── 1110 — النقدية لدى البنوك (Level 3, IsPostable: true)
│   ├── 1120 — حساب الصندوق الجاري (Level 3, IsPostable: true)
│   ├── 1130 — ذمم مدينة — إيجارات مستحقة (Level 3, IsPostable: true)
│   ├── 1140 — ذمم مدينة — موظفين (Level 3, IsPostable: true)
│   └── 1150 — ذمم مدينة — أخرى (Level 3, IsPostable: true)
├── 1200 — الأصول الثابتة (Level 2, IsPostable: false)
│   ├── 1210 — العقارات الاستثمارية (Level 3, IsPostable: true)
│   ├── 1220 — مجمع إهلاك العقارات (Level 3, IsPostable: true)
│   ├── 1230 — أثاث ومعدات مكتبية (Level 3, IsPostable: true)
│   ├── 1240 — مجمع إهلاك الأثاث والمعدات (Level 3, IsPostable: true)
│   └── 1250 — أصول ثابتة أخرى (Level 3, IsPostable: true)
├── 1300 — الاستثمارات (Level 2, IsPostable: false)
│   ├── 1310 — استثمارات في محافظ مالية (Level 3, IsPostable: true)
│   ├── 1320 — استثمارات عقارية (Level 3, IsPostable: true)
│   └── 1330 — استثمارات أخرى (Level 3, IsPostable: true)
2000 — الالتزامات (Level 1, Nature: Liability, IsPostable: false)
├── 2100 — الالتزامات المتداولة (Level 2, IsPostable: false)
│   ├── 2110 — رواتب تقاعدية مستحقة (Level 3, IsPostable: true)
│   ├── 2120 — تسويات مستحقة الصرف (Level 3, IsPostable: true)
│   ├── 2130 — مصاريف تشغيلية مستحقة (Level 3, IsPostable: true)
│   ├── 2140 — أمانات ومحتجزات (Level 3, IsPostable: true)
│   └── 2150 — التزامات متداولة أخرى (Level 3, IsPostable: true)
├── 2200 — الالتزامات طويلة الأجل (Level 2, IsPostable: false)
│   ├── 2210 — مخصص المعاشات المستقبلية (Level 3, IsPostable: true)
│   └── 2220 — مخصصات أخرى (Level 3, IsPostable: true)
3000 — حقوق الملكية (Level 1, Nature: Equity, IsPostable: false)
├── 3100 — رأس مال الصندوق (Level 2, IsPostable: true)
├── 3200 — الاحتياطي العام (Level 2, IsPostable: true)
├── 3300 — الأرباح المحتجزة من الاستثمار (Level 2, IsPostable: true)
└── 3400 — الفائض / العجز المتراكم (Level 2, IsPostable: true)
4000 — الإيرادات (Level 1, Nature: Revenue, IsPostable: false)
├── 4100 — إيرادات الإيجار (Level 2, IsPostable: true)
├── 4200 — إيرادات الاستثمارات المالية (Level 2, IsPostable: true)
├── 4300 — تمويلات وتحويلات وزارة المالية (Level 2, IsPostable: true)
├── 4400 — أرباح بيع أصول (Level 2, IsPostable: true)
└── 4500 — إيرادات أخرى (Level 2, IsPostable: true)
5000 — المصروفات (Level 1, Nature: Expense, IsPostable: false)
├── 5100 — مصروفات إدارة المعاشات (Level 2, IsPostable: false)
│   ├── 5110 — رواتب المتقاعدين الشهرية (Level 3, IsPostable: true)
│   ├── 5120 — فروقات التسويات (Level 3, IsPostable: true)
│   └── 5130 — مصروفات معاشات أخرى (Level 3, IsPostable: true)
├── 5200 — مصروفات الإدارة التشغيلية (Level 2, IsPostable: false)
│   ├── 5210 — رواتب وأجور الموظفين (Level 3, IsPostable: true)
│   ├── 5220 — بدلات ومكافآت (Level 3, IsPostable: true)
│   ├── 5230 — كهرباء ومياه واتصالات (Level 3, IsPostable: true)
│   ├── 5240 — إيجارات مكاتب ومباني (Level 3, IsPostable: true)
│   ├── 5250 — مستلزمات مكتبية (Level 3, IsPostable: true)
│   └── 5260 — مصروفات إدارية أخرى (Level 3, IsPostable: true)
├── 5300 — مصروفات إدارة الاستثمار (Level 2, IsPostable: false)
│   ├── 5310 — صيانة عقارات (Level 3, IsPostable: true)
│   ├── 5320 — إهلاك الأصول (Level 3, IsPostable: true)
│   ├── 5330 — مصروفات إدارة المحافظ (Level 3, IsPostable: true)
│   └── 5340 — مصروفات استثمارية أخرى (Level 3, IsPostable: true)
└── 5400 — مصروفات عامة أخرى (Level 2, IsPostable: true)
```

Also seed CostCenters:
| ID | Code | Name | ParentID |
|----|------|------|----------|
| 1 | CC-HQ | الإدارة العامة لصندوق التقاعد الأمني | null |
| 2 | CC-PENSION | إدارة المعاشات | 1 |
| 3 | CC-INV | إدارة الاستثمار | 1 |
| 4 | CC-OPS | الإدارة التشغيلية | 1 |

### Step 2: Register seeder in PensionDbContext OnModelCreating

Call the seeder following the existing pattern for other seeders in the codebase.

### Step 3: Create Migration

Run:
```bash
cd PensionMS.API && dotnet ef migrations add ReplaceInvestmentFinanceWithUnifiedAccounting --project ../PensionMS.Infrastructure
```

### Step 4: Verify build
Run: `cd PensionMS.API && dotnet build`
The build MUST succeed with zero errors.
```

---

## Phase 5: Frontend — API Client, Pages, Dialogs

```
Use @frontend-developer, @react-best-practices, @typescript-pro, @tailwind-design-system, @radix-ui-design-system, and @zod-validation-expert to build the accounting frontend.

CRITICAL: Before writing ANY code, read and strictly follow ALL rules in GEMINI.md at the project root. Pay SPECIAL attention to:
- Constraint 1 (Search Before Create — check components/ui/index.ts, hooks/index.ts FIRST)
- Constraint 2 (Mandatory Tool Chains — useCrudState, useCrudMutations, useApiMutation, BaseFormDialog, CrudPageLayout, DataTable, ConfirmDialog)
- Constraint 4 (State Management — useQuery for server data, NO useState for API data)
- Constraint 6 (CSS Variables only, BaseFormDialog for all form dialogs)
- Constraint 7 (NO any — strict TypeScript)
- Constraint 8 (Named exports only, NO default exports, correct import order)
- Constraint 9 (Use shared api from @/api/axios — NEVER axios.create or fetch)
- Constraint 12 (ALL UI text in Arabic, code in English)
- Constraint 13 (RTL — use ps/pe/ms/me/text-start, NEVER pl/pr/ml/mr/text-left)

## Task: Build the complete accounting frontend

### Step 1: Create API client

**`ui/src/api/accounting.ts`** — Follow the moduleApi pattern (Constraint 2.3):

```typescript
export const accountingApi = {
  // Chart of Accounts
  getAccounts: () => api.get<ApiResponse<ChartOfAccountDto[]>>('/accounting/accounts').then(r => r.data),
  getAccount: (id: number) => api.get<ApiResponse<ChartOfAccountDto>>(`/accounting/accounts/${id}`).then(r => r.data),
  createAccount: (data: CreateChartOfAccountDto) => api.post<ApiResponse<number>>('/accounting/accounts', data).then(r => r.data),
  updateAccount: (id: number, data: UpdateChartOfAccountDto) => api.put<ApiResponse<boolean>>(`/accounting/accounts/${id}`, data).then(r => r.data),
  deleteAccount: (id: number) => api.delete<ApiResponse<boolean>>(`/accounting/accounts/${id}`).then(r => r.data),

  // Cost Centers
  getCostCenters: () => ...,
  createCostCenter: (data) => ...,
  updateCostCenter: (id, data) => ...,
  deleteCostCenter: (id) => ...,

  // Journal Entries
  getJournalEntries: (params) => ..., // paginated
  getJournalEntry: (id) => ...,
  createJournalEntry: (data) => ...,
  postEntry: (id) => ...,
  reverseEntry: (id, data) => ...,

  // Fiscal Periods
  getFiscalPeriods: (yearId) => ...,
  createPeriod: (data) => ...,
  closePeriod: (id) => ...,
  reopenPeriod: (id) => ...,

  // Reports
  getTrialBalance: (periodId) => ...,
  getAccountStatement: (accountId, params) => ...,
};
```

**Define ALL TypeScript interfaces in the same file** (ChartOfAccountDto, CostCenterDto, JournalEntryDto, etc.) matching the backend DTOs exactly.

### Step 2: Create Dialogs in `ui/src/features/accounting/`

**ChartOfAccountDialog.tsx** — BaseFormDialog for create/edit account
- Form fields: AccountCode (Input), AccountName (Input), AccountNature (SimpleSelect with options: أصول/التزامات/حقوق ملكية/إيرادات/مصروفات), ParentAccountID (SimpleSelect populated from accounts where IsPostable=false), IsPostable (Switch/Checkbox), Description (Textarea)
- Use react-hook-form + zod schema
- Use useDialogReset, useCrudMutations, useApiMutation
- ALL labels in Arabic

**CostCenterDialog.tsx** — BaseFormDialog for create/edit cost center
- Fields: Code, Name, ParentCostCenterID (SimpleSelect), IsActive

**JournalEntryDialog.tsx** — BaseFormDialog for creating manual journal entries
- Header: EntryDate (date picker), PeriodID (SimpleSelect), Description (Input)
- Dynamic lines table: rows with AccountID (SimpleSelect of postable accounts), CostCenterID (SimpleSelect), Debit, Credit, Description
- Add Row / Remove Row buttons
- Show live totals: Total Debit, Total Credit, Difference — with visual indicator (green if balanced, red if not)
- Use size="xl" for this dialog

**FiscalPeriodDialog.tsx** — BaseFormDialog for creating fiscal period
- Fields: FiscalYearID (SimpleSelect), PeriodName, PeriodNumber, StartDate, EndDate

### Step 3: Create page tabs in `ui/src/pages/accounting/tabs/`

**ChartOfAccountsTab.tsx** — Tree view of accounts
- Render accounts as a collapsible tree (indent by AccountLevel)
- Show AccountCode, AccountName, AccountNature (as Badge), IsPostable indicator
- Add/Edit/Delete buttons using useCrudState
- Include ChartOfAccountDialog and ConfirmDialog

**JournalEntriesTab.tsx** — DataTable with journal entries
- Columns: EntryNumber, EntryDate, Description, SourceModule (as Badge), TotalDebit, TotalCredit, Status (as Badge with colors: Draft=yellow, Posted=green, Reversed=red)
- Filters: SourceModule dropdown, Status dropdown, PeriodID dropdown
- Actions: View details, Post (if Draft), Reverse (if Posted)
- Include JournalEntryDialog

**CostCentersTab.tsx** — CrudPageLayout with DataTable
- Columns: Code, Name, ParentCostCenterName, IsActive (Badge)
- Include CostCenterDialog and ConfirmDialog

**FiscalPeriodsTab.tsx** — DataTable with fiscal periods
- Columns: PeriodName, PeriodNumber, StartDate, EndDate, IsClosed (Badge)
- Actions: Close/Reopen buttons
- Include FiscalPeriodDialog

**ReportsTab.tsx** — Two sub-sections:
1. Trial Balance: Select period → show table with AccountCode, AccountName, Debit, Credit, Balance. Show totals row.
2. Account Statement: Select account + date range → show table with EntryDate, EntryNumber, Description, Debit, Credit, RunningBalance

### Step 4: Create main page

**`ui/src/pages/accounting/AccountingPage.tsx`** — Main page with 5 Tabs:
Tab 1: 🌳 شجرة الحسابات (ChartOfAccountsTab)
Tab 2: 📄 قيود اليومية (JournalEntriesTab)
Tab 3: 🏢 مراكز التكلفة (CostCentersTab)
Tab 4: 📅 الفترات المحاسبية (FiscalPeriodsTab)
Tab 5: 📊 التقارير (ReportsTab)

Use existing Tabs, TabsList, TabsTrigger, TabsContent from @/components/ui.
Named export only: `export function AccountingPage()`

### Step 5: Register route and sidebar

**`ui/src/App.tsx`** — Add route: `/accounting` → AccountingPage

**`ui/src/components/layout/Sidebar.tsx`** — Add "المحاسبة العامة" menu item with Calculator or Landmark icon from lucide-react. Place it logically in the sidebar navigation (near financial sections).

### Step 6: Verify
Run: `cd ui && npm run build && npm run lint`
Fix ALL errors. Zero warnings for unused imports/variables.
```

---

## Phase 6: Auto-Posting Integration

```
Use @dotnet-backend and @csharp-pro to integrate auto-posting into existing services.

CRITICAL: Before writing ANY code, read and strictly follow ALL rules in GEMINI.md at the project root.

## Task: Wire auto-posting into existing services

### Step 1: Inject IAccountingService into SalaryPaymentBatchService

**`PensionMS.Infrastructure/Services/SalaryPaymentBatchService.cs`**

- Add `IAccountingService` to the constructor (alongside existing dependencies)
- In the method that approves/finalizes a salary batch (look for Status change to "Approved" or "معتمد"), add a call AFTER the batch is approved:
```csharp
await _accountingService.PostSalaryBatchEntryAsync(batch.BatchID, userId);
```
- Wrap in try-catch — if auto-posting fails, LOG the error but do NOT rollback the batch approval (the accounting entry can be created manually later)

### Step 2: Inject IAccountingService into SettlementService

**`PensionMS.Infrastructure/Services/SettlementService.cs`**

- Add `IAccountingService` to the constructor
- After a settlement batch is approved, call:
```csharp
await _accountingService.PostSettlementBatchEntryAsync(batch.BatchID, userId);
```
- Same error handling: log but don't rollback

### Step 3: Inject IAccountingService into OperationalBudgetService (or equivalent)

Find the service that handles creating OperationalExpenses and MinistryCheques.

- After creating an OperationalExpense:
```csharp
await _accountingService.PostOperationalExpenseEntryAsync(expense.ExpenseID, userId);
```

- After clearing a MinistryCheque (status change to "Cleared"):
```csharp
await _accountingService.PostMinistryChequeEntryAsync(cheque.ChequeID, userId);
```

### Step 4: Update Program.cs DI if needed

Make sure IAccountingService is registered BEFORE the services that depend on it in Program.cs.

### Step 5: Verify
Run: `cd PensionMS.API && dotnet build`
The build MUST succeed with zero errors.

Run: `cd ui && npm run build`
Frontend must also build successfully.
```
