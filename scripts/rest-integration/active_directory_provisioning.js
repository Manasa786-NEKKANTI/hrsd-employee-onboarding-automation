/**
 * REST Integration: Mock Active Directory Provisioning
 *
 * ServiceNow Configuration Path:
 *   System Web Services → Outbound → REST Message
 *   Name: MockActiveDirectoryAPI
 *   Endpoint: https://mock-ad.example.com/api/v1
 *
 * HTTP Method Record: ProvisionUser
 *   Method: POST
 *   Endpoint Override: ${endpoint}/provision-user
 *
 * This file documents the REST Message configuration
 * and provides the Script Include call pattern.
 *
 * ----------------------------------------------------------
 * REST Message Configuration (set in ServiceNow UI)
 * ----------------------------------------------------------
 *
 * Name:             MockActiveDirectoryAPI
 * Base Endpoint:    https://mock-ad.example.com/api/v1
 * Authentication:   Basic Auth (stored in Credential Store)
 *                   Credential Alias: x_hrsd_onboarding.MockADCredential
 *
 * HTTP Headers (Default):
 *   Content-Type:   application/json
 *   Accept:         application/json
 *
 * ----------------------------------------------------------
 * HTTP Method: ProvisionUser
 * ----------------------------------------------------------
 *
 * Method:     POST
 * Endpoint:   ${endpoint}/provision-user
 *
 * Request Body Template:
 * {
 *   "employee_id":  "${employee_id}",
 *   "first_name":   "${first_name}",
 *   "last_name":    "${last_name}",
 *   "department":   "${department}",
 *   "start_date":   "${start_date}",
 *   "manager_email":"${manager_email}"
 * }
 *
 * Expected Response (200 OK):
 * {
 *   "status":   "success",
 *   "username": "f.lastname",
 *   "email":    "f.lastname@company.com",
 *   "ad_guid":  "a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 * }
 *
 * Expected Response (400/500):
 * {
 *   "status":  "error",
 *   "message": "Employee already exists in Active Directory"
 * }
 *
 * ----------------------------------------------------------
 * Usage: Called from OnboardingUtils.triggerADProvisioning()
 * ----------------------------------------------------------
 */

/**
 * Standalone invocation example (for testing in Scripts - Background):
 *
 * var utils = new OnboardingUtils();
 * var hrCase = new GlideRecord('sn_hr_core_case');
 * hrCase.get('YOUR_CASE_SYS_ID_HERE');
 * var result = utils.triggerADProvisioning(hrCase);
 * gs.info(JSON.stringify(result));
 */


/**
 * Business Rule: Trigger AD Provisioning on HR Case Approval
 * Table: sn_hr_core_case
 * When: After Update
 * Condition: current.state == '3' && previous.state != '3'
 *            (State changed TO Accepted/Approved)
 */
(function executeRule(current, previous) {

    // Only trigger for New Hire Onboarding cases
    if (current.getValue('hr_service') !== 'New Hire Onboarding') {
        return;
    }

    var utils = new OnboardingUtils();
    var result = utils.triggerADProvisioning(current);

    if (result.success) {
        // Store the provisioned AD username back on the case
        current.setValue('u_ad_username', result.ad_username);
        current.setValue('u_ad_provisioned', true);
        current.setValue('u_ad_provisioned_on', new GlideDateTime());
        current.update();

        gs.info('AD Provisioning complete for case: ' + current.getValue('number') +
                ' | Username: ' + result.ad_username);
    } else {
        // Log failure — create a Problem record for IT to investigate
        var problem = new GlideRecord('problem');
        problem.initialize();
        problem.setValue('short_description',
            'AD Provisioning Failed for Onboarding Case ' + current.getValue('number'));
        problem.setValue('description', result.message);
        problem.setValue('urgency', '2');
        problem.setValue('assignment_group',
            gs.getProperty('x_hrsd_onboarding.it_provisioning_group'));
        problem.insert();

        gs.error('AD Provisioning FAILED for case: ' + current.getValue('number') +
                 ' | Error: ' + result.message);
    }

})(current, previous);
