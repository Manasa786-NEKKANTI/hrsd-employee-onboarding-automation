# Flow Designer — Onboarding Orchestration Flow

## Flow Overview

| Property | Value |
|---|---|
| **Name** | Onboarding Orchestration Flow |
| **Application** | x_hrsd_onboarding |
| **Trigger** | Record Created — `sn_hr_core_case` |
| **Trigger Condition** | `hr_service` is `New Hire Onboarding` |
| **Run As** | System User |
| **Active** | true |

---

## COE Routing Rules

Centre of Excellence (COE) routing determines which HR team handles the case:

| COE Name | Condition | Assigned Team |
|---|---|---|
| IT Onboarding COE | Department = Engineering, Product, Data | IT Provisioning (Hyderabad) |
| Facilities COE | All new hires | Facilities Management |
| Payroll COE | All new hires | Payroll Operations |
| Executive HR COE | Band Level >= L7 | Executive HR Business Partner |

*Configure in: HR Administration → COE Configuration → Onboarding COE Rules*

---

## Flow Stages & Actions

```
TRIGGER: HR Case Created (hr_service = "New Hire Onboarding")
│
├─ [Action] Set Case Variables
│   • Set u_flow_started = NOW
│   • Set state = "In Progress"
│
├─ [Action] Send Welcome Email to Employee
│   • Template: x_hrsd_onboarding.welcome_email
│   • To: opened_for.email
│
├─ [PARALLEL BRANCH] ─────────────────────────────────────────┐
│                                                              │
│  Branch A: IT Tasks                                          │
│  ├─ [Action] Create Task: Provision Laptop                   │
│  ├─ [Action] Create Task: Create AD Account                  │
│  └─ [Action] Create Task: Setup Software Licenses            │
│                                                              │
│  Branch B: Facilities Tasks                                  │
│  ├─ [Action] Create Task: Assign Desk                        │
│  └─ [Action] Create Task: Issue Badge & Parking              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
[Wait Condition] SLA Milestone: Stage 1
• Wait until: All IT + Facilities tasks in state = "Closed Complete"
• Timeout: 5 business days
• On Timeout: Escalate to HR Manager via email + create Incident

        │
        ▼
[Action] Trigger AD Provisioning (REST)
• Subflow: x_hrsd_onboarding.AD_Provisioning_Subflow
• Input: case sys_id
• Output: ad_username, success_flag

        │
        ├─ [IF] AD Provisioning Successful
        │   └─ [Action] Update case: u_ad_provisioned = true, u_ad_username = {output}
        │
        └─ [IF] AD Provisioning Failed
            └─ [Action] Create Incident for IT
                └─ [Action] Send failure alert to HR Manager

        │
        ▼
[Action] Create Payroll Tasks
• Create Task: Collect Bank Details
• Create Task: Register in Payroll System

        │
        ▼
[Wait Condition] SLA Milestone: Stage 2
• Wait until: All Payroll tasks = "Closed Complete"
• Timeout: 10 business days
• On Timeout: Escalate to Payroll Manager

        │
        ▼
[Action] Update HR Case
• State = "Closed Complete"
• u_onboarding_completed_on = NOW

        │
        ▼
[Action] Trigger Lifecycle Event
• Event: "Onboarding Complete"
• Updates employee profile with onboarding completion date

        │
        ▼
[Action] Send Completion Notification
• To: Employee + Manager
• Template: x_hrsd_onboarding.completion_email
```

---

## SLA Definitions

### Stage 1 SLA — IT & Facilities Setup

| Property | Value |
|---|---|
| **Name** | Onboarding Stage 1 SLA |
| **Table** | `sn_hr_core_case` |
| **Start Condition** | Case state = "In Progress" AND hr_service = "New Hire Onboarding" |
| **Stop Condition** | All Stage 1 tasks closed |
| **Duration** | 5 business days |
| **Pause Conditions** | Case state = "On Hold" |
| **Breach Actions** | Email HR Manager, set priority to High |

### Stage 2 SLA — Payroll Setup

| Property | Value |
|---|---|
| **Name** | Onboarding Stage 2 SLA |
| **Table** | `sn_hr_core_case` |
| **Start Condition** | AD provisioning flag = true |
| **Stop Condition** | All Payroll tasks closed |
| **Duration** | 10 business days |
| **Breach Actions** | Email Payroll Manager, create alert task for HR |

---

## Subflow: AD Provisioning

| Property | Value |
|---|---|
| **Name** | AD_Provisioning_Subflow |
| **Inputs** | `case_sys_id` (String) |
| **Outputs** | `ad_username` (String), `success` (Boolean) |

**Steps:**
1. Look Up HR Case record by `case_sys_id`
2. Call Script Include `OnboardingUtils.triggerADProvisioning(hrCase)`
3. Set output variables from return value
4. Return to parent flow

---

## Flow Designer Setup Steps (in ServiceNow)

1. Navigate to **Process Automation → Flow Designer**
2. Click **New → Flow**
3. Name: `Onboarding Orchestration Flow`, Scope: `x_hrsd_onboarding`
4. Add Trigger: **Record → Created**, Table: `sn_hr_core_case`
5. Add Trigger Filter: `hr_service is New Hire Onboarding`
6. Build each action block per the spec above
7. For parallel branches: use the **Parallel Flow Logic** block
8. For wait conditions: use **Wait for Condition** block
9. Activate flow and test with a test HR Case record
