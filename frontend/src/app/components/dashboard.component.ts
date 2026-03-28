import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h3>Overview</h3>
      <div *ngIf="isLoading" style="color:#7f8c8d; margin-bottom:10px;">Loading data...</div>
      <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      
      <div class="stats" *ngIf="!isLoading && !errorMessage">
        <div class="stat-card">
          <div class="icon">🏷️</div>
          <div class="details">
            <div class="value">{{ productsCount }}</div>
            <div class="label">Products</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon">🏢</div>
          <div class="details">
            <div class="value">{{ warehousesCount }}</div>
            <div class="label">Warehouses</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon">🛒</div>
          <div class="details">
            <div class="value">{{ ordersCount }}</div>
            <div class="label">Orders</div>
          </div>
        </div>
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
  productsCount = 0;
  warehousesCount = 0;
  ordersCount = 0;
  isLoading = true;
  errorMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    let completed = 0;
    const isDone = () => { completed++; if (completed === 3) this.isLoading = false; };
    const onErr = () => { this.errorMessage = 'Failed to load dashboard data.'; this.isLoading = false; };

    this.api.getProducts().subscribe({ next: r => { this.productsCount = r.length; isDone(); }, error: onErr });
    this.api.getWarehouses().subscribe({ next: r => { this.warehousesCount = r.length; isDone(); }, error: onErr });
    this.api.getOrders().subscribe({ next: r => { this.ordersCount = r.length; isDone(); }, error: onErr });
  }
}
