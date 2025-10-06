import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  OwnerService,
  CottageMonthStatistics,
  CottageWeekendWeekdayStatistics,
} from '../services/owner.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-owner-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-statistics.component.html',
  styleUrls: ['./owner-statistics.component.css'],
})
export class OwnerStatisticsComponent implements OnInit {
  @ViewChild('barChartCanvas', { static: false })
  barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas', { static: false })
  pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  loading = true;
  error = '';
  selectedCottage: string = 'all';
  cottageNames: { id: string; name: string }[] = [];

  reservationsPerMonth: CottageMonthStatistics[] = [];
  weekendVsWeekday: CottageWeekendWeekdayStatistics[] = [];

  constructor(
    private ownerService: OwnerService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    this.ownerService.getStatistics(currentUser.id).subscribe({
      next: (data) => {
        this.reservationsPerMonth = data.reservationsPerMonth;
        this.weekendVsWeekday = data.weekendVsWeekday;

        // Extract unique cottage names
        this.cottageNames = data.reservationsPerMonth.map((c) => ({
          id: c.cottageId,
          name: c.cottageName,
        }));

        this.loading = false;

        // Draw charts after data is loaded
        setTimeout(() => {
          this.drawBarChart();
          this.drawPieChart();
        }, 100);
      },
      error: (err) => {
        this.error = 'Failed to load statistics';
        this.loading = false;
        console.error('Error loading statistics:', err);
      },
    });
  }

  onCottageChange(): void {
    this.drawBarChart();
    this.drawPieChart();
  }

  private drawBarChart(): void {
    if (!this.barChartCanvas) return;

    const canvas = this.barChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter data based on selected cottage
    let dataToShow =
      this.selectedCottage === 'all'
        ? this.reservationsPerMonth
        : this.reservationsPerMonth.filter(
            (c) => c.cottageId === this.selectedCottage
          );

    if (dataToShow.length === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Collect all unique months across all cottages
    const allMonths = new Set<string>();
    dataToShow.forEach((cottage) => {
      Object.keys(cottage.months).forEach((month) => allMonths.add(month));
    });
    const sortedMonths = Array.from(allMonths).sort();

    if (sortedMonths.length === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText(
        'No completed reservations yet',
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    // Chart dimensions
    const padding = { top: 40, right: 40, bottom: 80, left: 60 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;

    // Find max value for scaling
    let maxValue = 0;
    dataToShow.forEach((cottage) => {
      Object.values(cottage.months).forEach((count) => {
        if (count > maxValue) maxValue = count;
      });
    });

    // Calculate bar dimensions
    const numCottages = dataToShow.length;
    const numMonths = sortedMonths.length;
    const groupWidth = chartWidth / numMonths;
    const barWidth = groupWidth / (numCottages + 1);

    // Define colors for different cottages
    const colors = [
      '#4CAF50',
      '#2196F3',
      '#FF9800',
      '#E91E63',
      '#9C27B0',
      '#00BCD4',
      '#FF5722',
      '#8BC34A',
    ];

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, canvas.height - padding.bottom);
    ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
    ctx.stroke();

    // Draw bars
    sortedMonths.forEach((month, monthIndex) => {
      dataToShow.forEach((cottage, cottageIndex) => {
        const count = cottage.months[month] || 0;
        const barHeight = maxValue > 0 ? (count / maxValue) * chartHeight : 0;
        const x =
          padding.left + monthIndex * groupWidth + cottageIndex * barWidth;
        const y = canvas.height - padding.bottom - barHeight;

        ctx.fillStyle = colors[cottageIndex % colors.length];
        ctx.fillRect(x, y, barWidth * 0.9, barHeight);

        // Draw value on top of bar if not zero
        if (count > 0) {
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(count.toString(), x + barWidth * 0.45, y - 5);
        }
      });
    });

    // Draw Y-axis labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = Math.round((maxValue / ySteps) * i);
      const y = canvas.height - padding.bottom - (chartHeight / ySteps) * i;
      ctx.fillText(value.toString(), padding.left - 10, y + 5);

      // Draw grid line
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvas.width - padding.right, y);
      ctx.stroke();
    }

    // Draw X-axis labels (months)
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.save();
    sortedMonths.forEach((month, index) => {
      const x = padding.left + index * groupWidth + groupWidth / 2;
      const y = canvas.height - padding.bottom + 20;

      // Format month (YYYY-MM to MMM YYYY)
      const [year, monthNum] = month.split('-');
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const label = `${monthNames[parseInt(monthNum) - 1]} ${year}`;

      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(label, 0, 0);
      ctx.rotate(Math.PI / 4);
      ctx.translate(-x, -y);
    });
    ctx.restore();

    // Draw title
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333';
    ctx.fillText('Completed Reservations Per Month', canvas.width / 2, 20);

    // Draw legend
    const legendX = canvas.width - padding.right - 150;
    const legendY = padding.top;
    dataToShow.forEach((cottage, index) => {
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(legendX, legendY + index * 25, 15, 15);
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        cottage.cottageName,
        legendX + 20,
        legendY + index * 25 + 12
      );
    });
  }

