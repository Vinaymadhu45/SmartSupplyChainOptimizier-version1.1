import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h3 style="margin-bottom:0;">Platform Overview</h3>
      <div *ngIf="errorMessage" class="alert alert-danger" style="margin-top:10px;">{{ errorMessage }}</div>
      
      <div class="stats" *ngIf="!isLoading && analytics">
        <div class="stat-card">
          <div class="icon">🏷️</div>
          <div class="details">
            <div class="value">{{ analytics.totalProducts || 0 }}</div>
            <div class="label">Products</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon">🛒</div>
          <div class="details">
            <div class="value">{{ analytics.totalOrders || 0 }}</div>
            <div class="label">Total Orders</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon">🏆</div>
          <div class="details">
            <div class="value" style="font-size:1.8rem;">{{ analytics.topProduct || 'N/A' }}</div>
            <div class="label">Top Product</div>
          </div>
        </div>
        <div class="stat-card" style="border-left: 4px solid #2ecc71;">
          <div class="icon">💰</div>
          <div class="details">
            <div class="value">\${{ (analytics.totalRevenue || 0) | number:'1.2-2' }}</div>
            <div class="label">Total Revenue</div>
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex; gap:20px; margin-top: 20px;">
      <div class="card" style="flex:1;">
        <h3>Orders per Product</h3>
        <div *ngIf="isLoading" style="color:#7f8c8d; margin-bottom:10px;">Loading data...</div>
        <canvas #barChartCanvas style="max-height: 250px;"></canvas>
      </div>
      <div class="card" style="flex:1;">
        <h3>Global Demand Trend</h3>
        <div *ngIf="isLoading" style="color:#7f8c8d; margin-bottom:10px;">Loading data...</div>
        <canvas #lineChartCanvas style="max-height: 250px;"></canvas>
        <p *ngIf="forecastData" style="text-align:center; font-weight:bold; color:#34495e; margin-top:15px;">
           Trend Analysis: <span [ngStyle]="{'color': getTrendColor()}">{{ forecastData.trend | uppercase }}</span>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .stats { display: flex; gap: 20px; margin-top: 15px; }
    .stat-card { flex: 1; display: flex; align-items: center; padding: 25px; background: #fff; border: 1px solid #e1e8ed; border-radius: 8px; box-shadow: none; }
    .icon { font-size: 3rem; margin-right: 20px; }
    .value { font-size: 2.5rem; font-weight: bold; color: #2c3e50; line-height: 1; }
    .label { color: #7f8c8d; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
  `]
})
export class DashboardComponent implements OnInit {
  analytics: any = null;
  forecastData: any = null;
  products: any[] = [];
  orders: any[] = [];
  isLoading = true;
  errorMessage = '';
  
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef;
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef;
  barChartInstance: any;
  lineChartInstance: any;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.isLoading = true;
    let completed = 0;
    
    const checkDone = () => {
       completed++;
       if (completed === 4) {
          this.isLoading = false;
          setTimeout(() => { this.drawBarChart(); this.drawLineChart(); }, 150);
       }
    };

    const onError = (err: any) => {
       console.log('API Error:', err);
       this.errorMessage = 'Failed to load dashboard data.';
       this.isLoading = false;
    };

    this.api.getAnalytics().subscribe({ next: r => { this.analytics = r; checkDone(); }, error: onError });
    this.api.getProducts().subscribe({ next: r => { this.products = (r && r.length > 0) ? r : []; checkDone(); }, error: onError });
    this.api.getOrders().subscribe({ next: r => { this.orders = (r && r.length > 0) ? r : []; checkDone(); }, error: onError });
    this.api.getForecast().subscribe({ next: r => { this.forecastData = r; checkDone(); }, error: onError });
  }

  getTrendColor() {
      if(!this.forecastData) return '#7f8c8d';
      if(this.forecastData.trend === 'increasing') return '#27ae60';
      if(this.forecastData.trend === 'decreasing') return '#e74c3c';
      return '#f39c12';
  }

  drawBarChart() {
    if (!this.barChartCanvas || !this.products || this.products.length === 0) return;
    if (this.barChartInstance) this.barChartInstance.destroy();

    const labels = [];
    const dataPoints = [];

    for (const p of this.products) {
       labels.push(p.name);
       const orderCount = this.orders.filter(o => o.productId === p.id).length;
       dataPoints.push(orderCount);
    }

    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    this.barChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Orders Count',
          data: dataPoints,
          backgroundColor: '#3498db'
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  drawLineChart() {
    if (!this.lineChartCanvas || !this.forecastData) return;
    if (this.lineChartInstance) this.lineChartInstance.destroy();

    let historic = this.forecastData.forecast;
    let current = this.forecastData.forecast;
    if(this.forecastData.trend === 'increasing') historic = current * 0.8;
    if(this.forecastData.trend === 'decreasing') historic = current * 1.2;

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    this.lineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Previous', 'Current', 'Forecasted'],
        datasets: [{
          label: 'Demand',
          data: [historic, current, current * (this.forecastData.trend === 'increasing' ? 1.1 : this.forecastData.trend === 'decreasing' ? 0.9 : 1.0)],
          borderColor: '#9b59b6',
          backgroundColor: 'rgba(155, 89, 182, 0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }
}
