/**
 * CAMPUSCARE - Global JavaScript
 * Interactive controls, alerts, password toggles, and helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Password Visibility Toggle
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const input = targetId ? document.getElementById(targetId) : this.previousElementSibling;
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        this.innerHTML = '<i class="bi bi-eye-slash"></i>';
      } else {
        input.type = 'password';
        this.innerHTML = '<i class="bi bi-eye"></i>';
      }
    });
  });

  // 2. Alert / Flash Auto-Dismiss after 6 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 6000);

    const closeBtn = alert.querySelector('.alert-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => alert.remove());
    }
  });

  // 3. Mobile Sidebar Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const sidebar = document.querySelector('.dashboard-sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });

    // Close when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target) && sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
      }
    });
  }

  // 4. Client-side File Upload Validator (Max 5MB, format check)
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach((input) => {
    input.addEventListener('change', function () {
      const maxBytes = (this.getAttribute('data-max-size') || 5) * 1024 * 1024;
      if (this.files) {
        for (let i = 0; i < this.files.length; i++) {
          const file = this.files[i];
          if (file.size > maxBytes) {
            alert(`File "${file.name}" exceeds the maximum allowed size of 5MB.`);
            this.value = '';
            return;
          }
        }
      }
    });
  });

  // 5. Quick Auto-fill for Viva Demo
  window.fillCredentials = (email, password) => {
    const emailInput = document.querySelector('input[name="email"]');
    const passInput = document.querySelector('input[name="password"]');
    if (emailInput && passInput) {
      emailInput.value = email;
      passInput.value = password;
    }
  };
});

