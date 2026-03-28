import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-optimization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card" style="margin-bottom: 20px;">
      <h3>Route Optimization Simulator</h3>
      <p style="color: #7f8c8d; margin-bottom: 15px;">Simulate optimal paths between connected warehouses.</p>
      <button class="btn btn-primary" (click)="getRoute()" [disabled]="isLoadingRoute">
        {{ isLoadingRoute ? 'Calculating...' : 'Calculate Optimal Route' }}
      </button>
      
      <div class="results" *ngIf="routeResult.length > 0" style="margin-top:20px; padding: 15px; border-left: 4px solid #3498db; background: #fdfefe;">
        <h4 style="margin-top:0;">Optimized Path:</h4>
        <ul style="list-style-type: none; padding-left:0;">
          <li *ngFor="let w of routeResult; let i = index; trackBy: trackById" style="padding: 8px 0; border-bottom: 1px dashed #eee;">
            <span style="display:inline-block; width: 25px; height: 25px; background: #3498db; color: white; text-align: center; border-radius: 50%; margin-right: 10px; line-height:25px;">{{ i + 1 }}</span>
            <strong>{{ w.name }}</strong> <span style="color:#999;font-size:0.9em;">(Lat: {{ w.latitude }}, Lng: {{ w.longitude }})</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="card">
      <h3>Demand Forecast Simulator</h3>
      <p style="color: #7f8c8d; margin-bottom: 15px;">Forecast product demand based on historical moving average.</p>
      
      <div style="display:flex; gap:10px;">
        <select class="form-control" [(ngModel)]="selectedProductId" style="width:250px;">
          <option [ngValue]="null">All Products (Global Average)</option>
          <option *ngFor="let p of products; trackBy: trackById" [ngValue]="p.id">{{ p.name }}</option>
        </select>
        <button class="btn btn-success" (click)="getForecast()" [disabled]="isLoadingForecast">
          {{ isLoadingForecast ? 'Forecasting...' : 'Generate Forecast' }}
        </button>
      </div>

      <div class="results" *ngIf="forecastResult" style="margin-top:20px; padding: 25px; border-left: 4px solid #2ecc71; background: #fdfefe; display:flex; gap:30px; align-items:center;">
        <div>
          <h4 style="margin:0 0 5px 0; color: #2c3e50;">Predicted Demand</h4>
          <p style="font-size: 2.5rem; font-weight: bold; color: #27ae60; margin:0;">
            {{ forecastResult.forecastedDemand | number:'1.0-1' }} <span style="font-size: 1rem; color: #95a5a6; font-weight: normal;">Units</span>
          </p>
        </div>
        <div style="border-left: 1px solid #ddd; padding-left: 30px;">
          <p style="margin: 5px 0; color:#555;"><strong>Target Context:</strong> {{ getProductName(forecastResult.productId) }}</p>
          <p style="margin: 5px 0; color:#7f8c8d; font-size: 0.9em;"><i>*Based on averaged historical order quantities</i></p>
        </div>
      </div>
    </div>
  `
})
export class OptimizationComponent implements OnInit {
  routeResult: any[] = [];
  forecastResult: any = null;
  products: any[] = [];
  selectedProductId: number | null = null;
  isLoadingRoute = false;
  isLoadingForecast = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getProducts().subscribe(res => this.products = res);
  }

  trackById(index: number, item: any) { return item.id; }

  getProductName(id: number): string {
    if(this.selectedProductId === null && id === 1) return 'Global Base Average';
    const p = this.products.find(x => x.id === id);
    return p ? p.name : 'All Target Products';
  }

  getRoute() {
    this.isLoadingRoute = true;
    this.api.getRouteOptimization().subscribe(res => {
      this.routeResult = res;
      this.isLoadingRoute = false;
    });
  }

  getForecast() {
    this.isLoadingForecast = true;
    this.api.getForecast(this.selectedProductId !== null ? this.selectedProductId : undefined).subscribe(res => {
      this.forecastResult = res;
      this.isLoadingForecast = false;
    });
  }
}
