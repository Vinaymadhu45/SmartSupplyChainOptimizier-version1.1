import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-optimization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ─── Route Optimization ─────────────────────────────────────────────── -->
    <div class="card" style="margin-bottom:20px;">
      <h3 style="margin-bottom:5px;">🧭 Route Optimization Engine</h3>
      <p style="color:#7f8c8d; font-size:0.85rem; margin-bottom:20px;">
        Select an order and two hubs, then calculate the Dijkstra shortest path
      </p>

      <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

      <!-- ── Step 1: Pick an Order (optional) ── -->
      <div style="margin-bottom:20px;">
        <label style="font-size:0.8rem; color:#555; display:block; margin-bottom:4px; font-weight:600;">
          📦 ORDER (optional — filter by order context)
        </label>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <select id="route-order"
                  class="form-control"
                  [(ngModel)]="selectedOrderId"
                  (ngModelChange)="onOrderSelected($event)"
                  style="width:320px;">
            <option [ngValue]="null">— No order selected (free route) —</option>
            <option *ngFor="let o of orders; trackBy: trackById" [ngValue]="o.id">
              #{{ o.id }} · {{ o.customerName }}
              <ng-container *ngIf="getProductName(o.productId) as pName">
                · {{ pName }}
              </ng-container>
              · Qty {{ o.quantity }} · {{ o.status }}
            </option>
          </select>

          <!-- Order badge shown when selected -->
          <ng-container *ngIf="selectedOrder">
            <span style="background:#eaf4fd; border:1px solid #aed6f1; border-radius:6px;
                         padding:6px 14px; font-size:0.82rem; color:#2471a3;">
              Customer: <strong>{{ selectedOrder.customerName }}</strong> &nbsp;|&nbsp;
              Product: <strong>{{ getProductName(selectedOrder.productId) }}</strong> &nbsp;|&nbsp;
              Assigned Hub:
              <strong>{{ selectedOrder.assignedHubId ? getHubName(selectedOrder.assignedHubId) : 'None' }}</strong>
            </span>
          </ng-container>
        </div>
      </div>

      <!-- ── Step 2: Pick FROM → TO hubs ── -->
      <div style="display:flex; gap:15px; align-items:flex-end; flex-wrap:wrap; margin-bottom:20px;">
        <div>
          <label style="font-size:0.8rem; color:#555; display:block; margin-bottom:4px; font-weight:600;">FROM Hub</label>
          <select id="route-start" class="form-control" [(ngModel)]="selectedStartId" style="width:220px;">
            <option [ngValue]="null" disabled>Select Start Hub</option>
            <option *ngFor="let w of warehouses; trackBy: trackById" [ngValue]="w.id">
              {{ w.name }}
            </option>
          </select>
        </div>

        <div style="font-size:1.5rem; color:#bdc3c7; padding-bottom:2px;">→</div>

        <div>
          <label style="font-size:0.8rem; color:#555; display:block; margin-bottom:4px; font-weight:600;">TO Hub</label>
          <select id="route-end" class="form-control" [(ngModel)]="selectedEndId" style="width:220px;">
            <option [ngValue]="null" disabled>Select End Hub</option>
            <option *ngFor="let w of warehouses; trackBy: trackById" [ngValue]="w.id">
              {{ w.name }}
            </option>
          </select>
        </div>

        <button id="route-calc-btn"
                class="btn btn-primary"
                (click)="calculateRoute()"
                [disabled]="isLoadingRoute"
                style="padding:10px 20px;">
          {{ isLoadingRoute ? '⚙️ Processing...' : '📍 Calculate Route' }}
        </button>

        <button class="btn"
                style="background:#ecf0f1; color:#555; padding:10px 20px;"
                (click)="runDefault()"
                [disabled]="isLoadingRoute">
          ▶ Run Default (All Hubs)
        </button>
      </div>

      <!-- ── Route Result ── -->
      <div *ngIf="routeData" style="border-left:4px solid #3498db; background:#fafcff;
                                    border-radius:0 8px 8px 0; padding:20px;">
        <!-- Summary numbers -->
        <div style="display:flex; gap:30px; margin-bottom:15px; align-items:center; flex-wrap:wrap;">
          <div style="text-align:center;">
            <div style="font-size:2rem; font-weight:bold; color:#2980b9;">{{ routeData.path?.length || 0 }}</div>
            <div style="font-size:0.75rem; color:#7f8c8d; text-transform:uppercase;">Hubs</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:2rem; font-weight:bold; color:#27ae60;">
              {{ (routeData.totalDistance || 0) | number:'1.2-2' }}
            </div>
            <div style="font-size:0.75rem; color:#7f8c8d; text-transform:uppercase;">Total Distance</div>
          </div>
          <div *ngIf="selectedOrder" style="flex:1; background:#fef9e7; border:1px solid #f9e79f;
                                            border-radius:6px; padding:10px 16px; font-size:0.85rem;">
            🛒 Routing for order <strong>#{{ selectedOrder.id }}</strong> —
            {{ selectedOrder.customerName }} ({{ selectedOrder.status }})
          </div>
        </div>

        <!-- Path steps -->
        <div style="display:flex; flex-direction:column; gap:0;">
          <div *ngFor="let hub of routeData.path; let i = index; let last = last; trackBy: trackById">
            <div style="display:flex; align-items:center; gap:12px; padding:10px 0;">
              <div style="width:32px; height:32px; border-radius:50%; display:flex; align-items:center;
                          justify-content:center; font-weight:bold; font-size:0.85rem; flex-shrink:0; color:white;"
                   [style.background]="i === 0 ? '#3498db' : (last ? '#e74c3c' : '#95a5a6')">
                {{ i + 1 }}
              </div>
              <div style="flex:1;">
                <div style="font-weight:bold; color:#2c3e50; font-size:1rem;">
                  {{ hub.name }}
                  <span *ngIf="selectedOrder && hub.id === selectedOrder.assignedHubId"
                        style="background:#f39c12; color:white; font-size:0.7rem;
                               padding:2px 8px; border-radius:10px; margin-left:6px;">
                    ASSIGNED HUB
                  </span>
                </div>
                <div style="font-size:0.78rem; color:#95a5a6;">{{ hub.latitude }}, {{ hub.longitude }}</div>
              </div>
              <span *ngIf="i === 0"
                    style="background:#3498db; color:white; font-size:0.72rem; padding:3px 10px; border-radius:12px;">
                START
              </span>
              <span *ngIf="last"
                    style="background:#e74c3c; color:white; font-size:0.72rem; padding:3px 10px; border-radius:12px;">
                END
              </span>
            </div>
            <div *ngIf="!last" style="display:flex; align-items:center; gap:12px; padding:0 0 0 15px;">
              <div style="width:2px; height:20px; background:#ddd;"></div>
              <div style="font-size:0.78rem; color:#aaa;">direct edge</div>
            </div>
          </div>
        </div>

        <!-- Map tiles for each hub -->
        <div style="margin-top:20px;">
          <div style="font-size:0.9rem; font-weight:bold; color:#555; margin-bottom:10px;">📌 Hub Locations</div>
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:12px;">
            <div *ngFor="let hub of routeData.path; let i = index; trackBy: trackById"
                 style="border-radius:8px; overflow:hidden; border:1px solid #ddd;">
              <div style="padding:8px 12px; background:#f8f9fa; font-weight:bold;
                          font-size:0.85rem; border-bottom:1px solid #ddd;">
                {{ i + 1 }}. {{ hub.name }}
              </div>
              <iframe [src]="getSafeUrl(hub.latitude, hub.longitude)"
                      width="100%" height="160"
                      style="border:0; display:block;" loading="lazy">
              </iframe>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!routeData && !isLoadingRoute"
           style="text-align:center; color:#bdc3c7; padding:40px;">
        Select hubs and click Calculate Route to see Dijkstra path
      </div>
    </div>

    <!-- ─── Demand Forecast ──────────────────────────────────────────────────── -->
    <div class="card">
      <h3 style="margin-bottom:5px;">📈 Demand Forecast Engine</h3>
      <p style="color:#7f8c8d; font-size:0.85rem; margin-bottom:20px;">
        Moving-average based demand prediction with trend detection
      </p>

      <div style="display:flex; gap:10px; align-items:center; margin-bottom:20px;">
        <select id="forecast-product" class="form-control" [(ngModel)]="selectedProductId" style="width:250px;">
          <option [ngValue]="null">Global Average (All Products)</option>
          <option *ngFor="let p of products; trackBy: trackById" [ngValue]="p.id">{{ p.name }}</option>
        </select>
        <button id="forecast-btn" class="btn btn-success" (click)="getForecast()" [disabled]="isLoadingForecast">
          {{ isLoadingForecast ? '⚙️ Analyzing...' : '🔮 Run Forecast' }}
        </button>
      </div>

      <div *ngIf="forecastResult" style="display:flex; gap:20px; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px; padding:25px; border-radius:8px;
                    border-left:4px solid #2ecc71; background:#fdfffe;">
          <div style="font-size:0.85rem; color:#7f8c8d; text-transform:uppercase;
                      letter-spacing:1px; margin-bottom:8px;">Predicted Demand</div>
          <div style="font-size:3rem; font-weight:bold; color:#27ae60; line-height:1;">
            {{ forecastResult.forecast | number:'1.0-1' }}
          </div>
          <div style="color:#95a5a6; margin-top:5px;">units expected</div>
        </div>

        <div style="flex:1; min-width:200px; padding:25px; border-radius:8px;
                    border-left:4px solid #9b59b6; background:#fdfffe;">
          <div style="font-size:0.85rem; color:#7f8c8d; text-transform:uppercase;
                      letter-spacing:1px; margin-bottom:8px;">Trend</div>
          <div style="font-size:2rem; font-weight:bold; line-height:1;"
               [ngStyle]="{'color': getTrendColor(forecastResult.trend)}">
            {{ forecastResult.trend === 'increasing' ? '📈' : forecastResult.trend === 'decreasing' ? '📉' : '➡️' }}
            {{ forecastResult.trend | uppercase }}
          </div>
          <div style="margin-top:8px; color:#555; font-size:0.9rem;">
            <span *ngIf="forecastResult.trend === 'increasing'">Demand is growing. Consider increasing stock.</span>
            <span *ngIf="forecastResult.trend === 'decreasing'">Demand is falling. Review inventory levels.</span>
            <span *ngIf="forecastResult.trend === 'stable'">Demand is stable. Maintain current supply chain.</span>
          </div>
        </div>

        <div style="flex:1; min-width:200px; padding:25px; border-radius:8px;
                    border-left:4px solid #3498db; background:#fdfffe;">
          <div style="font-size:0.85rem; color:#7f8c8d; text-transform:uppercase;
                      letter-spacing:1px; margin-bottom:8px;">Context</div>
          <div style="font-weight:bold; color:#2c3e50;">{{ getProductName(forecastResult.productId) }}</div>
          <div style="color:#95a5a6; margin-top:5px; font-size:0.85rem;">Based on last 10 orders</div>
        </div>
      </div>
    </div>
  `
})
export class OptimizationComponent implements OnInit {
  warehouses: any[] = [];
  products: any[] = [];
  orders: any[] = [];
  routeData: any = null;
  forecastResult: any = null;

  selectedOrderId: number | null = null;
  selectedOrder: any = null;
  selectedStartId: number | null = null;
  selectedEndId: number | null = null;
  selectedProductId: number | null = null;

  isLoadingRoute = false;
  isLoadingForecast = false;
  errorMessage = '';

  constructor(private api: ApiService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Always force a fresh fetch so ALL hubs (including newly added ones) appear.
    this.api.invalidateWarehouseCache();
    this.api.getWarehouses().subscribe({ next: res => this.warehouses = res || [] });
    this.api.getProducts().subscribe({ next: res => this.products = res || [] });
    this.api.getOrders().subscribe({ next: res => this.orders = res || [] });
  }

  trackById(_: number, item: any) { return item.id; }

  getSafeUrl(lat: number, lng: number): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://maps.google.com/maps?q=${lat},${lng}&z=13&output=embed`
    );
  }

  getProductName(id: number): string {
    if (id === 0 || id == null) return 'Global Average (All Products)';
    const p = this.products.find(x => x.id === id);
    return p ? p.name : `Product #${id}`;
  }

  getHubName(id: number): string {
    const w = this.warehouses.find(x => x.id === id);
    return w ? w.name : `Hub #${id}`;
  }

  getTrendColor(trend: string) {
    if (trend === 'increasing') return '#27ae60';
    if (trend === 'decreasing') return '#e74c3c';
    return '#f39c12';
  }

  /** When an order is selected, store its reference and optionally pre-fill the assigned hub. */
  onOrderSelected(orderId: number | null) {
    if (orderId == null) {
      this.selectedOrder = null;
      return;
    }
    this.selectedOrder = this.orders.find(o => o.id === orderId) || null;

    // If the order already has an assigned hub, pre-select it as the START hub
    if (this.selectedOrder?.assignedHubId) {
      this.selectedStartId = this.selectedOrder.assignedHubId;
    }
  }

  calculateRoute() {
    this.errorMessage = '';
    if (!this.selectedStartId || !this.selectedEndId) {
      this.errorMessage = 'Please select both Start and End hubs';
      return;
    }
    if (this.selectedStartId === this.selectedEndId) {
      this.errorMessage = 'Start and End hubs must be different';
      return;
    }
    this.isLoadingRoute = true;
    this.api.getRouteOptimization(this.selectedStartId, this.selectedEndId).subscribe({
      next: res => { this.routeData = res; this.isLoadingRoute = false; },
      error: () => { this.errorMessage = 'Route calculation failed'; this.isLoadingRoute = false; }
    });
  }

  runDefault() {
    this.isLoadingRoute = true;
    this.api.getRouteOptimization().subscribe({
      next: res => { this.routeData = res; this.isLoadingRoute = false; },
      error: () => { this.isLoadingRoute = false; }
    });
  }

  getForecast() {
    this.isLoadingForecast = true;
    this.api.getForecast(this.selectedProductId ?? undefined).subscribe({
      next: res => { this.forecastResult = res; this.isLoadingForecast = false; },
      error: () => { this.isLoadingForecast = false; }
    });
  }
}
