# Punctuall Production Readiness Audit

> Comprehensive analysis of gaps blocking production release for a workforce management system.

---

## Executive Summary

Punctuall has solid foundations but **six critical gaps** block production readiness:
1. No offline mode (workers can't clock in without internet)
2. No push notifications (no shift reminders or manager alerts)
3. No overtime tracking (labor law compliance risk)
4. No payroll integration (all buttons are placeholders)
5. No timesheet approval workflow (no manager sign-off)
6. No PTO balance tracking (only request tracking, no accrual)

Additionally, **12 high-priority UX issues** and **15 feature gaps** need addressing.

---

## Critical Issues (Blocking Production)

### 1. Offline Mode (CRITICAL)

**Problem:** Staff cannot clock in/out when internet is unavailable.

**Current State:**
- `enableOfflineMode()` and `syncOfflineData()` exist in `mobile.ts` as empty stubs
- All API calls fail silently when network drops
- No IndexedDB/localStorage persistence
- No queue for pending actions

**Business Impact:**
- Construction sites, rural areas, network outages = no clock-in
- Workers lose hours, companies face compliance issues

**Implementation Needed:**
```
IndexedDB Schema:
- pending_clock_events (employeeId, action, timestamp, photo, gps, reason)
- cached_employees (for name/PIN lookup)
- cached_shifts (for schedule display)

Sync Logic:
- Queue all clock/break actions when offline
- Auto-retry with exponential backoff
- Show "Offline - will sync" banner
- Sync on reconnect with conflict resolution
```

---

### 2. Push Notifications (CRITICAL)

**Problem:** No proactive communication between managers and staff.

**Current State:**
- `notificationService.initialize()` exists but not integrated
- No service worker for push
- No VAPID key configuration
- No notification preferences per event

**Business Impact:**
- Managers don't know when time-off is requested
- Staff don't know when requests are approved
- No shift reminders
- No break-end notifications

**Implementation Needed:**
```
Events to Notify:
| Event | Recipients | Priority |
|-------|------------|----------|
| Time-off request submitted | Admins/Managers | High |
| Time-off approved/denied | Staff | High |
| Late clock-in | Manager | Medium |
| Flagged punch (no photo/GPS) | Manager | High |
| Shift reminder (30 min before) | Staff | Medium |
| Schedule change | Affected staff | High |
| Break ending soon | Staff | Low |
| Approaching overtime | Manager, Staff | Medium |

Technical Stack:
- Web Push API (VAPID)
- Service Worker for background
- Fallback to in-app notification center
```

---

### 3. Overtime Tracking (CRITICAL - COMPLIANCE)

**Problem:** No automatic overtime detection or calculation.

**Current State:**
- Schema has `overtimeApprovalRequired` flag
- No overtime threshold configuration
- No overtime hour calculations
- No overtime alerts

**Business Impact:**
- Labor law violations (California: 1.5x after 8h/day, 2x after 12h)
- Missed overtime pay = lawsuits
- No visibility into labor costs

**Implementation Needed:**
```
Settings to Add:
- dailyOvertimeThreshold (default 8 hours)
- weeklyOvertimeThreshold (default 40 hours)
- doubleTimeThreshold (default 12 hours)
- overtimeRate (default 1.5)
- doubleTimeRate (default 2.0)
- seventhDayRule (California: double time on 7th consecutive day)

Display:
- Overtime hours badge on dashboard
- Overtime warning on schedule creation
- Overtime calculation on timesheets
- Payroll report with regular/overtime/double-time breakdown
```

---

### 4. Payroll Integration (CRITICAL)

**Problem:** No actual integration with payroll providers.

**Current State:**
- Settings shows "Integrations" tab with buttons for Gusto, QuickBooks, ADP
- All buttons are non-functional placeholders
- Only Excel export works

**Business Impact:**
- Manual data entry required for every pay period
- Risk of transcription errors
- No automation for growing businesses

---

### 5. Timesheet Approval Workflow (HIGH)

**Problem:** No manager sign-off before payroll.

**Current State:**
- Timesheets can be edited by admins
- No approval state on timesheets
- No employee acknowledgment

**Business Impact:**
- Employees can dispute hours after the fact
- No audit trail of approvals
- Compliance risk for labor audits

---

### 6. PTO Balance Tracking (HIGH)

**Problem:** No accrual or balance tracking for paid time off.

**Current State:**
- Time-off requests are tracked
- No PTO balance per employee
- No accrual rules
- No year-end rollover handling

**Business Impact:**
- Can't enforce PTO limits
- No visibility into liability
- Manual spreadsheets required

---

## High-Priority UX Issues

### 7. Camera Fallback Missing in Staff Dashboard

**Location:** `staff-dashboard-page.tsx`

PhotoCapture component used but `onCameraFallback` not passed - if camera fails, user is stuck.

---

### 8. Late Reason State Leak

**Location:** `kiosk-page.tsx`

Canceling late reason prompt doesn't clean up `pendingPhotoDataUrl`.

---

### 9. PIN Entry Inconsistency

Clock-out requires PIN re-entry, clock-in doesn't. Confusing for staff.

---

### 10. Break Confirmation UX Inconsistency

Kiosk shows break confirmation dialog with return time, dashboard shows toast only.

---

### 11. No Calendar View for Time-Off

Admin sees time-off as list only, hard to see overlapping vacations.

---

### 12. No Profile Editing for Staff

Profile tab is read-only except PIN reset request.

---

### 13. No Self-Service PIN Change

Staff can only "request PIN reset" which notifies manager.

---

### 14. No Schedule Conflict Warnings

No warning when scheduling overlapping shifts for same employee.

---

### 15. No Overtime Warning on Schedule Creation

Can schedule 60+ hour weeks without warning.

---

### 16. No Employee Availability Settings

No way for employees to set preferred hours or unavailable days.

---

### 17. No Shift Swap Requests

Employees can't request shift swaps with coworkers.

---

### 18. No Document Expiration Tracking

Documents (certifications, licenses) have no expiration tracking.

---

## Feature Gaps (Schema Exists, No UI)

| Gap | Schema Fields | Business Need |
|-----|---------------|---------------|
| Schedule Policies UI | `schedulePolicies` table | Enforce schedule rules |
| Device Registration | `pinLength`, `idleTimeoutSeconds` | Kiosk configuration |
| Location WiFi/QR | `wifiSsidAllowlist`, `clockMethodsAllowed` | Secure clock-in methods |
| Break Requirements | `breakRequiredAfterHours` | Labor law compliance |
| Overtime Rules | Fields in policies | Compliance |

---

## Implementation Priority

### Phase 1: Critical for Beta (2-3 weeks)
1. Offline mode for clock-in/out
2. Camera fallback for staff dashboard
3. Late reason state cleanup
4. Break confirmation standardization
5. PIN consistency fix

### Phase 2: Critical for Production (3-4 weeks)
6. Push notification system
7. Overtime tracking and display
8. Timesheet approval workflow
9. PTO balance tracking

### Phase 3: High Priority (4-6 weeks)
10. Payroll integration (CSV export improvement)
11. Calendar view for time-off
12. Profile editing for staff
13. Self-service PIN change
14. Schedule conflict warnings

### Phase 4: Medium Priority (ongoing)
15. Schedule policies UI
16. Device registration
17. Location WiFi/QR
18. Break requirement enforcement
19. Labor cost tracking
20. Bulk import
21. Multi-language support