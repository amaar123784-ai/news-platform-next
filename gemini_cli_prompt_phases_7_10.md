# Gemini CLI Execution Prompt — Phases 7-10: Advanced Accounting Features

> **These phases continue from the unified accounting system built in Phases 1-6.**
> Run each phase as a separate Gemini CLI prompt. Wait for completion before proceeding.

---

## Phase 7: Advanced Financial Reports (Backend + Frontend)

```
Use @dotnet-backend, @csharp-pro, @database-architect, @frontend-developer, @react-best-practices, and @typescript-pro to build advanced financial reports.

CRITICAL: Before writing ANY code, read and strictly follow ALL rules in GEMINI.md at the project root.

## Context
The unified accounting system is already built with: ChartOfAccount, CostCenter, FiscalPeriod, JournalEntry, JournalEntryLine entities. IAccountingService and AccountingService already exist with basic TrialBalance and AccountStatement reports. We now need to add 4 advanced financial reports.

## Task: Build 4 advanced financial reports

### Step 1: Add DTOs in `PensionMS.Core/DTOs/Accounting/AccountingDtos.cs`

Add these new DTOs to the EXISTING file (do NOT create a new file):

```csharp
// ── Balance Sheet (الميزانية العمومية) ──
public class BalanceSheetDto
{
    public DateTime AsOfDate { get; set; }
    public List<BalanceSheetSectionDto> Assets { get; set; } = new();     // 1xxx accounts
    public List<BalanceSheetSectionDto> Liabilities { get; set; } = new(); // 2xxx accounts
    public List<BalanceSheetSectionDto> Equity { get; set; } = new();      // 3xxx accounts
    public decimal TotalAssets { get; set; }
    public decimal TotalLiabilities { get; set; }
    public decimal TotalEquity { get; set; }
    public bool IsBalanced { get; set; }  // Assets == Liabilities + Equity
}

public class BalanceSheetSectionDto
{
    public int AccountID { get; set; }
    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public int AccountLevel { get; set; }
    public bool IsPostable { get; set; }
    public decimal Balance { get; set; }
    public List<BalanceSheetSectionDto> Children { get; set; } = new();
}

// ── Income Statement (قائمة الدخل) ──
public class IncomeStatementDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<IncomeStatementLineDto> Revenues { get; set; } = new();  // 4xxx accounts
    public List<IncomeStatementLineDto> Expenses { get; set; } = new();  // 5xxx accounts
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetIncome { get; set; }  // TotalRevenue - TotalExpenses
}

public class IncomeStatementLineDto
{
    public int AccountID { get; set; }
    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public int AccountLevel { get; set; }
    public decimal Amount { get; set; }
    public List<IncomeStatementLineDto> Children { get; set; } = new();
}

