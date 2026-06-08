/**
 * Script Include: OnboardingUtils
 * Access: This application and descendants
 * Active: true
 *
 * Utility class for HRSD Onboarding scoped application.
 * Provides reusable methods for task creation, date calculation,
 * notifications, and REST integration helpers.
 */

var OnboardingUtils = Class.create();

OnboardingUtils.prototype = {

    initialize: function() {
        this.appScope = 'x_hrsd_onboarding';
        this.taskTable = 'sn_hr_core_task';
        this.caseTable = 'sn_hr_core_case';
    },

    /**
     * Creates a new HR Task linked to an onboarding case.
     * @param {Object} taskData - Task fields
     * @returns {string} sys_id of created task
     */
    createHRTask: function(taskData) {
        var task = new GlideRecord(this.taskTable);
        task.initialize();
        task.setValue('parent', taskData.parent_case);
        task.setValue('short_description', taskData.short_description);
        task.setValue('assignment_group',
            this._getGroupId(taskData.assigned_to_group));
        task.setValue('due_date', taskData.due_date);
        task.setValue('priority', taskData.priority || '3');
        task.setValue('state', taskData.state || '1');
        task.setValue('u_department_scope', taskData.u_department_scope);

        var sysId = task.insert();
        gs.info('OnboardingUtils: Created HR Task - ' +
                taskData.short_description + ' [' + sysId + ']');
        return sysId;
    },

    /**
     * Calculates a due date offset by N business days from a given date.
     * @param {GlideDateTime} startDate
     * @param {number} businessDays
     * @returns {GlideDateTime}
     */
    getBusinessDayOffset: function(startDate, businessDays) {
        var gdt = new GlideDateTime(startDate);
        var added = 0;
        while (added < businessDays) {
            gdt.addDaysLocalTime(1);
            var dayOfWeek = gdt.getDayOfWeekLocalTime();
            // Skip Saturday (7) and Sunday (1)
            if (dayOfWeek !== 1 && dayOfWeek !== 7) {
                added++;
            }
        }
        return gdt;
    },

    /**
     * Sends an email notification to the new hire's manager.
     * @param {string} caseId - HR Case sys_id
     * @param {string} eventName - notification event name
     */
    notifyManager: function(caseId, eventName) {
        var hrCase = new GlideRecord(this.caseTable);
        if (hrCase.get(caseId)) {
            gs.eventQueue(
                this.appScope + '.' + eventName,
                hrCase,
                hrCase.getValue('u_hiring_manager'),
                hrCase.getValue('number')
            );
        }
    },

    /**
     * Checks if all HR Tasks for a given case are in 'Closed' state.
     * @param {string} caseId - HR Case sys_id
     * @returns {boolean}
     */
    allTasksComplete: function(caseId) {
        var openTask = new GlideRecord(this.taskTable);
        openTask.addQuery('parent', caseId);
        openTask.addQuery('state', 'NOT IN', ['3', '4']); // Not Closed Complete / Closed Incomplete
        openTask.setLimit(1);
        openTask.query();
        return !openTask.next();
    },

    /**
     * Triggers Active Directory provisioning via REST.
     * @param {GlideRecord} hrCase - HR Case record
     * @returns {Object} {success: boolean, message: string}
     */
    triggerADProvisioning: function(hrCase) {
        try {
            var rm = new sn_ws.RESTMessageV2(
                'x_hrsd_onboarding.MockActiveDirectoryAPI',
                'ProvisionUser'
            );

            // Map HR Case fields to AD payload
            var employee = hrCase.getElement('opened_for');
            rm.setStringParameterNoEscape('employee_id',
                hrCase.getValue('u_employee_id'));
            rm.setStringParameterNoEscape('first_name',
                employee.getValue('first_name'));
            rm.setStringParameterNoEscape('last_name',
                employee.getValue('last_name'));
            rm.setStringParameterNoEscape('department',
                hrCase.getValue('u_department'));
            rm.setStringParameterNoEscape('start_date',
                hrCase.getValue('u_start_date'));
            rm.setStringParameterNoEscape('manager_email',
                hrCase.getElement('u_hiring_manager').getValue('email'));

            var response = rm.execute();
            var statusCode = response.getStatusCode();
            var body = JSON.parse(response.getBody());

            if (statusCode === 200 || statusCode === 201) {
                gs.info('OnboardingUtils: AD provisioning SUCCESS for ' +
                        hrCase.getValue('number'));
                return { success: true, ad_username: body.username };
            } else {
                gs.error('OnboardingUtils: AD provisioning FAILED - ' +
                         body.message);
                return { success: false, message: body.message };
            }

        } catch (ex) {
            gs.error('OnboardingUtils: AD provisioning EXCEPTION - ' + ex.message);
            return { success: false, message: ex.message };
        }
    },

    /**
     * Helper: Resolve group name to sys_id.
     * @param {string} groupName
     * @returns {string} sys_id
     */
    _getGroupId: function(groupName) {
        var gr = new GlideRecord('sys_user_group');
        gr.addQuery('name', groupName);
        gr.setLimit(1);
        gr.query();
        if (gr.next()) {
            return gr.getValue('sys_id');
        }
        gs.warn('OnboardingUtils: Group not found - ' + groupName);
        return '';
    },

    type: 'OnboardingUtils'
};
