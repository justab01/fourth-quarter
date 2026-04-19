# Punctuall App Flow Audit

> Complete walkthrough of all user journeys, identifying UX issues, broken flows, and improvement opportunities.

---

## 1. ONBOARDING FLOW (New Company)

### Entry Points
- `/` → Admin Login page
- `/signup` → Create new company
- `/setup` → Initial company setup

### Flow Walkthrough

#### 1.1 Landing Page (`/`)
**Current State:**
- Shows admin login form
- No clear path for new users to create account
- Link to `/signup` exists but not prominent

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| HIGH | No "Create Account" CTA | New users confused | Add prominent "Create Account" button |
| MEDIUM | No error state for invalid token | Bad UX on errors | Add error message styling |
| LOW | No remember me option | Users must re-login | Add checkbox |

#### 1.2 Signup Page (`/signup`)
**Current State:**
- Form for company name + admin details
- Single-step process

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| LOW | Single step can feel overwhelming | Minor friction | Consider multi-step wizard |
| LOW | No password strength indicator | Security concern | Add strength meter |

#### 1.3 Setup Page (`/setup`)
**Current State:**
- After signup, guides through initial setup
- Adds locations, staff, etc.

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| HIGH | Skip button not obvious | Users feel trapped | Add prominent skip with "finish later" |
| MEDIUM | No progress indicator | Users don't know how long | Add step indicator |

---

## 2. ADMIN FLOW (Daily Operations)

### Entry Points
- Login → Hub Page (`/hub`) → Select Business → Dashboard (`/admin`)

### 2.1 Hub Page (`/hub`)
**Current State:**
- Lists all businesses user has access to
- Shows role (owner/admin/manager)
- Switch between businesses

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| LOW | No search for businesses | None if <5 businesses | Add search if many |
| NONE | Works well | N/A | N/A |

### 2.2 Admin Dashboard (`/admin`)
**Current State:**
- Tabs: Clocked-In, On Break, All Staff, Timesheets, Scheduling, Analytics
- Stats cards at top (staff count, hours, etc.)
- Each tab has filtering and actions

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| HIGH | No "Action Needed" section | Admin misses pending items | Add pending items banner |
| HIGH | No quick actions | Extra clicks for common tasks | Add quick action buttons |
| MEDIUM | Stats cards scroll away on mobile | Lose context | Make sticky or collapsible |
| MEDIUM | No time-off count visible | Time-off requests hidden | Add to dashboard |
| LOW | Analytics tab is empty placeholder | Dead end | Remove or populate |

**Recommended Dashboard Layout:**
```
┌─────────────────────────────────────────────────┐
│ 🔔 ACTION NEEDED (if any pending items)         │
│ • 3 pending time-off requests → [Review]        │
│ • 2 flagged punches today  → [Review]           │
└─────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Staff (12)  │ │ Clocked In  │ │ On Break    │
│ [Active]    │ │ 6           │ │ 2           │
└─────────────┘ └─────────────┘ └─────────────┘

[+ Add Staff] [+ Clock In] [+ Add Shift]

[TABS: Clocked-In | On Break | All Staff | ...]
```

### 2.3 Navigation Between Admin Pages
**Current State:**
- Tabs within dashboard for main features
- Separate routes for settings, locations, employees
- Breadcrumbs inconsistent

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| MEDIUM | No sidebar nav | Hard to discover pages | Add sidebar or bottom nav |
| MEDIUM | Time-off hidden in URL | Users don't know it exists | Add to main nav |
| LOW | Back button sometimes goes to wrong place | Confusing | Standardize history |

### 2.4 Staff Management (`/admin/employees`)
**Current State:**
- List all staff
- Filter by active/archived/all
- Click to view profile
- ✅ Bulk actions now implemented

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| LOW | Search could be faster on large lists | Performance | Add debouncing |
| NONE | Bulk actions work well | N/A | N/A |

### 2.5 Live View (`/admin/live-view`)
**Current State:**
- Shows who's clocked in
- Real-time updates

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| HIGH | No quick actions on employee cards | Extra clicks | Add expandable card with actions |
| MEDIUM | No way to message staff directly | Manager inconvenience | Add notification/message button |
| LOW | Location names not shown | Context missing | Show location badge |

