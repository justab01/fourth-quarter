# Holistic Staff Experience Design

> Making Punctuall a complete, cohesive workforce management system from onboarding to daily operations.

## User Personas

### 1. Business Owner / Admin (Abraham)
**Goals:** See operations at a glance, manage team, ensure compliance, get paid

**Day in the Life:**
- **Morning:** Check overnight activity, review flagged punches (GPS issues, no photo, late arrivals)
- **Midday:** Add new staff, adjust schedules, handle time-off requests
- **Evening:** Review hours worked, prepare payroll data, check attendance patterns

**Current Pain Points:**
- Dashboard has data but no quick actions
- Time-off only visible in admin, staff can't request
- No mobile-friendly admin experience

### 2. Manager / Supervisor
**Goals:** Ensure coverage, handle issues, approve requests

**Day in the Life:**
- **Start of shift:** See who's clocked in, who's expected
- **During shift:** Handle call-outs, adjust assignments, monitor live attendance
- **End of shift:** Approve overtime, review break compliance

**Current Pain Points:**
- Can't quickly message staff
- No way to see who's scheduled vs actually clocked in
- Time-off requests hidden in settings

### 3. Staff / Employee (Maureen, MR IKOKU, etc.)
**Goals:** Clock in/out easily, know schedule, request time off, see hours

**Day in the Life:**
- **Arrival:** Open kiosk on phone, select name, enter PIN, photo, done
- **During shift:** Take break, see remaining time
- **Leaving:** Clock out, see hours worked today
- **Planning:** Check schedule, request time off, see upcoming shifts

**Current Pain Points:**
- Can't request time off themselves
- No easy way to see their own hours/history
- Dashboard exists but is hidden/buried

---

