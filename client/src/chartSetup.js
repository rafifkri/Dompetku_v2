import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
Chart.defaults.font.family = 'Inter,system-ui,sans-serif';
export const themeCharts = () => {
  const cs = getComputedStyle(document.documentElement);
  Chart.defaults.color = cs.getPropertyValue('--mut').trim();
  Chart.defaults.borderColor = cs.getPropertyValue('--line').trim();
};
