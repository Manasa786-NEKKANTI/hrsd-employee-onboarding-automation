/**
 * Widget: Onboarding Checklist
 * ID: x_hrsd_onboarding_checklist
 *
 * Server Script — runs on ServiceNow server side
 * Fetches HR Tasks for the logged-in employee's active onboarding case.
 */

// ============================================================
// SERVER SCRIPT
// ============================================================
(function() {

    var currentUser = gs.getUserID();
    var now = new GlideDateTime();

    // Find the active onboarding HR Case for this employee
    var hrCase = new GlideRecord('sn_hr_core_case');
    hrCase.addQuery('opened_for', currentUser);
    hrCase.addQuery('hr_service', 'New Hire Onboarding');
    hrCase.addQuery('state', 'NOT IN', ['3', '4']); // Exclude closed cases
    hrCase.orderByDesc('opened_at');
    hrCase.setLimit(1);
    hrCase.query();

    data.tasks = [];
    data.caseNumber = '';
    data.completedCount = 0;
    data.completedPercent = 0;
    data.dashOffset = 188.5; // Full circle offset
    data.counts = { IT: 0, Facilities: 0, Payroll: 0 };

    if (hrCase.next()) {
        data.caseNumber = hrCase.getValue('number');

        // Fetch all tasks for this case
        var task = new GlideRecord('sn_hr_core_task');
        task.addQuery('parent', hrCase.getValue('sys_id'));
        task.orderBy('due_date');
        task.query();

        while (task.next()) {
            var dueDate = task.getValue('due_date');
            var isOverdue = dueDate && new GlideDateTime(dueDate).before(now);
            var dept = task.getValue('u_department_scope') || 'Other';

            var taskObj = {
                sys_id: task.getValue('sys_id'),
                short_description: task.getValue('short_description'),
                state: task.getDisplayValue('state'),
                priority: task.getValue('priority'),
                due_date: task.getValue('due_date'),
                u_department_scope: dept,
                assignment_group: {
                    display_value: task.getDisplayValue('assignment_group')
                },
                isOverdue: isOverdue
            };

            data.tasks.push(taskObj);

            // Count by department
            if (data.counts.hasOwnProperty(dept)) {
                data.counts[dept]++;
            }

            if (task.getDisplayValue('state') === 'Closed Complete') {
                data.completedCount++;
            }
        }

        // Calculate progress
        if (data.tasks.length > 0) {
            data.completedPercent = Math.round(
                (data.completedCount / data.tasks.length) * 100
            );
            // SVG circle: circumference = 2 * π * 30 ≈ 188.5
            data.dashOffset = 188.5 - (188.5 * data.completedPercent / 100);
        }
    }

})();


// ============================================================
// CLIENT SCRIPT
// ============================================================
api.controller = function($scope) {
    var c = this;

    c.data.activeFilter = 'all';
    c.data.filteredTasks = c.data.tasks;

    /**
     * Filter tasks by department tab.
     */
    c.setFilter = function(dept) {
        c.data.activeFilter = dept;
        if (dept === 'all') {
            c.data.filteredTasks = c.data.tasks;
        } else {
            c.data.filteredTasks = c.data.tasks.filter(function(t) {
                return t.u_department_scope === dept;
            });
        }
    };
};
