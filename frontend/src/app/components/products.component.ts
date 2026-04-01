import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h3 style="margin-bottom:5px;">🏷️ Product Catalog</h3>
      <p style="color:#7f8c8d; font-size:0.85rem; margin-bottom:20px;">Manage products linked to supply chain orders</p>

      <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div style="background:#f9fafb; border:1px solid #e8ecef; border-radius:8px; padding:16px; margin-bottom:20px;">
        <div style="display:grid; grid-template-columns:2fr 1fr auto; gap:10px; align-items:center;">
          <input id="prod-name" class="form-control" [(ngModel)]="newProduct.name" placeholder="Product Name (unique)" />
          <input id="prod-price" class="form-control" type="number" [(ngModel)]="newProduct.price" placeholder="Price ($)" min="0.01" step="0.01" />
          <button id="prod-add-btn" class="btn btn-primary" (click)="addProduct()" [disabled]="isSaving">
            {{ isSaving ? 'Saving...' : '+ Add Product' }}
          </button>
        </div>
      </div>

      <div *ngIf="isLoading" style="color:#7f8c8d; text-align:center; padding:20px;">Loading products...</div>

      <table class="table" *ngIf="!isLoading">
        <thead>
          <tr>
            <th>ID</th>
            <th>Product Name</th>
            <th>Unit Price</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of products; trackBy: trackById">
            <td style="color:#95a5a6; font-size:0.85rem;">#{{ p.id }}</td>
            <td><strong>{{ p.name }}</strong></td>
            <td style="color:#27ae60; font-weight:bold;">\${{ p.price | number:'1.2-2' }}</td>
          </tr>
          <tr *ngIf="products.length === 0">
            <td colspan="3" style="text-align:center; color:#bdc3c7; padding:30px;">No products yet. Add your first product!</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  newProduct: any = { name: '', price: null };
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadProducts(); }

  trackById(_: number, item: any) { return item.id; }

  loadProducts() {
    this.isLoading = true;
    this.api.getProducts().subscribe({
      next: res => { this.products = res || []; this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load products'; this.isLoading = false; }
    });
  }

  addProduct() {
    this.errorMessage = ''; this.successMessage = '';
    if (!this.newProduct.name?.trim()) { this.errorMessage = 'Product name is required'; return; }
    if (this.newProduct.price == null || this.newProduct.price <= 0) { this.errorMessage = 'Price must be greater than 0'; return; }

    // Frontend duplicate check
    if (this.products.find(p => p.name.toLowerCase() === this.newProduct.name.toLowerCase())) {
      this.errorMessage = `A product named "${this.newProduct.name}" already exists`; return;
    }

    this.isSaving = true;
    this.api.addProduct(this.newProduct).subscribe({
      next: (res) => {
        this.successMessage = `✅ Product "${res.name}" added!`;
        if (!this.products.find(p => p.id === res.id)) this.products.push(res);
        this.newProduct = { name: '', price: null };
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Failed to add product (may be a duplicate)';
        this.isSaving = false;
      }
    });
  }
}
