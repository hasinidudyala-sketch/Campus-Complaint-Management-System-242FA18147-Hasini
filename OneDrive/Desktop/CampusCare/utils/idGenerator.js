/**
 * Complaint ID Generator Utility
 * Generates unique formatted Complaint IDs: CC-YYYY-XXXXX
 */

const Complaint = require('../models/Complaint');

const generateComplaintId = async () => {
  const year = new Date().getFullYear();
  const prefix = `CC-${year}-`;

  // Find the highest ID for the current year
  const latestComplaint = await Complaint.findOne({
    complaintId: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  let sequence = 1001;

  if (latestComplaint && latestComplaint.complaintId) {
    const parts = latestComplaint.complaintId.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
  }

  // Double check uniqueness
  let candidateId = `${prefix}${sequence}`;
  let exists = await Complaint.exists({ complaintId: candidateId });
  while (exists) {
    sequence += 1;
    candidateId = `${prefix}${sequence}`;
    exists = await Complaint.exists({ complaintId: candidateId });
  }

  return candidateId;
};

module.exports = { generateComplaintId };

