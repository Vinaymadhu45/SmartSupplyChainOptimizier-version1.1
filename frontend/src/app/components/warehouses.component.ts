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
      <h3>Manage Warehouses</h3>
      <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="form-group" style="display:flex; gap:10px; margin-bottom:20px;">
        <input class="form-control" [(ngModel)]="newWarehouse.name" placeholder="Warehouse Name" />
        <input class="form-control" type="number" [(ngModel)]="newWarehouse.latitude" placeholder="Latitude" />
        <input class="form-control" type="number" [(ngModel)]="newWarehouse.longitude" placeholder="Longitude" />
        <button class="btn btn-primary" (click)="addWarehouse()" [disabled]="isSaving">{{ isSaving ? 'Saving...' : 'Add Warehouse' }}</button>
      </div>

      <div *ngIf="isLoading" style="color:#7f8c8d; margin-bottom:10px;">Loading warehouses...</div>
      
      <table class="table" *ngIf="!isLoading">
        <thead>
          <tr>
            <th>ID</th>
            <th>Location Details</th>
            <th>Coordinates</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let w of warehouses; trackBy: trackById">
            <td>#{{ w.id }}</td>
            <td><strong>{{ w.name }}</strong></td>
            <td><span style="color:#7f8c8d">{{ w.latitude }}, {{ w.longitude }}</span></td>
          </tr>
          <tr *ngIf="!warehouses || warehouses.length === 0">
            <td colspan="3" style="text-align:center; color:#999;">No warehouses found</td>
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

  trackById(index: number, item: any) { return item.id; }

  loadWarehouses() {
    this.isLoading = true;
    this.api.getWarehouses().subscribe({
      next: res => { 
        this.warehouses = (res && res.length > 0) ? res : []; 
        this.isLoading = false; 
      },
      error: err => { 
        console.log(err);
        this.errorMessage = 'Failed to load warehouses'; 
        this.isLoading = false; 
      }
    });
  }

  addWarehouse() {
    this.errorMessage = ''; this.successMessage = '';
    if(!this.newWarehouse.name || this.newWarehouse.latitude == null || this.newWarehouse.longitude == null) {
      this.errorMessage = 'Please provide name and valid coordinates'; return;
    }
    this.isSaving = true;
    this.api.addWarehouse(this.newWarehouse).subscribe({
      next: (res) => {
        this.successMessage = 'Warehouse added successfully!';
        this.warehouses.push(res);
        this.newWarehouse = { name: '', latitude: null, longitude: null };
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: err => {
        console.log(err);
        this.errorMessage = 'Failed to add warehouse';
        this.isSaving = false;
      }
    });
  }
}