// ── General Ledger (دفتر الأستاذ العام) ──
public class GeneralLedgerDto
{
    public int AccountID { get; set; }
    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string AccountNature { get; set; } = string.Empty;
    public decimal OpeningBalance { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal ClosingBalance { get; set; }
    public List<GeneralLedgerLineDto> Entries { get; set; } = new();
}

public class GeneralLedgerLineDto
{
    public DateTime EntryDate { get; set; }
    public string EntryNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? CostCenterName { get; set; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public decimal RunningBalance { get; set; }
}

// ── Journal Register (يومية القيود) ──
public class JournalRegisterDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalEntries { get; set; }
    public decimal GrandTotalDebit { get; set; }
    public decimal GrandTotalCredit { get; set; }
    public List<JournalRegisterItemDto> Entries { get; set; } = new();
}

public class JournalRegisterItemDto
{
    public int JournalEntryID { get; set; }
    public string EntryNumber { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public string SourceModule { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CreatedByUserName { get; set; } = string.Empty;
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public List<JournalEntryLineDto> Lines { get; set; } = new();
}
```

### Step 2: Add methods to IAccountingService

Open `PensionMS.Core/Interfaces/IAccountingService.cs` and ADD these methods (do NOT remove existing ones):

```csharp
// Advanced Reports
Task<ApiResponse<BalanceSheetDto>> GetBalanceSheetAsync(DateTime asOfDate);
Task<ApiResponse<IncomeStatementDto>> GetIncomeStatementAsync(DateTime fromDate, DateTime toDate);
Task<ApiResponse<GeneralLedgerDto>> GetGeneralLedgerAsync(int accountId, DateTime fromDate, DateTime toDate);
Task<ApiResponse<JournalRegisterDto>> GetJournalRegisterAsync(DateTime fromDate, DateTime toDate, string? sourceModule);
```

### Step 3: Implement in AccountingService

Open `PensionMS.Infrastructure/Services/Accounting/AccountingService.cs` and ADD the implementations:

**GetBalanceSheetAsync:**
- Query ALL posted JournalEntryLines up to `asOfDate`
- Group by AccountID, join with ChartOfAccount
- Filter accounts by nature: Assets (1xxx), Liabilities (2xxx), Equity (3xxx)
- For Asset accounts: Balance = sum(Debit) - sum(Credit)
- For Liability/Equity accounts: Balance = sum(Credit) - sum(Debit)
- Build hierarchical tree from flat list using ParentAccountID
- Set IsBalanced = (TotalAssets == TotalLiabilities + TotalEquity)

**GetIncomeStatementAsync:**
- Query posted JournalEntryLines within date range
- Filter: Revenue (4xxx) and Expense (5xxx)
- Revenue amount = sum(Credit) - sum(Debit)
- Expense amount = sum(Debit) - sum(Credit)
- NetIncome = TotalRevenue - TotalExpenses
- Build hierarchical tree

**GetGeneralLedgerAsync:**
- Calculate opening balance: sum of ALL posted entries for this account BEFORE fromDate
- Query posted entries within date range for this account
- Calculate running balance starting from opening balance
- ClosingBalance = OpeningBalance + TotalDebit - TotalCredit (adjusted by nature)

**GetJournalRegisterAsync:**
- Query all JournalEntries within date range (optionally filtered by sourceModule)
- Include Lines with Account and CostCenter names
- Order by EntryDate, then EntryNumber
- Calculate grand totals

### Step 4: Add endpoints to AccountingController

Open `PensionMS.API/Controllers/AccountingController.cs` and ADD:

```csharp
[HttpGet("reports/balance-sheet")]
[Authorize(Policy = "Accounting.View")]
public async Task<IActionResult> GetBalanceSheet([FromQuery] DateTime asOfDate)

[HttpGet("reports/income-statement")]
[Authorize(Policy = "Accounting.View")]
public async Task<IActionResult> GetIncomeStatement([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)

[HttpGet("reports/general-ledger")]
[Authorize(Policy = "Accounting.View")]
public async Task<IActionResult> GetGeneralLedger([FromQuery] int accountId, [FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)

[HttpGet("reports/journal-register")]
[Authorize(Policy = "Accounting.View")]
public async Task<IActionResult> GetJournalRegister([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate, [FromQuery] string? sourceModule)
```

### Step 5: Add API client functions

Open `ui/src/api/accounting.ts` and ADD to the existing accountingApi object:

```typescript
// Advanced Reports
getBalanceSheet: (asOfDate: string) => api.get('/accounting/reports/balance-sheet', { params: { asOfDate } }).then(r => r.data),
getIncomeStatement: (fromDate: string, toDate: string) => api.get('/accounting/reports/income-statement', { params: { fromDate, toDate } }).then(r => r.data),
getGeneralLedger: (accountId: number, fromDate: string, toDate: string) => api.get('/accounting/reports/general-ledger', { params: { accountId, fromDate, toDate } }).then(r => r.data),
getJournalRegister: (fromDate: string, toDate: string, sourceModule?: string) => api.get('/accounting/reports/journal-register', { params: { fromDate, toDate, sourceModule } }).then(r => r.data),
```

Also add the TypeScript interfaces for all the new DTOs.

### Step 6: Enhance the ReportsTab

Open `ui/src/pages/accounting/tabs/ReportsTab.tsx` and REPLACE it to now include 4 report sections using nested Tabs or an accordion:

1. **ميزان المراجعة** (Trial Balance) — already exists, keep it
2. **كشف حساب** (Account Statement) — already exists, keep it
3. **الميزانية العمومية** (Balance Sheet) — NEW: date picker → hierarchical table showing Assets, Liabilities, Equity with totals and balance check indicator
4. **قائمة الدخل** (Income Statement) — NEW: date range → table showing Revenues, Expenses, Net Income
5. **دفتر الأستاذ العام** (General Ledger) — NEW: account picker + date range → detailed entries with running balance
6. **يومية القيود** (Journal Register) — NEW: date range + source filter → detailed entries grouped by journal entry

Each report should:
- Use useQuery to fetch data
- Show a loading state
- Display data in clean RTL tables
- Show totals in a highlighted footer row
- All labels in Arabic

### Step 7: Verify
Run: `cd PensionMS.API && dotnet build`
Run: `cd ui && npm run build && npm run lint`
Fix ALL errors.
```

---

## Phase 8: Financial Dashboard

```
Use @frontend-developer, @react-best-practices, @typescript-pro, @tailwind-design-system, and @ui-ux-designer to build a financial dashboard.

CRITICAL: Before writing ANY code, read and strictly follow ALL rules in GEMINI.md at the project root. Pay attention to:
- Constraint 1 (Search Before Create — use existing StatCard, Badge, Card from components/ui/index.ts)
- Constraint 6 (CSS Variables only — use hsl(var(--primary)), hsl(var(--gov-success)), etc.)
- Constraint 8 (Named exports only)
- Constraint 12 (ALL UI text in Arabic)
- Constraint 13 (RTL — ps/pe/ms/me, NEVER pl/pr)

## Context
The accounting system already has: ChartOfAccount, JournalEntry, FiscalPeriod, CostCenter entities with full CRUD + reports. We need a dashboard as the landing page for the accounting module.

## Task: Build a financial dashboard

### Step 1: Add dashboard endpoint (Backend)

Add to IAccountingService:
```csharp
Task<ApiResponse<AccountingDashboardDto>> GetDashboardAsync(int? fiscalYearId);
```

Create DTO:
```csharp
public class AccountingDashboardDto
{
    public decimal TotalAssets { get; set; }
    public decimal TotalLiabilities { get; set; }
    public decimal TotalEquity { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetIncome { get; set; }
    public int TotalJournalEntries { get; set; }
    public int DraftEntries { get; set; }
    public int PostedEntries { get; set; }
    public int ReversedEntries { get; set; }
    public int OpenPeriods { get; set; }
    public int ClosedPeriods { get; set; }
    public List<MonthlyFinancialSummaryDto> MonthlySummary { get; set; } = new();
    public List<RecentJournalEntryDto> RecentEntries { get; set; } = new();
    public List<CostCenterSummaryDto> CostCenterBreakdown { get; set; } = new();
}

public class MonthlyFinancialSummaryDto
{
    public string Month { get; set; } = string.Empty;  // "يناير 2026"
    public decimal Revenue { get; set; }
    public decimal Expenses { get; set; }
    public decimal NetIncome { get; set; }
}

public class RecentJournalEntryDto
{
    public int JournalEntryID { get; set; }
    public string EntryNumber { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public string SourceModule { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalDebit { get; set; }
}

public class CostCenterSummaryDto
{
    public string CostCenterName { get; set; } = string.Empty;
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
}
```

Implement in AccountingService:
- TotalAssets/Liabilities/Equity: from posted entries (Balance Sheet logic)
- TotalRevenue/Expenses/NetIncome: from posted entries in current fiscal year
- Entry counts: simple counts from JournalEntries table
- MonthlySummary: group posted entries by month for the selected fiscal year
- RecentEntries: last 10 journal entries ordered by CreatedAt desc
- CostCenterBreakdown: group posted entry lines by CostCenter, sum debits/credits

Add controller endpoint:
```
GET /api/accounting/dashboard?fiscalYearId=1 [Accounting.View]
```

### Step 2: Add to API client

In `ui/src/api/accounting.ts`, add:
```typescript
getDashboard: (fiscalYearId?: number) => api.get('/accounting/dashboard', { params: { fiscalYearId } }).then(r => r.data),
```
Add TypeScript interfaces for all dashboard DTOs.

### Step 3: Create DashboardTab

Create `ui/src/pages/accounting/tabs/DashboardTab.tsx`:

Layout (top to bottom):

**Row 1: StatCards (4 cards)**
Use the existing `StatCard` component from `@/components/ui`:
- إجمالي الأصول (TotalAssets) — icon: Landmark — color: primary
- إجمالي الالتزامات (TotalLiabilities) — icon: AlertTriangle — color: destructive variant
- صافي الدخل (NetIncome) — icon: TrendingUp — color: gov-success
- القيود المحاسبية (TotalJournalEntries) — icon: FileText — secondary

**Row 2: Two cards side by side**
Left card: Monthly Revenue vs Expenses bar/line chart
- Use a simple CSS-based or inline SVG chart (do NOT install recharts or chart.js)
- Show Arabic month names
- Revenue bars in green, Expenses bars in red

Right card: Cost Center Breakdown
- A simple table or horizontal bars showing each cost center's total debits/credits
- Use Badge for cost center names

**Row 3: Two cards side by side**
Left card: Journal Entry Status breakdown
- Show counts with colored badges: مسودة (Draft/yellow), مرحّل (Posted/green), معكوس (Reversed/red)
- Show فترات مفتوحة/مقفلة counts

Right card: Recent Entries (آخر القيود)
- Simple table: EntryNumber, EntryDate, Description, SourceModule (Badge), TotalDebit
- Last 10 entries
- Click row → navigate or show details

### Step 4: Add Dashboard as FIRST tab in AccountingPage

Open `ui/src/pages/accounting/AccountingPage.tsx` and:
- Add DashboardTab as the FIRST tab (default selected)
- Tab label: "📊 لوحة التحكم"
- Move the old tabs after it

### Step 5: Verify
Run: `cd PensionMS.API && dotnet build`
Run: `cd ui && npm run build && npm run lint`
Fix ALL errors.
```

---

## Phase 9: Period-End Closing Procedures

```
Use @dotnet-backend, @csharp-pro, and @backend-architect to build period-end and year-end closing procedures.

CRITICAL: Before writing ANY code, read and strictly follow ALL rules in GEMINI.md at the project root.

## Context
The accounting system has FiscalPeriod (linked to FiscalYear) and JournalEntry entities. We need to implement proper accounting closing procedures: monthly close, year-end close, and opening balances.

## Task: Build closing procedures

### Step 1: Add DTOs

Add to `PensionMS.Core/DTOs/Accounting/AccountingDtos.cs`:

```csharp
public class YearEndCloseDto
{
    public int FiscalYearID { get; set; }
    public int TargetAccountID { get; set; }  // The surplus/deficit account (3400)
}

public class OpeningBalanceDto
{
    public int NewFiscalYearID { get; set; }
    public int SourceFiscalYearID { get; set; }
}

public class ClosingResultDto
{
    public int JournalEntryID { get; set; }
    public string EntryNumber { get; set; } = string.Empty;
    public decimal TotalRevenuesClosed { get; set; }
    public decimal TotalExpensesClosed { get; set; }
    public decimal NetResult { get; set; }  // Surplus or Deficit
    public string ResultType { get; set; } = string.Empty;  // "فائض" or "عجز"
}

public class OpeningBalanceResultDto
{
    public int JournalEntryID { get; set; }
    public string EntryNumber { get; set; } = string.Empty;
    public int AccountsCarriedForward { get; set; }
    public decimal TotalDebits { get; set; }
    public decimal TotalCredits { get; set; }
}
```

### Step 2: Add methods to IAccountingService

```csharp
// Period-End Closing
Task<ApiResponse<ClosingResultDto>> PerformYearEndCloseAsync(YearEndCloseDto dto, int userId);
Task<ApiResponse<OpeningBalanceResultDto>> GenerateOpeningBalancesAsync(OpeningBalanceDto dto, int userId);
Task<ApiResponse<bool>> ValidateAllPeriodsClosedAsync(int fiscalYearId);
```

### Step 3: Implement in AccountingService

**ValidateAllPeriodsClosedAsync:**
- Check that ALL FiscalPeriods for the given year have IsClosed=true
- Return false with message if any period is still open

**PerformYearEndCloseAsync:**
- FIRST call ValidateAllPeriodsClosedAsync — reject if any period is open
- Query all POSTED JournalEntryLine amounts grouped by account for the entire fiscal year
- For REVENUE accounts (4xxx): calculate total credit - total debit for each account
- For EXPENSE accounts (5xxx): calculate total debit - total credit for each account
- Create a CLOSING journal entry:
  - For each revenue account with a balance: Debit the revenue account (to zero it out)
  - For each expense account with a balance: Credit the expense account (to zero it out)
  - The difference (NetResult) goes to the TargetAccountID (3400 الفائض/العجز المتراكم):
    - If Revenue > Expense → Credit 3400 (فائض/surplus)
    - If Expense > Revenue → Debit 3400 (عجز/deficit)
- Set SourceModule = "YearEndClose"
- Set Status = "Posted" immediately
- Use BeginTransaction for atomicity

**GenerateOpeningBalancesAsync:**
- Query the CLOSING balances of all balance sheet accounts (1xxx, 2xxx, 3xxx) as of the end of the source fiscal year
- After year-end close, revenue (4xxx) and expense (5xxx) should be zero — do NOT carry them forward
- Create an OPENING BALANCE journal entry in the first period of the new fiscal year:
  - For each account with a balance: create a line with the closing balance
  - Assets get Debit amounts, Liabilities/Equity get Credit amounts
- Set SourceModule = "OpeningBalance"
- Set Status = "Posted" immediately
- The entry MUST be balanced (total debit == total credit)

### Step 4: Add controller endpoints

```csharp
[HttpPost("year-end-close")]
[Authorize(Policy = "Accounting.ClosePeriod")]
public async Task<IActionResult> PerformYearEndClose([FromBody] YearEndCloseDto dto)

[HttpPost("opening-balances")]
[Authorize(Policy = "Accounting.ClosePeriod")]
public async Task<IActionResult> GenerateOpeningBalances([FromBody] OpeningBalanceDto dto)

[HttpGet("validate-periods-closed")]
[Authorize(Policy = "Accounting.View")]
public async Task<IActionResult> ValidateAllPeriodsClosed([FromQuery] int fiscalYearId)
```

### Step 5: Frontend — Add to FiscalPeriodsTab

Open `ui/src/pages/accounting/tabs/FiscalPeriodsTab.tsx` and ADD:

Add API functions to `ui/src/api/accounting.ts`:
```typescript
yearEndClose: (data: YearEndCloseDto) => api.post('/accounting/year-end-close', data).then(r => r.data),
generateOpeningBalances: (data: OpeningBalanceDto) => api.post('/accounting/opening-balances', data).then(r => r.data),
validatePeriodsClosed: (fiscalYearId: number) => api.get('/accounting/validate-periods-closed', { params: { fiscalYearId } }).then(r => r.data),
```

Add a "إجراءات الإقفال" section below the periods table:
- Button: "إقفال نهاية السنة المالية" — opens a ConfirmDialog explaining what will happen, then calls yearEndClose
- Button: "إنشاء أرصدة افتتاحية للسنة الجديدة" — opens a dialog to select source/target fiscal year
- Show validation: green checkmark if all periods are closed, red warning if not
- Show results after each operation (entry number, amounts closed, net result)

ALL labels in Arabic. Use existing ConfirmDialog and BaseFormDialog components.

### Step 6: Verify
Run: `cd PensionMS.API && dotnet build`
Run: `cd ui && npm run build && npm run lint`
Fix ALL errors.
```

---

## Phase 10: Printable Reports + Audit Trail

```
Use @dotnet-backend, @csharp-pro, @frontend-developer, @react-best-practices, and @typescript-pro to build printable reports and audit trail.

CRITICAL: Before writing ANY code, read and strictly follow ALL rules in GEMINI.md at the project root. Pay attention to:
- Constraint 16 (Printing — use the unified system template pattern, look at existing print components like RetireeStatementPrint for reference)
- Constraint 12 (Arabic labels)
- Constraint 13 (RTL)

## Context
The accounting system has all reports (Trial Balance, Balance Sheet, Income Statement, General Ledger, Journal Register) and closing procedures. We need print-ready versions and an immutable audit trail.

## Task Part A: Printable Financial Reports

### Step 1: Study the existing print pattern

Read `ui/src/pages/retirement-files/components/PrintableRetirementFileReport.tsx` to understand the print template pattern used in this project. Your print components MUST follow the same structural pattern.

### Step 2: Create printable components in `ui/src/pages/accounting/print/`

**PrintableTrialBalance.tsx** — Print-ready trial balance
- Header: "الإدارة العامة لصندوق التقاعد الأمني" + "ميزان المراجعة" + period name + date
- Table: AccountCode, AccountName, Debit, Credit, Balance
- Footer: Totals row + "تم الإعداد بواسطة" + user name + date
- Use CSS @media print styles following the existing pattern
- Named export only

**PrintableBalanceSheet.tsx** — Print-ready balance sheet
- Header: same org name + "الميزانية العمومية" + as-of date
- Three sections: الأصول, الالتزامات, حقوق الملكية
- Each section shows hierarchical accounts with indentation
- Footer: TotalAssets, TotalLiabilities + TotalEquity, IsBalanced indicator

**PrintableIncomeStatement.tsx** — Print-ready income statement
- Header: org name + "قائمة الدخل" + date range
- Two sections: الإيرادات, المصروفات
- Footer: TotalRevenue, TotalExpenses, NetIncome (فائض/عجز)

**PrintableGeneralLedger.tsx** — Print-ready general ledger
- Header: org name + "دفتر الأستاذ العام" + account name + date range
- Opening balance row
- Transaction rows: Date, EntryNumber, Description, Debit, Credit, Balance
- Closing balance row

**PrintableJournalEntry.tsx** — Print a single journal entry
- Header: org name + "سند قيد" + entry number + date
- Entry details: Description, SourceModule, Status
- Lines table: AccountCode, AccountName, CostCenter, Debit, Credit, Description
- Footer: TotalDebit, TotalCredit + signatures area ("المعد" + "المراجع" + "المعتمد")

### Step 3: Add print buttons to report tabs

In ReportsTab.tsx — Add a "طباعة" button next to each report that:
1. Opens the printable component in a new window or uses window.print()
2. Passes the current report data as props

In JournalEntriesTab.tsx — Add a print action on each journal entry row to print the individual entry.

## Task Part B: Accounting Audit Trail

### Step 4: Add audit logging to AccountingService

The project already has `ImmutableAuditLog` entity. Use it for accounting operations.

In `AccountingService.cs`, after each of these operations, create an ImmutableAuditLog entry:

| Operation | Action | Details |
|---|---|---|
| Post Journal Entry | "Accounting.PostEntry" | EntryNumber, TotalDebit, by whom |
| Reverse Journal Entry | "Accounting.ReverseEntry" | Original EntryNumber, reason, by whom |
| Close Fiscal Period | "Accounting.ClosePeriod" | PeriodName, by whom |
| Reopen Fiscal Period | "Accounting.ReopenPeriod" | PeriodName, by whom |
| Year-End Close | "Accounting.YearEndClose" | FiscalYear, NetResult, by whom |
| Generate Opening Balances | "Accounting.OpeningBalances" | Source year → Target year, by whom |

Use the existing pattern for ImmutableAuditLog:
```csharp
var auditLog = new ImmutableAuditLog
{
    Action = "Accounting.PostEntry",
    EntityType = "JournalEntry",
    EntityID = entry.JournalEntryID,
    PerformedByUserID = userId,
    Details = $"ترحيل القيد {entry.EntryNumber} بمبلغ {entry.TotalDebit}",
    PerformedAt = DateTime.UtcNow,
    IPAddress = "System"
};
await _unitOfWork.ImmutableAuditLogs.AddAsync(auditLog);
```

### Step 5: Add audit log viewer to AccountingPage

Add a small "سجل المراجعة" tab or section in the AccountingPage that queries:
```
GET /api/audit-logs?entityType=JournalEntry (or similar existing endpoint)
```

Show a read-only DataTable with: Date, Action, User, Details. This should be view-only — no edit/delete.

### Step 6: Verify
Run: `cd PensionMS.API && dotnet build`
Run: `cd ui && npm run build && npm run lint`
Fix ALL errors. Ensure no unused imports or variables.
```