## Feature Flow Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ONBOARDING                                       │
│  Company Setup → Add Locations → Add Staff → Set Schedules → Go Live        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   ADMIN APP   │           │  MANAGER APP  │           │  STAFF APP    │
├───────────────┤           ├───────────────┤           ├───────────────┤
│ Dashboard     │           │ Live View     │           │ Kiosk         │
│ - Today stats │           │ - Who's in    │           │ - Clock In/Out│
│ - Quick add   │           │ - Alerts      │           │ - Break       │
│ - Alerts      │           │ - Quick msg   │           │ - Photo       │
│               │           │               │           │               │
│ Staff         │           │ Staff Cards   │           │ Dashboard     │
│ - Add/Edit    │           │ - Tap to view │           │ - My Hours    │
│ - Assign      │           │ - Quick PIN   │           │ - My Schedule │
│ - Archive     │           │ - Notes       │           │ - Time Off    │
│               │           │               │           │ - Profile     │
│ Locations     │           │ Scheduling    │           │               │
│ - Add houses  │           │ - Today view  │           │ Time Off      │
│ - GPS radius  │           │ - Drag assign │           │ - Request     │
│ - Map preview │           │ - Templates   │           │ - History     │
│               │           │               │           │ - Status     │
│ Scheduling    │           │ Time Off      │           │               │
│ - Weekly view │           │ - Approve     │           │ Shift Notes   │
│ - Recurring   │           │ - Deny        │           │ - Read only   │
│ - Templates   │           │               │           │               │
│               │           │ Reports       │           │               │
│ Time Off      │           │ - Today       │           │               │
│ - View all    │           │ - This week    │           │               │
│ - Approve     │           │               │           │               │
│ - Deny        │           │               │           │               │
│               │           │               │           │               │
│ Reports       │           │               │           │               │
│ - Payroll     │           │               │           │               │
│ - Attendance  │           │               │           │               │
│ - Export      │           │               │           │               │
│               │           │               │           │               │
│ Settings      │           │               │           │               │
│ - Company     │           │               │           │               │
│ - Policies    │           │               │           │               │
│ - Integrations│           │               │           │               │
└───────────────┘           └───────────────┘           └───────────────┘
```

---

## Gap Analysis: Current vs Ideal

### STAFF EXPERIENCE (Priority)

| Feature | Current State | Ideal State | Gap |
|---------|--------------|-------------|-----|
| **Kiosk** | ✅ Full feature | Clock in/out, break, photo | None - Complete |
| **Time Off** | ❌ Admin only | Staff can request, see history | **MISSING** |
| **My Hours** | ⚠️ Exists but buried | Prominent in dashboard | **UX ISSUE** |
| **My Schedule** | ⚠️ Exists but buried | Prominent in dashboard | **UX ISSUE** |
| **Profile** | ⚠️ View only | Edit own profile, photo | **PARTIAL** |
| **Notifications** | ❌ None | Push for approvals, schedule | **MISSING** |

### MANAGER EXPERIENCE

| Feature | Current State | Ideal State | Gap |
|---------|--------------|-------------|-----|
| **Live View** | ✅ Shows clocked in | + Quick actions, alerts | **PARTIAL** |
| **Staff Cards** | ❌ Separate page | Tap-to-expand on live view | **UX ISSUE** |
| **Quick PIN** | ❌ Must go to staff page | Inline reset on live view | **MISSING** |
| **Scheduling** | ✅ Works | Drag to reassign | **COMPLETE** |
| **Time Off** | ⚠️ In settings | Prominent in dashboard | **UX ISSUE** |

### ADMIN EXPERIENCE

| Feature | Current State | Ideal State | Gap |
|---------|--------------|-------------|-----|
| **Dashboard** | ⚠️ Stats only | Stats + Quick actions | **UX ISSUE** |
| **Bulk Actions** | ✅ Just added | Bulk archive, assign | **COMPLETE** |
| **Reports** | ⚠️ Basic | Payroll export, attendance patterns | **PARTIAL** |
| **Settings** | ✅ Complete | All policies configurable | **COMPLETE** |

---

## Implementation Plan

### Phase 1: Staff Time Off (THIS WEEK)
**Goal:** Staff can request and track their own time off

**Changes:**
1. Add Time Off tab to kiosk dashboard (`/kiosk/{token}/dashboard`)
2. Create time-off request form (date picker, reason, type)
3. Show request history with status (pending/approved/denied)
4. Push notifications when request is reviewed
5. Admin/manager sees requests in their dashboard

### Phase 2: Dashboard Reorganization (NEXT WEEK)
**Goal:** Surface most-used features prominently

**Staff Dashboard Changes:**
```
Current:                          Ideal:
- My Hours (hidden)               ┌─────────────────────────┐
- My Schedule (hidden)            │ 📅 THIS WEEK            │
- Settings (hidden)               │ Mon: 9a-5p (Main House) │
                                  │ Tue: OFF (Approved)     │
                                  │ Wed: 9a-5p (Parkridge) │
                                  └─────────────────────────┘
                                  ┌─────────────────────────┐
                                  │ ⏱️ HOURS THIS WEEK      │
                                  │ 32.5 hrs worked        │
                                  │ 7.5 hrs remaining      │
                                  └─────────────────────────┘
                                  ┌─────────────────────────┐
                                  │ 🏖️ TIME OFF            │
                                  │ [Request Time Off]      │
                                  │ 1 pending | 2 approved │
                                  └─────────────────────────┘
```

**Admin Dashboard Changes:**
```
Current:                          Ideal:
- Stats only                      ┌─────────────────────────┐
                                  │ 🔔 ACTION NEEDED        │
                                  │ 3 time-off requests     │
                                  │ 2 flagged punches       │
                                  │ 1 break waiver pending  │
                                  └─────────────────────────┘
                                  ┌─────────────────────────┐
                                  │ 👥 TODAY                │
                                  │ 6 clocked in / 8 total  │
                                  │ [Live View]             │
                                  └─────────────────────────┘
