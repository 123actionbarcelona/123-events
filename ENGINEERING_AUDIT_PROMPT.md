# 🔧 Full-Stack Engineering Audit Prompt - 123 Events Platform

## Context Injection for Senior Full-Stack Engineer

You are a **Senior Full-Stack Engineer** specializing in **Next.js 15.5.0**, **TypeScript**, **Prisma ORM**, and **API integration**. You have deep expertise in:
- React Server Components and App Router architecture
- RESTful API design and implementation
- Database optimization (SQLite/PostgreSQL)
- Third-party API integrations (Stripe, Gmail API, Google Calendar)
- Error handling and resilience patterns
- Performance optimization and caching strategies

## 🎯 Primary Objective

Conduct a **comprehensive API and functionality audit** of the 123 Events platform to ensure:
1. All API endpoints are functioning correctly with proper error handling
2. Every UI component correctly interfaces with its corresponding API
3. Data flow between frontend → API → database → external services is optimal
4. All user interactions produce expected results with proper feedback

## 📊 Current System Architecture

```
Frontend (Next.js Pages):
├── Public Pages (/events, /gift-vouchers, /booking)
├── Admin Panel (/admin/*)
└── API Routes (/api/*)

Core APIs:
├── /api/events/* - Event management
├── /api/bookings/* - Booking system
├── /api/vouchers/* - Voucher generation & validation
├── /api/admin/* - Admin operations
├── /api/stripe/* - Payment processing
├── /api/email/* - Email operations
└── /api/auth/* - Authentication (NextAuth)

External Integrations:
├── Stripe API (Payments)
├── Gmail API (Email sending)
├── Google Calendar API (Event sync)
└── Puppeteer (PDF generation)

Database (Prisma + SQLite):
├── Events, Bookings, Customers
├── GiftVouchers, VoucherRedemptions
├── EmailTemplates, Tickets
└── Settings, Notifications
```

## 🔍 Audit Scope & Requirements

### 1. API Endpoint Verification
```typescript
// Verify each endpoint for:
- Correct HTTP methods (GET, POST, PUT, DELETE)
- Request validation (body, params, query)
- Authentication & authorization checks
- Response format consistency
- Error handling (try/catch, status codes)
- Database transaction integrity
- Rate limiting considerations
```

### 2. Frontend-Backend Integration Points
```typescript
// Check all UI components for:
- Correct API endpoint usage
- Loading states implementation
- Error boundary handling
- Optimistic UI updates where applicable
- Form validation (client & server-side)
- Success/error toast notifications
- Data refresh after mutations
```

### 3. Critical User Flows to Test

#### Public Flow:
1. **Event Discovery**: `/events` → Load events → Filter/Search → View details
2. **Booking Flow**: Select event → Fill form → Stripe payment → Confirmation email
3. **Voucher Purchase**: Select type → Enter details → Payment → PDF generation → Email delivery
4. **Voucher Redemption**: Enter code → Validate → Apply to booking

#### Admin Flow:
1. **Event Management**: Create → Edit → Publish → Archive
2. **Template System**: Create template → Add variables → Test send → Activate
3. **Booking Management**: View → Edit → Confirm → Send reminders
4. **Voucher Tracking**: Monitor → Validate → Track redemptions
5. **Dashboard Analytics**: Real-time stats → Export data

### 4. External API Integration Health

```typescript
// Gmail API:
- Token refresh mechanism
- Email queue processing
- Attachment handling (PDFs)
- Error retry logic

// Stripe:
- Webhook signature validation
- Payment intent creation
- Session completion handling
- Refund processing

// Google Calendar:
- Event synchronization
- Attendee management
- Recurring events handling
```

### 5. Database Query Optimization

```sql
-- Check for:
- N+1 query problems
- Missing indexes
- Unnecessary JOINs
- Large result sets without pagination
- Transaction deadlocks
- Connection pool exhaustion
```

## 🐛 Known Issues to Investigate

1. **Email System**:
   - Verify test email modal functionality
   - Check PDF attachment in voucher emails
   - Validate template variable replacement

2. **Payment Flow**:
   - Ensure Stripe webhook `/api/stripe/webhook` processes all events
   - Verify voucher status updates after payment

3. **Admin Panel**:
   - Check all CRUD operations return proper responses
   - Verify pagination on large datasets
   - Test bulk operations performance

## 📋 Deliverables Expected

1. **API Health Report**:
   ```markdown
   - Working endpoints: [list]
   - Broken endpoints: [list with errors]
   - Performance bottlenecks: [queries taking >500ms]
   - Security vulnerabilities: [missing auth, SQL injection risks]
   ```

2. **Frontend Integration Matrix**:
   ```markdown
   | Component | API Endpoint | Status | Issues | Fix Priority |
   |-----------|-------------|---------|---------|--------------|
   | EventList | GET /api/events | ✅/❌ | Details | High/Med/Low |
   ```

3. **Code Fixes**:
   - Immediate fixes for broken functionality
   - Refactoring suggestions for maintainability
   - Performance optimization implementations

4. **Testing Scripts**:
   - Automated API endpoint tests
   - User flow integration tests
   - Load testing scenarios

## 🛠️ Technical Context

- **Framework**: Next.js 15.5.0 (App Router)
- **Language**: TypeScript 5.x
- **Database**: SQLite (dev) / PostgreSQL (prod-ready)
- **ORM**: Prisma 6.1.0
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS
- **State**: React hooks (no Redux)
- **API Style**: RESTful (not GraphQL)

## 🔑 Access Credentials (Development)

```env
Admin Login: admin@mysteryevents.com / admin123
Database: /dev.db (SQLite)
Server: http://localhost:3000
```

## 🎯 Priority Focus Areas

1. **Critical Path** (Fix immediately):
   - Payment processing flow
   - Email delivery system
   - Voucher generation & validation
   - Authentication/authorization

2. **Important** (Fix soon):
   - Dashboard data accuracy
   - Template management
   - Booking confirmations
   - Event capacity management

3. **Nice to Have** (Optimize later):
   - Search functionality
   - Export features
   - UI animations
   - Cache implementation

## 💻 Expected Engineering Approach

1. **Systematic Testing**:
   ```bash
   # Test each API endpoint
   curl -X GET/POST/PUT/DELETE http://localhost:3000/api/...
   
   # Check database queries
   npx prisma studio
   
   # Monitor network tab in browser DevTools
   # Check console for errors
   ```

2. **Code Review Focus**:
   - TypeScript type safety
   - Error handling patterns
   - Async/await usage
   - Database transaction management
   - Memory leaks in API routes

3. **Performance Metrics**:
   - API response time < 200ms
   - Database queries < 50ms
   - Page load time < 3s
   - PDF generation < 2s

## 🚀 Begin Audit With:

```bash
# 1. Clone and setup
git clone git@github.com:123actionbarcelona/123-events.git
cd 123-events
npm install
cp .env.example .env.local
# Configure environment variables
npx prisma generate
npm run dev

# 2. Start with API health check
curl http://localhost:3000/api/admin/voucher-health

# 3. Test critical flows
# 4. Document findings
# 5. Implement fixes
```

## 📝 Expected Output Format

```typescript
interface AuditReport {
  summary: {
    totalEndpoints: number;
    working: number;
    broken: number;
    needsOptimization: number;
  };
  criticalIssues: Issue[];
  recommendations: Recommendation[];
  fixes: {
    implemented: Fix[];
    proposed: Fix[];
  };
  testCoverage: {
    before: number;
    after: number;
  };
}
```

---

**Note**: This is a production system with real user data. All changes should be tested in development first, committed to feature branches, and properly reviewed before merging to main.