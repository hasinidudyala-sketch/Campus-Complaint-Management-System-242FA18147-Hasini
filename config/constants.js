/**
 * CAMPUSCARE - System Constants & Enums
 * VFSTR Hyderabad Campus Complaint Management System
 */

const ROLES = {
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN'
};

const COMPLAINT_STATUS = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER REVIEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED'
};

const COMPLAINT_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

const COMPLAINT_CATEGORIES = [
  'Academic',
  'Hostel & Accommodation',
  'Infrastructure & Maintenance',
  'Canteen & Food Services',
  'Transportation',
  'Library & Digital Resources',
  'Anti-Ragging & Discipline',
  'Accounts & Examination',
  'Sports & Gymnasium',
  'Medical & Healthcare',
  'Others'
];

const NOTIFICATION_TYPES = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ALERT: 'ALERT'
};

module.exports = {
  ROLES,
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  COMPLAINT_CATEGORIES,
  NOTIFICATION_TYPES
};

