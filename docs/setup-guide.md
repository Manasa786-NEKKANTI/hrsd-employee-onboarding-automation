# Setup Guide — HRSD Employee Onboarding App

## Prerequisites

1. **ServiceNow Personal Developer Instance (PDI)**
   - Request at: https://developer.servicenow.com → Start Building
   - Recommended release: Washington DC or Xanadu
   - Free for individual developers

2. **Required Plugins** (activate in PDI via System Definition → Plugins):
   - `com.sn_hr_core` — HR Service Delivery Core
   - `com.sn_hr_lifecycle_events` — HR Lifecycle Events
   - `com.glide.service-portal` — Service Portal
   - `com.snc.process_flow` — Flow Designer

3. **GitHub Account** — for source control integration

---

## Method 1: Import via Update Set (Quickest)

1. In your PDI, go to **System Update Sets → Retrieved Update Sets**
2. Click **Import Update Set from XML**
3. Upload: `update-sets/hrsd_onboarding_v1.xml`
4. Open the imported Update Set → Click **Preview Update Set**
5. Resolve any conflicts (there should be none on a fresh PDI)
6. Click **Commit Update Set**
7. Verify: Navigate to **Studio** → you should see `HRSD Employee Onboarding` app

---

## Method 2: Studio Source Control (Recommended for Development)

### Link your PDI to this GitHub repo:

1. Open **Studio** (type "studio" in the nav bar)
2. Click **Import from Source Control**
3. Enter:
   - URL: `https://github.com/YOUR_USERNAME/hrsd-onboarding`
   - Branch: `main`
   - Credential: add your GitHub Personal Access Token
4. Studio imports all app files automatically

### Push your changes back to GitHub:

1. In Studio → **Source Control → Commit Changes**
2. Enter a commit message
3. Click **Commit** — changes push to your GitHub branch

---

## Post-Install Configuration

### Step 1: Verify Application Scope
- In Studio, confirm app scope is `x_hrsd_onboarding`
- All tables, scripts, and flows should be under this scope

### Step 2: Create User Groups
Navigate to **User Administration → Groups** and create:
- `IT Provisioning`
- `Facilities Management`
- `Payroll Operations`
- `HR Business Partners`

### Step 3: Assign Roles to Groups
Navigate to each group → Roles tab → Add:
- IT Provisioning → `x_hrsd_onboarding.it_agent`
- Facilities Management → `x_hrsd_onboarding.facilities_agent`
- Payroll Operations → `x_hrsd_onboarding.payroll_agent`
- HR Business Partners → `x_hrsd_onboarding.hr_agent`

### Step 4: Configure REST Credential
1. Go to **Connections & Credentials → Credentials**
2. Create new **Basic Auth Credential**:
   - Name: `MockADCredential`
   - Alias: `x_hrsd_onboarding.MockADCredential`
   - Username: `api_user`
   - Password: `api_password`
3. For testing, the mock AD endpoint can be simulated using a **Mock Server** or **RequestBin**

### Step 5: Activate the Flow
1. Go to **Process Automation → Flow Designer**
2. Find `Onboarding Orchestration Flow`
3. Click **Activate**

### Step 6: Configure Service Portal
1. Go to **Service Portal → Portals**
2. Find or create portal with URL suffix: `onboarding`
3. Add the three custom widgets to the onboarding pages:
   - `x_hrsd_onboarding_checklist`
   - `x_hrsd_onboarding_doc_upload`
   - `x_hrsd_onboarding_case_status`

---

## Testing

### Create a Test Onboarding Case

1. Navigate to **HRSD → HR Cases → Create New**
2. Select HR Service: `New Hire Onboarding`
3. Set **Opened For** to a test user
4. Fill in start date, department, hiring manager
5. Submit

**Expected behavior:**
- ✅ HR Tasks auto-created for IT, Facilities, Payroll
- ✅ Flow Designer flow triggered
- ✅ Welcome email sent to employee
- ✅ Service Portal checklist populated

### Verify AD Provisioning

1. Change HR Case state to `Accepted`
2. Check **Work Notes** for AD provisioning log message
3. Verify `u_ad_username` and `u_ad_provisioned` fields populated

### Verify ACLs

1. Log in as a test user with `it_agent` role
2. Open the HR Case
3. Confirm you **cannot** see `u_salary`, `u_bank_account`, `u_tax_id` fields

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Tasks not created on case insert | Check Business Rule is Active and condition matches `hr_service = 'New Hire Onboarding'` |
| Flow not triggering | Verify Flow is Activated and trigger table/condition is correct |
| AD REST call failing | Check REST Message endpoint URL and credential alias |
| Widget showing empty | Ensure logged-in user has an active onboarding HR Case with `opened_for = current user` |
| ACLs not restricting fields | Confirm ACL is Active and roles are correctly assigned |
