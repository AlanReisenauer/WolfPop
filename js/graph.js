/**
 * graph.js
 * Renders population time series using Chart.js.
 * Handles both real NPS data overlay and live simulation output.
 */

export class PopulationGraph {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart  = null;

    this.colors = {
      realWolves:  'rgba(220, 120,  60, 1)',
      simWolves:   'rgba(220, 120,  60, 0.5)',
      realElk:     'rgba( 80, 160, 100, 1)',
      simElk:      'rgba( 80, 160, 100, 0.5)',
      realPacks:   'rgba(140, 180, 220, 1)',
    };
  }

  init(realWolfData, realElkData, simData) {
    const years = realWolfData.map(d => d.year);

    this.chart = new Chart(this.canvas, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Wolves (NPS)',
            data: realWolfData.map(d => d.wolves),
            borderColor: this.colors.realWolves,
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'yWolves',
            tension: 0.3,
          },
          {
            label: 'Wolves (Simulated)',
            data: simData.map(d => d.wolves),
            borderColor: this.colors.simWolves,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 0,
            yAxisID: 'yWolves',
            tension: 0.3,
          },
          {
            label: 'Elk — N. Yellowstone Herd (NPS)',
            data: realElkData.map(d => d.elk),
            borderColor: this.colors.realElk,
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'yElk',
            tension: 0.3,
          },
          {
            label: 'Elk (Simulated)',
            data: simData.map(d => d.elk),
            borderColor: this.colors.simElk,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 0,
            yAxisID: 'yElk',
            tension: 0.3,
          },
          {
            label: 'Packs (NPS)',
            data: realWolfData.map(d => d.packs),
            borderColor: this.colors.realPacks,
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [3, 3],
            pointRadius: 3,
            yAxisID: 'yWolves',
            tension: 0.3,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#c8c8c8',
              font: { family: "'IBM Plex Mono', monospace", size: 11 },
              boxWidth: 20,
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: 'rgba(12,18,24,0.95)',
            borderColor: '#334',
            borderWidth: 1,
            titleColor: '#e8e0d0',
            bodyColor: '#aaa',
            titleFont: { family: "'IBM Plex Mono', monospace", size: 12 },
            bodyFont:  { family: "'IBM Plex Mono', monospace", size: 11 },
          },
          // Vertical "current year" annotation — drawn manually via plugin below
        },
        scales: {
          x: {
            grid:  { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#888', font: { family: "'IBM Plex Mono', monospace", size: 11 } },
            border: { color: '#334' }
          },
          yWolves: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Wolves / Packs', color: '#888',
                     font: { family: "'IBM Plex Mono', monospace", size: 11 } },
            grid:  { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#888', font: { family: "'IBM Plex Mono', monospace", size: 11 } },
            border: { color: '#334' }
          },
          yElk: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Elk', color: '#888',
                     font: { family: "'IBM Plex Mono', monospace", size: 11 } },
            grid:  { drawOnChartArea: false },
            ticks: { color: '#888', font: { family: "'IBM Plex Mono', monospace", size: 11 } },
            border: { color: '#334' }
          }
        }
      },
      plugins: [{
        id: 'yearMarker',
        afterDraw: (chart) => {
          if (chart._currentYear == null) return;
          const idx = chart.data.labels.indexOf(chart._currentYear);
          if (idx < 0) return;
          const meta = chart.getDatasetMeta(0);
          if (!meta.data[idx]) return;
          const x   = meta.data[idx].x;
          const ctx = chart.ctx;
          const { top, bottom } = chart.chartArea;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, bottom);
          ctx.strokeStyle = 'rgba(255,240,180,0.5)';
          ctx.lineWidth   = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.restore();
        }
      }]
    });
  }

  setYear(year) {
    if (!this.chart) return;
    this.chart._currentYear = year;
    this.chart.update('none');
  }

  updateSimData(simData) {
    if (!this.chart) return;
    this.chart.data.datasets[1].data = simData.map(d => d.wolves);
    this.chart.data.datasets[3].data = simData.map(d => d.elk);
    this.chart.update();
  }
}
