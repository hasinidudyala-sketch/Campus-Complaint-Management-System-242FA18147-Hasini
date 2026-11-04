/**
 * CSV Exporter Utility
 * Exports database records to CSV format for Administrative reports
 */

const { Parser } = require('json2csv');

const exportComplaintsToCSV = (complaints) => {
  const fields = [
    { label: 'Complaint ID', value: 'complaintId' },
    { label: 'Title', value: 'title' },
    { label: 'Category', value: 'category' },
    { label: 'Department', value: (row) => (row.department ? row.department.name : 'N/A') },
    { label: 'Student Name', value: (row) => (row.student ? row.student.fullName : 'N/A') },
    { label: 'Registration No', value: (row) => (row.student ? row.student.regNo : 'N/A') },
    { label: 'Assigned Staff', value: (row) => (row.assignedStaff ? row.assignedStaff.fullName : 'Unassigned') },
    { label: 'Priority', value: 'priority' },
    { label: 'Status', value: 'status' },
    { label: 'Submission Date', value: (row) => new Date(row.createdAt).toLocaleString() },
    { label: 'Resolved Date', value: (row) => (row.resolvedDate ? new Date(row.resolvedDate).toLocaleString() : 'Pending') }
  ];

  const parser = new Parser({ fields });
  return parser.parse(complaints);
};

const exportFeedbackToCSV = (feedbacks) => {
  const fields = [
    { label: 'Complaint ID', value: (row) => (row.complaint ? row.complaint.complaintId : 'N/A') },
    { label: 'Complaint Title', value: (row) => (row.complaint ? row.complaint.title : 'N/A') },
    { label: 'Student Name', value: (row) => (row.student ? row.student.fullName : 'N/A') },
    { label: 'Registration No', value: (row) => (row.student ? row.student.regNo : 'N/A') },
    { label: 'Rating (out of 5)', value: 'rating' },
    { label: 'Feedback Comments', value: 'description' },
    { label: 'Date', value: (row) => new Date(row.createdAt).toLocaleString() }
  ];

  const parser = new Parser({ fields });
  return parser.parse(feedbacks);
};

module.exports = {
  exportComplaintsToCSV,
  exportFeedbackToCSV
};