### 2.6 Time Off (`/admin/time-off`)
**Current State:**
- Lists all time-off requests
- Filter by status/employee
- Approve/deny with notes

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| HIGH | Not in main nav | Hard to discover | Add to nav |
| MEDIUM | No calendar view | Time context missing | Add calendar view |
| LOW | No bulk approve | One by one | Add bulk select |

### 2.7 Scheduling (`/admin/scheduling`)
**Current State:**
- Weekly calendar view
- Drag and drop shifts
- Recurring templates

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| MEDIUM | Mobile experience is cramped | Hard to use on phone | Improve mobile layout |
| LOW | No conflict warnings | Double-booking possible | Add conflict detection |

---

## 3. STAFF FLOW (Clock In/Out)

### Entry Points
- Kiosk link: `/kiosk/{token}`
- Staff dashboard: `/kiosk/{token}/dashboard`

### 3.1 Kiosk Landing (`/kiosk/{token}`)
**Current State:**
- Two options: Clock In/Out button, My Dashboard link
- Shows location status
- Live clock with timezone

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| HIGH | My Dashboard link is subtle | Staff don't know it exists | Make more prominent |
| MEDIUM | No quick access to schedule | Staff want to see shifts | Add schedule preview |
| LOW | No theme toggle visible | Users stuck in one theme | Add theme toggle |

**Recommended Landing Layout:**
```
┌─────────────────────────────────────────────────┐
│ Good Morning!                                    │
│ Ready to start your shift?                       │
│                                                  │
│ ┌─────────────────────────────────────────────┐   │
│ │           ⏰ CLOCK IN/OUT                    │   │
│ │           (Big prominent button)             │   │
│ └─────────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────┐ ┌──────────────────┐         │
│ │ 📊 My Dashboard  │ │ 📅 My Schedule   │         │
│ │ Hours, Time Off  │ │ This week       │         │
│ └──────────────────┘ └──────────────────┘         │
│                                                  │
│ 📍 Songbrook House (GPS Ready)                   │
└─────────────────────────────────────────────────┘
```

### 3.2 Kiosk Clock In/Out
**Current State:**
- Name selection with PIN
- Photo capture
- GPS capture
- Break buttons
- Permission primer on first visit
- ✅ Camera fallback now implemented

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| NONE | Works well | N/A | N/A |
| LOW | Permission primer shows every session | Slightly annoying | Already handles session storage |

### 3.3 Staff Dashboard (`/kiosk/{token}/dashboard`)
**Current State:**
- Login with name + PIN
- Tabs: Dashboard, Schedule, Time Off, Profile
- Clock in/out buttons
- Hours overview
- Schedule view

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| HIGH | Hours hidden in Schedule tab | Staff can't see hours easily | Move hours to Dashboard tab |
| HIGH | Time off buried in separate tab | Hard to find | Add to dashboard home |
| MEDIUM | No notification of pending requests | Staff don't know status | Add status badge |
| LOW | Profile can't be edited | Staff frustrated | Add edit capability |

### 3.4 Staff Time Off
**Current State:**
- Form for submitting requests
- History of requests with status

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| NONE | Works well | N/A | N/A |

---

## 4. MANAGER FLOW (Supervision)

### Entry Points
- Same as Admin: Login → Hub → Dashboard

### 4.1 Manager vs Admin Permissions
**Current State:**
- Roles: owner, admin, manager, employee, auditor
- Manager can approve time-off
- Manager can view live attendance

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| MEDIUM | Manager can't clock someone in manually | Need to ask admin | Add permission for managers |
| LOW | No audit log visible to managers | Transparency | Show relevant audit logs |

---

## 5. CROSS-CUTTING ISSUES

### 5.1 Navigation
**Current State:**
- Admin: Hub → Dashboard with tabs → Separate pages for settings
- Staff: Kiosk → Dashboard with tabs

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| HIGH | No consistent nav pattern | Users lost | Create standard nav for each role |
| HIGH | Time-off not in main nav | Feature discovery | Add to nav |
| MEDIUM | No breadcrumbs on some pages | Context lost | Add PageBreadcrumb everywhere |

