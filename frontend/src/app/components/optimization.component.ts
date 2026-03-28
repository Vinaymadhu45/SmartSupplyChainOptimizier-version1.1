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
    <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

    <div class="card" style="margin-bottom: 20px;">
      <h3>Route Optimization Simulator</h3>
      <p style="color: #7f8c8d; margin-bottom: 15px;">Dijkstra-Powered Shortest Path Graph Calculation</p>
      <button class="btn btn-primary" (click)="getRoute()" [disabled]="isLoadingRoute">
        {{ isLoadingRoute ? 'Processing Graph...' : 'Calculate Optimal Route' }}
      </button>
      
      <div class="results" *ngIf="routeResult && routeResult.length > 0; else noRoute" style="margin-top:20px; padding: 15px; border-left: 4px solid #3498db; background: #fdfefe;">
        <h4 style="margin-top:0;">Dijkstra Sequence:</h4>
        
        <div style="display:flex; flex-direction:column; gap: 20px; margin-top:20px;">
            <div *ngFor="let w of routeResult; let i = index; trackBy: trackById" style="padding: 15px; border: 1px solid #eee; border-radius: 4px; background: #fff;">
               <div style="font-size:1.1em; color:#2c3e50; font-weight:bold; margin-bottom:10px;">
                  <span style="color:#e74c3c; margin-right:5px;">Step {{ i + 1 }} &rarr;</span> {{ w.name }}
               </div>
               <div style="color:#7f8c8d; font-size:0.9em; margin-bottom:10px;">
                  Coordinates: {{ w.latitude }}, {{ w.longitude }}
               </div>
               <iframe
                 width="100%"
                 height="200"
                 style="border:0; border-radius: 4px;"
                 loading="lazy"
                 allowfullscreen
                 [src]="getSafeUrl(w.latitude, w.longitude)">
               </iframe>
            </div>
        </div>
      </div>
      <ng-template #noRoute>
          <div *ngIf="routeRequested && !isLoadingRoute" style="margin-top:10px; color:#7f8c8d;">No route found. Graph empty.</div>
      </ng-template>
    </div>

    <div class="card">
      <h3>Demand Forecast Engine</h3>
      <p style="color: #7f8c8d; margin-bottom: 15px;">Moving Averages & Historical Trend Predictor</p>
      
      <div style="display:flex; gap:10px;">
        <select class="form-control" [(ngModel)]="selectedProductId" style="width:250px;">
          <option [ngValue]="null">Global Aggregate Model</option>
          <option *ngFor="let p of products; trackBy: trackById" [ngValue]="p.id">{{ p.name }}</option>
        </select>
        <button class="btn btn-success" (click)="getForecast()" [disabled]="isLoadingForecast">
          {{ isLoadingForecast ? 'Analyzing...' : 'Execute Forecast' }}
        </button>
      </div>

      <div class="results" *ngIf="forecastResult" style="margin-top:20px; padding: 25px; border-left: 4px solid #2ecc71; background: #fdfefe; display:flex; gap:30px; align-items:center;">
        <div>
          <h4 style="margin:0 0 5px 0; color: #2c3e50;">Predicted Pipeline Demand</h4>
          <p style="font-size: 2.5rem; font-weight: bold; color: #27ae60; margin:0;">
            {{ forecastResult.forecast | number:'1.0-1' }} <span style="font-size: 1rem; color: #95a5a6; font-weight: normal;">Units expected</span>
          </p>
        </div>
        <div style="border-left: 1px solid #ddd; padding-left: 30px;">
          <p style="margin: 5px 0; color:#555;"><strong>Context:</strong> {{ getProductName(forecastResult.productId) }}</p>
          <p style="margin: 5px 0; color:#555;">
             <strong>Vector Trend:</strong> 
             <span [ngStyle]="{'color': forecastResult.trend === 'increasing' ? '#27ae60' : forecastResult.trend === 'decreasing' ? '#e74c3c' : '#f39c12', 'font-weight': 'bold'}">
               {{ forecastResult.trend | uppercase }}
             </span>
          </p>
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
  routeRequested = false;
  errorMessage = '';

  constructor(private api: ApiService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.api.getProducts().subscribe({
       next: res => { this.products = (res && res.length > 0) ? res : []; },
       error: err => console.log(err)
    });
  }

  getSafeUrl(lat: number, lng: number): SafeResourceUrl {
     return this.sanitizer.bypassSecurityTrustResourceUrl('https://maps.google.com/maps?q=' + lat + ',' + lng + '&output=embed');
  }

  trackById(index: number, item: any) { return item.id; }

  getProductName(id: number): string {
    if(this.selectedProductId === null && id === 0) return 'Global Aggregate Model';
    if(!this.products) return 'Unknown';
    const p = this.products.find(x => x.id === id);
    return p ? p.name : 'Unknown Product';
  }

  getRoute() {
    this.isLoadingRoute = true;
    this.routeRequested = true;
    this.errorMessage = '';
    this.api.getRouteOptimization().subscribe({
      next: res => {
        this.routeResult = (res && res.length > 0) ? res : [];
        this.isLoadingRoute = false;
      },
      error: (err) => {
         console.log(err);
         this.routeResult = [];
         this.errorMessage = 'Route generator failed bounds processing.';
         this.isLoadingRoute = false;
      }
    });
  }

  getForecast() {
    this.isLoadingForecast = true;
    this.errorMessage = '';
    this.api.getForecast(this.selectedProductId !== null ? this.selectedProductId : undefined).subscribe({
      next: res => {
        this.forecastResult = res;
        this.isLoadingForecast = false;
      },
      error: (err) => {
        console.log(err);
        this.errorMessage = 'Forecast calculation isolated bounds fault.';
        this.isLoadingForecast = false;
      }
    });
  }
}
