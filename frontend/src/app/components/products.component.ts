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
      <h3>Manage Products</h3>
      <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="form-group" style="display:flex; gap:10px; margin-bottom:20px;">
        <input class="form-control" [(ngModel)]="newProduct.name" placeholder="Product Name" />
        <input class="form-control" type="number" [(ngModel)]="newProduct.price" placeholder="Price" />
        <button class="btn btn-primary" (click)="addProduct()" [disabled]="isSaving">{{ isSaving ? 'Saving...' : 'Add Product' }}</button>
      </div>

      <div style="margin-bottom: 20px; display:flex; gap:10px;">
        <input class="form-control" [(ngModel)]="searchQuery" placeholder="Search by name..." (keyup.enter)="search()" style="width: 300px;" />
        <button class="btn btn-primary" (click)="search()" [disabled]="isLoading">Search</button>
        <button class="btn btn-primary" style="background:#7f8c8d" (click)="loadProducts()" [disabled]="isLoading">Clear</button>
      </div>

      <div *ngIf="isLoading" style="color:#7f8c8d; margin-bottom:10px;">Loading products...</div>
      
      <table class="table" *ngIf="!isLoading">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of displayProducts; trackBy: trackById">
            <td>#{{ p.id }}</td>
            <td>{{ p.name }}</td>
            <td>\${{ p.price | number:'1.2-2' }}</td>
          </tr>
          <tr *ngIf="displayProducts.length === 0">
            <td colspan="3" style="text-align:center; color:#999;">No products found</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="products.length > 20" style="margin-top:10px; color:#7f8c8d; font-size:0.9em;">
        Showing top 20 of {{ products.length }} rows.
      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  displayProducts: any[] = [];
  newProduct: any = { name: '', price: null };
  searchQuery = '';
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadProducts(); }

  trackById(index: number, item: any) { return item.id; }

  loadProducts() {
    this.isLoading = true;
    this.searchQuery = '';
    this.api.getProducts().subscribe({
      next: res => { this.products = res; this.displayProducts = res.slice(0, 20); this.isLoading = false; },
      error: err => { this.errorMessage = 'Failed to load products'; this.isLoading = false; }
    });
  }

  search() {
    if(!this.searchQuery.trim()) { this.loadProducts(); return; }
    this.isLoading = true;
    this.api.searchProducts(this.searchQuery).subscribe({
      next: res => { this.products = res; this.displayProducts = res.slice(0, 20); this.isLoading = false; },
      error: err => { this.errorMessage = 'Search failed'; this.isLoading = false; }
    });
  }

  addProduct() {
    this.errorMessage = ''; this.successMessage = '';
    if(!this.newProduct.name || this.newProduct.price == null || this.newProduct.price <= 0) {
      this.errorMessage = 'Please provide a valid name and positive price'; return;
    }
    this.isSaving = true;
    this.api.addProduct(this.newProduct).subscribe({
      next: () => {
        this.successMessage = 'Product added successfully!';
        this.newProduct = { name: '', price: null };
        this.loadProducts();
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: err => {
        this.errorMessage = 'Failed to add product (Backend validation failed)';
        this.isSaving = false;
      }
    });
  }
}