```

### Phase 3: Quick Actions (WEEK 3)
**Goal:** Reduce clicks for common tasks

**Add to Live View:**
- Tap employee card → Quick PIN reset
- Tap employee card → Send message
- Tap employee card → View recent hours
- Long press → Bulk select for actions

**Add to Dashboard:**
- Quick "Add Staff" button always visible
- Quick "Clock Someone In" (for forgotten punches)
- Quick "Add Shift" for today

### Phase 4: Notifications (WEEK 4)
**Goal:** Proactive updates, not reactive checking

**Staff Notifications:**
- Shift reminder (30 min before)
- Time-off request approved/denied
- Schedule change affecting them
- Clock-in/out confirmation

**Manager/Admin Notifications:**
- Time-off request submitted
- Flagged punch (no photo, GPS issue)
- Someone clocked in late
- Someone approaching overtime

---

## Feature Audit Checklist

### To Review & Update:
- [ ] `/kiosk/{token}/dashboard` - Staff personal dashboard
- [ ] `/kiosk/{token}` - Main kiosk clock in/out
- [ ] `/admin` - Admin dashboard (add quick actions)
- [ ] `/admin/live` - Live view (add quick actions)
- [ ] `/admin/staff` - Staff management (bulk actions done)
- [ ] `/admin/locations` - Location management (map preview done)
- [ ] `/admin/schedule` - Scheduling
- [ ] `/admin/time-off` - Time off management
- [ ] `/admin/reports` - Reports & exports
- [ ] `/admin/settings` - Company settings

### To Create:
- [ ] Staff time-off request UI in dashboard
- [ ] Quick action buttons on admin dashboard
- [ ] Notification center
- [ ] In-app messaging (optional future)

### To Remove/Consolidate:
- [ ] Review for duplicate pages/features
- [ ] Consolidate navigation
- [ ] Remove unused code

---

## Real-Life Day Scenarios

### Scenario 1: Normal Day (Maureen - House Staff)
1. **8:55am** - Arrives at Songbrook House
2. Opens Punctuall on phone (saved to home screen)
3. Taps "Clock In", selects name, enters PIN, photo taken
4. Sees "Clocked in at 9:00am - Songbrook House" with location
5. **12:00pm** - Starts 30-min break from kiosk
6. **12:30pm** - Ends break, returns to work
7. **5:00pm** - Clocks out, sees "You worked 8 hours today"
8. Checks schedule for tomorrow on dashboard

### Scenario 2: Time Off Request (MR IKOKU)
1. Opens Punctuall dashboard
2. Taps "Time Off" → "Request Time Off"
3. Selects dates (next Friday), type (Personal), reason
4. Submits request
5. Abraham gets notification: "New time-off request"
6. Abraham opens admin, reviews, approves
7. MR IKOKU gets notification: "Request approved"

### Scenario 3: Issue Handling (Admin - Abraham)
1. **9:15am** - Get notification: "Ifeanyi clocked in 15 min late"
2. Opens admin dashboard, sees flagged punch
3. Taps to view details, sees late reason (Traffic)
4. Accepts or adds note for review
5. **2:00pm** - Get notification: "GPS unavailable - Lucky Akujinwa"
6. Reviews GPS reason, sees "Working off-site"
7. Approves exception or follows up

### Scenario 4: Coverage Issue (Manager)
1. **7:30am** - Get notification: "Adekemi called out sick"
2. Opens live view, sees who's scheduled today
3. Drags shift to available staff member
4. Staff member gets notification of schedule change
5. Manager confirms coverage is set

---

## Success Metrics

### Staff Satisfaction:
- Clock in/out time: < 10 seconds
- Time off request: < 2 minutes
- Schedule visibility: Always accessible
- Hours visibility: Real-time update

### Admin Efficiency:
- Daily review time: < 5 minutes
- Time-off approval: < 30 seconds
- New staff setup: < 2 minutes
- Payroll prep: Export in 1 click

### System Health:
- Uptime: 99.9%
- Photo success rate: > 95%
- GPS capture rate: > 90%
- Push notification delivery: > 98%

---

## Next Steps

1. **Implement Staff Time Off** - Start with kiosk dashboard
2. **Reorganize Staff Dashboard** - Surface hours, schedule, time off
3. **Add Quick Actions** - Admin dashboard + live view
4. **Notification System** - Push notifications via service worker
5. **Full App Audit** - Remove redundancy, ensure purpose