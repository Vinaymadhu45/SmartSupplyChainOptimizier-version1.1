import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h3 style="margin-bottom:5px;">🏢 Hub Management</h3>
      <p style="color:#7f8c8d; font-size:0.85rem; margin-bottom:20px;">All warehouses act as routing hubs in the geo-network</p>

      <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div style="background:#f9fafb; border:1px solid #e8ecef; border-radius:8px; padding:16px; margin-bottom:20px;">
        <div style="display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:10px; align-items:center;">
          <input id="wh-name" class="form-control" [(ngModel)]="newWarehouse.name" placeholder="Hub Name (e.g. Mumbai Central)" />
          <input id="wh-lat" class="form-control" type="number" [(ngModel)]="newWarehouse.latitude" placeholder="Latitude" step="any" />
          <input id="wh-lng" class="form-control" type="number" [(ngModel)]="newWarehouse.longitude" placeholder="Longitude" step="any" />
          <button id="wh-add-btn" class="btn btn-primary" (click)="addWarehouse()" [disabled]="isSaving">
            {{ isSaving ? 'Saving...' : '+ Add Hub' }}
          </button>
        </div>
      </div>

      <div *ngIf="isLoading" style="color:#7f8c8d; text-align:center; padding:20px;">Loading hubs...</div>

      <table class="table" *ngIf="!isLoading">
        <thead>
          <tr>
            <th>ID</th>
            <th>Hub Name</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Map Preview</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let w of warehouses; trackBy: trackById">
            <td style="color:#95a5a6; font-size:0.85rem;">#{{ w.id }}</td>
            <td><strong>{{ w.name }}</strong></td>
            <td style="font-family:monospace; color:#2980b9;">{{ w.latitude }}</td>
            <td style="font-family:monospace; color:#2980b9;">{{ w.longitude }}</td>
            <td>
              <a [href]="'https://maps.google.com/?q=' + w.latitude + ',' + w.longitude" target="_blank"
                 style="color:#3498db; text-decoration:none; font-size:0.85rem; display:flex; align-items:center; gap:4px;">
                🗺️ View on Map
              </a>
            </td>
          </tr>
          <tr *ngIf="warehouses.length === 0">
            <td colspan="5" style="text-align:center; color:#bdc3c7; padding:30px;">No hubs found. Add your first hub above!</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class WarehousesComponent implements OnInit {
  warehouses: any[] = [];
  newWarehouse: any = { name: '', latitude: null, longitude: null };
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadWarehouses(); }

  trackById(_: number, item: any) { return item.id; }

  loadWarehouses() {
    this.isLoading = true;
    this.api.getWarehouses().subscribe({
      next: res => { this.warehouses = res || []; this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load hubs'; this.isLoading = false; }
    });
  }

  addWarehouse() {
    this.errorMessage = ''; this.successMessage = '';
    if (!this.newWarehouse.name?.trim()) { this.errorMessage = 'Hub name is required'; return; }
    if (this.newWarehouse.latitude == null) { this.errorMessage = 'Latitude is required'; return; }
    if (this.newWarehouse.longitude == null) { this.errorMessage = 'Longitude is required'; return; }
    if (this.newWarehouse.latitude < -90 || this.newWarehouse.latitude > 90) { this.errorMessage = 'Latitude must be between -90 and 90'; return; }
    if (this.newWarehouse.longitude < -180 || this.newWarehouse.longitude > 180) { this.errorMessage = 'Longitude must be between -180 and 180'; return; }

    this.isSaving = true;
    this.api.invalidateWarehouseCache();
    this.api.addWarehouse(this.newWarehouse).subscribe({
      next: (res) => {
        this.successMessage = `Hub "${res.name}" added successfully!`;
        if (!this.warehouses.find(w => w.id === res.id)) this.warehouses.push(res);
        this.newWarehouse = { name: '', latitude: null, longitude: null };
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Failed to add hub';
        this.isSaving = false;
      }
    });
  }
}
