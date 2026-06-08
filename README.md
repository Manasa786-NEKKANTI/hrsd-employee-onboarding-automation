# HRSD Employee Onboarding Automation

## Overview

A custom ServiceNow HRSD application designed and developed to automate employee onboarding processes using Flow Designer, custom tables, automated task creation, progress tracking, reporting dashboards, and role-based access control.

## Project Features

- Employee onboarding request management
- Automated provisioning log creation
- Department-specific task generation
- Progress tracking automation
- Completion percentage updates
- Reporting and analytics dashboards
- Role-based access design
- REST API integration architecture

---

## Application Architecture

Employee Onboarding Request
↓
Employee Onboarding Master Flow
↓
Provisioning Logs
↓
Department Tasks
↓
Department Task Progress Tracker
↓
Completion Percentage Update

---

## Custom Tables

### Employee Onboarding Request

Stores employee onboarding information including:

- Employee Name
- Employee ID
- Department
- Manager
- Job Title
- Employee Type
- Location
- Status
- Completion Percentage

### Provisioning Log

Tracks onboarding activities:

- Active Directory Account Creation
- Payroll Setup
- Workspace Preparation
- Laptop Allocation

### Department Task

Tracks departmental onboarding tasks:

- IT
- Payroll
- Facilities

---

## Flow Designer Automations

### Employee Onboarding Master Flow

Automatically:

- Creates provisioning log records
- Creates department task records
- Updates onboarding request status
- Initiates onboarding workflow

### Department Task Progress Tracker

Automatically:

- Monitors completed department tasks
- Updates onboarding progress
- Updates onboarding request status

---

## Reports

### Onboarding Requests by Department

Tracks onboarding requests across departments.

### Requests by Status

Displays request status distribution.

### Department Task Distribution

Shows departmental task workload.

---

## Roles

Custom roles created:

- HRSD HR
- HRSD IT
- HRSD Payroll
- HRSD Facilities

---

## Technologies Used

- ServiceNow Studio
- Flow Designer
- Custom Tables
- Reporting & Dashboards
- ACL Security
- REST API Integration

---

## Screenshots

Screenshots will be added in the `/screenshots` folder.

- Employee Onboarding Request
- Provisioning Logs
- Department Tasks
- Employee Onboarding Master Flow
- Department Task Progress Tracker
- Reports Dashboard

---

## Future Enhancements

- Manager Approval Workflow
- Email Notifications
- Scripted REST APIs
- Employee Self-Service Portal
- Advanced Dashboard Analytics

---

## Author

Developed by Manasa Lakshmi Nekkanti

ServiceNow HRSD Employee Onboarding Automation Project
