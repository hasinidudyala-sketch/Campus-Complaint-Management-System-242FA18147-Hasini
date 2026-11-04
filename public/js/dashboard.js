/**
 * CAMPUSCARE - Dashboard JavaScript
 * Charts rendering, dynamic filtering, and notification handlers
 */

// Initialize Charts when canvas elements are present
window.initDashboardCharts = (chartData) => {
  if (typeof Chart === 'undefined') return;

  // 1. Department Breakdown Bar Chart
  const deptCanvas = document.getElementById('deptChart');
  if (deptCanvas && chartData.departments) {
    const labels = chartData.departments.map(d => d.name || d.code || 'Unassigned');
    const totals = chartData.departments.map(d => d.count || 0);
    const resolved = chartData.departments.map(d => d.resolvedCount || 0);

    new Chart(deptCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Grievances',
            data: totals,
            backgroundColor: '#3b82f6',
            borderRadius: 6
          },
          {
            label: 'Resolved',
            data: resolved,
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  // 2. Status Breakdown Doughnut Chart
  const statusCanvas = document.getElementById('statusChart');
  if (statusCanvas && chartData.statuses) {
    const labels = chartData.statuses.map(s => s._id);
    const counts = chartData.statuses.map(s => s.count);

    const colors = {
      'SUBMITTED': '#94a3b8',
      'UNDER REVIEW': '#f59e0b',
      'ASSIGNED': '#0284c7',
      'IN PROGRESS': '#3b82f6',
      'RESOLVED': '#10b981',
      'CLOSED': '#475569',
      'REOPENED': '#ef4444'
    };

    const bgColors = labels.map(l => colors[l] || '#6366f1');

    new Chart(statusCanvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: counts,
            backgroundColor: bgColors,
            borderWidth: 2,
            borderColor: '#ffffff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        cutout: '65%'
      }
    });
  }
};

