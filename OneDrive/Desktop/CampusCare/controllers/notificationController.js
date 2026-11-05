/**
 * Notification Controller
 * Handles user notification actions (mark read, mark all read, delete)
 */

const Notification = require('../models/Notification');

// POST /notifications/:id/mark-read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (notification) {
      notification.isRead = true;
      await notification.save();
    }

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, message: 'Notification marked as read.' });
    }

    req.flash('success_msg', 'Notification marked as read.');
    res.redirect(req.get('Referrer') || '/');
  } catch (err) {
    console.error('Mark notification read error:', err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Server error' });
    req.flash('error_msg', 'Could not update notification.');
    res.redirect(req.get('Referrer') || '/');
  }
};

// POST /notifications/mark-all-read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }

    req.flash('success_msg', 'All notifications marked as read.');
    res.redirect(req.get('Referrer') || '/');
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Server error' });
    req.flash('error_msg', 'Could not update notifications.');
    res.redirect(req.get('Referrer') || '/');
  }
};

// POST /notifications/:id/delete
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, message: 'Notification deleted.' });
    }

    req.flash('success_msg', 'Notification deleted.');
    res.redirect(req.get('Referrer') || '/');
  } catch (err) {
    console.error('Delete notification error:', err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Server error' });
    req.flash('error_msg', 'Could not delete notification.');
    res.redirect(req.get('Referrer') || '/');
  }
};

module.exports = {
  markAsRead,
  markAllAsRead,
  deleteNotification
};
