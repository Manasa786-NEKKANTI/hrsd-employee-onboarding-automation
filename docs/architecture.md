# Architecture — HRSD Employee Onboarding

## Application Scope

- **Scope Name**: HRSD Employee Onboarding
- **Scope Prefix**: `x_hrsd_onboarding`
- **Platform**: ServiceNow Washington DC / Xanadu
- **Module**: HR Service Delivery (HRSD)

---

## Core Tables Used

| Table | Purpose |
|---|---|
| `sn_hr_core_case` | Main HR Case for each onboarding employee |
| `sn_hr_core_task` | Individual provisioning tasks per department |
| `sn_hr_core_lifecycle_event` | Triggers on hire date milestones |
| `sys_user` | Employee and manager records |
| `sys_user_group` | Department groups for task assignment |
| `sn_ws_rest_message` | REST Message config for AD integration |
| `sp_widget` | Service Portal custom widgets |

## Custom Fields Added

### On `sn_hr_core_case`:
| Field | Type | Purpose |
|---|---|---|
| `u_employee_id` | String | Unique employee ID |
| `u_start_date` | Date | First day of employment |
| `u_department` | String | New hire's department |
| `u_hiring_manager` | Reference (sys_user) | Manager reference |
| `u_salary` | Currency | Salary (restricted ACL) |
| `u_bank_account` | String | Bank details (restricted ACL) |
| `u_tax_id` | String | Tax ID (restricted ACL) |
| `u_personal_address` | String | Home address |
| `u_emergency_contact` | String | Emergency contact |
| `u_ad_username` | String | Populated after AD provisioning |
| `u_ad_provisioned` | Boolean | AD provisioning status flag |
| `u_ad_provisioned_on` | DateTime | When AD account was created |
| `u_flow_started` | DateTime | Flow orchestration start time |
| `u_onboarding_completed_on` | DateTime | Completion timestamp |

### On `sn_hr_core_task`:
| Field | Type | Purpose |
|---|---|---|
| `u_department_scope` | Choice (IT/Facilities/Payroll) | Routes task to correct team |

---

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    SERVICE PORTAL (Employee-facing)            │
│  ┌──────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│  │ Checklist Widget │ │  Doc Upload    │ │  Case Status    │  │
│  │ (AngularJS)      │ │  Widget        │ │  Tracker Widget │  │
│  └────────┬─────────┘ └───────┬────────┘ └────────┬────────┘  │
│           │ GlideAjax          │ REST API           │ GlideAjax │
└───────────┼────────────────────┼────────────────────┼──────────┘
            ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                    SERVICENOW PLATFORM                        │
│                                                              │
│  ┌─────────────────┐    ┌───────────────────────────────┐   │
│  │  HR Case        │───▶│  Business Rule                │   │
│  │  (sn_hr_core    │    │  create_onboarding_tasks.js   │   │
│  │   _case)        │    └───────────────┬───────────────┘   │
│  └────────┬────────┘                    │                    │
│           │                             ▼                    │
│           │              ┌──────────────────────────────┐   │
│           │              │  HR Tasks (sn_hr_core_task)  │   │
│           │              │  • IT Tasks (3)               │   │
│           │              │  • Facilities Tasks (2)       │   │
│           │              │  • Payroll Tasks (2)          │   │
│           │              └──────────────────────────────┘   │
│           │                                                  │
│           ▼                                                  │
│  ┌────────────────────────────────────────────────┐         │
│  │         Flow Designer                          │         │
│  │  Onboarding Orchestration Flow                 │         │
│  │                                                │         │
│  │  [Trigger] ──▶ [Parallel Branch] ──▶ [Wait]  │         │
│  │                  IT Tasks                      │         │
│  │                  Facilities Tasks              │         │
│  │                       │                        │         │
│  │               [REST Subflow] ──▶ [Payroll]   │         │
│  │               AD Provisioning   Tasks         │         │
│  │                       │                        │         │
│  │               [Lifecycle Event]               │         │
│  │               Onboarding Complete             │         │
│  └────────────────────────┬───────────────────────┘         │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────┐           │
│  │   Script Include: OnboardingUtils            │           │
│  │   • createHRTask()                           │           │
│  │   • triggerADProvisioning()                  │           │
│  │   • allTasksComplete()                       │           │
│  │   • getBusinessDayOffset()                   │           │
│  └──────────────────────────┬───────────────────┘           │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │ REST API (HTTPS)
                              ▼
              ┌──────────────────────────────┐
              │   Mock Active Directory      │
              │   POST /provision-user       │
              │   Returns: {username, email} │
              └──────────────────────────────┘
```

---

## Security Layers

```
Request ──▶ [1. Session Auth] ──▶ [2. Table ACL] ──▶ [3. Field ACL] ──▶ Data
                │                       │                    │
           ServiceNow              Role-based           Sensitive
           login                   access               fields only
```

1. **Session Authentication**: ServiceNow SSO / username+password
2. **Table-Level ACLs**: Who can read/write HR Cases and Tasks
3. **Field-Level ACLs**: Salary, bank, tax data restricted by role
4. **Widget Queries**: Additional `opened_for = currentUser` filter in portal widgets
5. **Credential Store**: REST API credentials never in code, always in ServiceNow Credential Alias
