# ACL Definitions — HRSD Employee Onboarding

## Overview

All ACLs are scoped under `x_hrsd_onboarding` and follow ServiceNow's role-based access control model. Sensitive fields have field-level ACLs in addition to table-level ACLs.

---

## Table-Level ACLs

### `sn_hr_core_case` (HR Cases)

| Operation | Roles Allowed | Notes |
|---|---|---|
| `read` | `hr_admin`, `hr_agent`, `sn_hr_core.basic` | Employees see only their own records (condition script) |
| `write` | `hr_admin`, `hr_agent` | |
| `create` | `hr_admin`, `hr_agent` | |
| `delete` | `hr_admin` | Hard delete restricted to admin only |

**Condition Script for employee self-service read:**
```javascript
// Applied to sn_hr_core_case READ — limits employees to their own cases
if (gs.hasRole('x_hrsd_onboarding.hr_admin') ||
    gs.hasRole('x_hrsd_onboarding.hr_agent')) {
    answer = true;
} else {
    // Employees can only see their own case
    answer = (current.opened_for == gs.getUserID());
}
```

---

### `sn_hr_core_task` (HR Tasks)

| Operation | Roles Allowed | Notes |
|---|---|---|
| `read` | `hr_admin`, `hr_agent`, `it_agent`, `facilities_agent`, `payroll_agent` | Each agent sees only their department's tasks |
| `write` | `hr_admin`, `hr_agent`, `it_agent`, `facilities_agent`, `payroll_agent` | Department-scoped |
| `create` | `hr_admin`, `hr_agent` | Tasks created by HR only |
| `delete` | `hr_admin` | |

**Condition Script for department-scoped task access:**
```javascript
// IT agents see only IT-scoped tasks
if (gs.hasRole('x_hrsd_onboarding.it_agent') &&
    !gs.hasRole('x_hrsd_onboarding.hr_admin')) {
    answer = (current.u_department_scope == 'IT');
} else {
    answer = true;
}
```

---

## Field-Level ACLs — Sensitive Fields

### `u_salary` (HR Case)

| Role | Read | Write |
|---|---|---|
| `hr_admin` | ✅ | ✅ |
| `payroll_agent` | ✅ | ✅ |
| `hr_agent` | ❌ | ❌ |
| `it_agent` | ❌ | ❌ |
| `facilities_agent` | ❌ | ❌ |
| `employee` | ❌ | ❌ |

---

### `u_bank_account` (HR Case)

| Role | Read | Write |
|---|---|---|
| `hr_admin` | ✅ | ✅ |
| `payroll_agent` | ✅ | ✅ |
| All others | ❌ | ❌ |

---

### `u_tax_id` (HR Case)

| Role | Read | Write |
|---|---|---|
| `hr_admin` | ✅ | ✅ |
| `payroll_agent` | ✅ | ✅ |
| All others | ❌ | ❌ |

---

### `u_personal_address` (HR Case)

| Role | Read | Write |
|---|---|---|
| `hr_admin` | ✅ | ✅ |
| `hr_agent` | ✅ | ❌ |
| `payroll_agent` | ✅ | ❌ |
| `it_agent` | ❌ | ❌ |
| `facilities_agent` | ❌ | ❌ |

---

### `u_emergency_contact` (HR Case)

| Role | Read | Write |
|---|---|---|
| `hr_admin` | ✅ | ✅ |
| `hr_agent` | ✅ | ❌ |
| `it_agent` | ❌ | ❌ |
| `facilities_agent` | ❌ | ❌ |

---

## Role Definitions

All roles are in scope `x_hrsd_onboarding`:

| Role Name | Full Role String | Description |
|---|---|---|
| HR Admin | `x_hrsd_onboarding.hr_admin` | Full access to all data including sensitive fields |
| HR Agent | `x_hrsd_onboarding.hr_agent` | Manage cases and tasks, no sensitive financial data |
| IT Agent | `x_hrsd_onboarding.it_agent` | IT Tasks only |
| Facilities Agent | `x_hrsd_onboarding.facilities_agent` | Facilities Tasks only |
| Payroll Agent | `x_hrsd_onboarding.payroll_agent` | Payroll Tasks + salary/bank fields |
| Employee | `x_hrsd_onboarding.employee` | Read-only: own onboarding case and checklist |

---

## ServiceNow ACL Creation Path

1. Navigate to: **System Security → Access Control (ACL)**
2. Click **New**
3. Set **Type**: `record` (table-level) or `field` (field-level)
4. Set **Operation**: `read`, `write`, `create`, or `delete`
5. Add roles under the **Requires role** related list
6. Add condition scripts in the **Condition** field

---

## Security Notes

- The `u_ad_username` field (populated after AD provisioning) is read-only for all roles except `hr_admin`. It is set programmatically by the REST integration Script Include only.
- Service Portal widget server scripts enforce their own GlideRecord queries filtered by `gs.getUserID()` — the ACLs serve as a defense-in-depth layer.
- Salary and bank fields are masked in list views via UI Policies in addition to ACLs.