  private drawPieChart(): void {
    if (!this.pieChartCanvas) return;

    const canvas = this.pieChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter data based on selected cottage
    let dataToShow =
      this.selectedCottage === 'all'
        ? this.weekendVsWeekday
        : this.weekendVsWeekday.filter(
            (c) => c.cottageId === this.selectedCottage
          );

    if (dataToShow.length === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Calculate totals
    let totalWeekendDays = 0;
    let totalWeekdayDays = 0;
    dataToShow.forEach((cottage) => {
      totalWeekendDays += cottage.weekendDays;
      totalWeekdayDays += cottage.weekdayDays;
    });

    const total = totalWeekendDays + totalWeekdayDays;

    if (total === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText(
        'No reservation data yet',
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    // Chart settings
    const centerX = canvas.width / 2;
    const centerY = (canvas.height - 60) / 2 + 30;
    const radius = Math.min(centerX, centerY) - 80;

    // Calculate angles
    const weekendAngle = (totalWeekendDays / total) * 2 * Math.PI;
    const weekdayAngle = (totalWeekdayDays / total) * 2 * Math.PI;

    // Draw weekend slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(
      centerX,
      centerY,
      radius,
      -Math.PI / 2,
      -Math.PI / 2 + weekendAngle
    );
    ctx.closePath();
    ctx.fillStyle = '#FF9800';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw weekday slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(
      centerX,
      centerY,
      radius,
      -Math.PI / 2 + weekendAngle,
      -Math.PI / 2 + weekendAngle + weekdayAngle
    );
    ctx.closePath();
    ctx.fillStyle = '#2196F3';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw percentages
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';

    // Weekend percentage
    const weekendPercent = ((totalWeekendDays / total) * 100).toFixed(1);
    const weekendLabelAngle = -Math.PI / 2 + weekendAngle / 2;
    const weekendLabelX =
      centerX + Math.cos(weekendLabelAngle) * (radius * 0.6);
    const weekendLabelY =
      centerY + Math.sin(weekendLabelAngle) * (radius * 0.6);
    ctx.fillText(`${weekendPercent}%`, weekendLabelX, weekendLabelY);

    // Weekday percentage
    const weekdayPercent = ((totalWeekdayDays / total) * 100).toFixed(1);
    const weekdayLabelAngle = -Math.PI / 2 + weekendAngle + weekdayAngle / 2;
    const weekdayLabelX =
      centerX + Math.cos(weekdayLabelAngle) * (radius * 0.6);
    const weekdayLabelY =
      centerY + Math.sin(weekdayLabelAngle) * (radius * 0.6);
    ctx.fillText(`${weekdayPercent}%`, weekdayLabelX, weekdayLabelY);

    // Draw title
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333';
    ctx.fillText('Weekend vs Weekday Reservations', canvas.width / 2, 20);

    // Draw legend
    const legendY = canvas.height - 40;

    // Weekend legend
    ctx.fillStyle = '#FF9800';
    ctx.fillRect(centerX - 150, legendY, 20, 20);
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Weekend: ${totalWeekendDays} days`,
      centerX - 125,
      legendY + 15
    );

    // Weekday legend
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(centerX + 20, legendY, 20, 20);
    ctx.fillStyle = '#333';
    ctx.fillText(
      `Weekday: ${totalWeekdayDays} days`,
      centerX + 45,
      legendY + 15
    );
  }
}
