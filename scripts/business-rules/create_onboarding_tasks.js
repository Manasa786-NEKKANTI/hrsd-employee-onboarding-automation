/**
 * Business Rule: Create Onboarding Tasks
 * Table: sn_hr_core_case (HR Case)
 * When: After Insert
 * Condition: current.opened_for != null && current.subject_person != null
 *            && current.hr_service == 'New Hire Onboarding'
 *
 * Purpose: Automatically creates department-specific HR Tasks
 *          when a New Hire Onboarding HR Case is opened.
 */

(function executeRule(current, previous) {

    var onboardingUtils = new OnboardingUtils();

    // Define task templates per department
    var taskTemplates = [
        // IT Tasks
        {
            short_description: 'Provision Laptop & Hardware',
            assigned_group: 'IT Provisioning',
            department: 'IT',
            due_days: 3,
            priority: '2'
        },
        {
            short_description: 'Create Email Account & Active Directory Entry',
            assigned_group: 'IT Provisioning',
            department: 'IT',
            due_days: 1,
            priority: '1'
        },
        {
            short_description: 'Setup Software Licenses (Office, VPN, IDE)',
            assigned_group: 'IT Provisioning',
            department: 'IT',
            due_days: 5,
            priority: '2'
        },
        // Facilities Tasks
        {
            short_description: 'Assign Desk & Workspace',
            assigned_group: 'Facilities Management',
            department: 'Facilities',
            due_days: 2,
            priority: '2'
        },
        {
            short_description: 'Issue Access Badge & Parking Pass',
            assigned_group: 'Facilities Management',
            department: 'Facilities',
            due_days: 1,
            priority: '1'
        },
        // Payroll Tasks
        {
            short_description: 'Collect Bank Account Details for Payroll Setup',
            assigned_group: 'Payroll Operations',
            department: 'Payroll',
            due_days: 7,
            priority: '2'
        },
        {
            short_description: 'Register Employee in Payroll System',
            assigned_group: 'Payroll Operations',
            department: 'Payroll',
            due_days: 7,
            priority: '2'
        }
    ];

    // Create each task linked to this HR Case
    taskTemplates.forEach(function(template) {
        onboardingUtils.createHRTask({
            parent_case: current.sys_id,
            short_description: template.short_description,
            assigned_to_group: template.assigned_group,
            due_date: onboardingUtils.getBusinessDayOffset(
                current.opened_at,
                template.due_days
            ),
            priority: template.priority,
            state: '1', // Open
            u_department_scope: template.department
        });
    });

    gs.info('HRSD Onboarding: Created ' + taskTemplates.length +
            ' tasks for case ' + current.number);

})(current, previous);