### 5.2 Error Handling
**Current State:**
- Toast notifications for errors
- Some error boundaries

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| MEDIUM | No retry buttons | Users stuck | Add retry on all error states |
| MEDIUM | Offline not handled | App breaks | Add offline indicator |
| LOW | Session expiry not graceful | Sudden redirect | Add session refresh |

### 5.3 Mobile Experience
**Current State:**
- Responsive design
- Touch targets okay

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| MEDIUM | Scheduling cramped on mobile | Hard to use | Improve mobile layout |
| MEDIUM | Some buttons too small | Touch issues | Audit all touch targets |
| LOW | Long tables scroll horizontally | Data cut off | Improve table responsiveness |

---

## 6. FEATURE GAPS

### 6.1 Missing Features
| Priority | Feature | Who Needs | Status |
|----------|---------|-----------|--------|
| HIGH | Quick actions on dashboard | Admin | Missing |
| HIGH | Pending items banner | Admin | Missing |
| MEDIUM | Calendar view for time-off | Admin/Manager | Missing |
| MEDIUM | In-app messaging | All | Missing |
| LOW | Push notifications | All | Missing |
| LOW | Offline mode | Staff | Missing |

### 6.2 Orphaned/Unused Features
| Page | Status | Action |
|------|--------|--------|
| Analytics tab | Empty placeholder | Populate or remove |
| Integrations tab | Hidden behind feature flag | Keep hidden |
| Billing tab | Hidden behind feature flag | Keep hidden |

---

## 7. SECURITY & DATA FLOW

### 7.1 Auth Flow
**Current State:**
- Token-based auth
- Session stored in localStorage
- Company switching via hub

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| LOW | Session expiry abrupt | User surprise | Add warning before expiry |
| NONE | Auth works well | N/A | N/A |

### 7.2 Data Flow
**Current State:**
- React Query for caching
- Real-time updates for live view

**Issues Found:**
| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| LOW | Some stale data on tab switch | Wrong info shown | Invalidate on tab focus |

---

## 8. SUMMARY OF ISSUES

### Critical (Must Fix Before Launch)
1. ❌ No "Action Needed" section on admin dashboard
2. ❌ No quick actions on admin dashboard
3. ❌ Time-off not in main navigation
4. ❌ Staff dashboard buries hours/time-off

### High Priority (Should Fix)
1. ⚠️ Live view has no quick actions on cards
2. ⚠️ Kiosk landing hides "My Dashboard" link
3. ⚠️ No consistent navigation pattern
4. ⚠️ Staff can't edit own profile

### Medium Priority (Nice to Have)
1. 📝 Mobile scheduling improvements
2. 📝 Calendar view for time-off
3. 📝 Offline mode for kiosk
4. 📝 Push notifications

### Low Priority (Future)
1. 💭 Password strength meter
2. 💭 Audit log for managers
3. 💭 Conflict detection in scheduling

---

## 9. RECOMMENDED FIX ORDER

1. **Admin Dashboard** - Add quick actions + pending items
2. **Staff Dashboard** - Surface hours + time-off
3. **Navigation** - Add time-off to nav, standardize breadcrumbs
4. **Kiosk Landing** - Prominent dashboard + schedule links
5. **Live View** - Quick actions on cards
6. **Mobile Polish** - Responsive improvements
7. **Notifications** - Push notification system

---

## 10. FILES TO MODIFY

### Phase 1: Dashboard & Nav
| File | Changes |
|------|---------|
| `admin-dashboard.tsx` | Add quick actions, pending items |
| `staff-dashboard-page.tsx` | Surface hours, add time-off to home |
| `kiosk-page.tsx` | Improve landing layout |
| All admin pages | Add breadcrumbs |

### Phase 2: Features
| File | Changes |
|------|---------|
| `admin-live-view-page.tsx` | Add quick actions |
| `admin-time-off-page.tsx` | Add calendar view |
| App-wide | Add notification system |

### Phase 3: Polish
| File | Changes |
|------|---------|
| All pages | Mobile improvements |
| All pages | Error handling |
| All pages | Offline indicators |