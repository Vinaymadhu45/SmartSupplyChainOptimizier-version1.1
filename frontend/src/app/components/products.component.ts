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
          <tr *ngFor="let p of products; trackBy: trackById">
            <td>#{{ p.id }}</td>
            <td>{{ p.name }}</td>
            <td>\${{ p.price | number:'1.2-2' }}</td>
          </tr>
          <tr *ngIf="!products || products.length === 0">
            <td colspan="3" style="text-align:center; color:#999;">No products found</td>
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

  trackById(index: number, item: any) { return item.id; }

  loadProducts() {
    this.isLoading = true;
    this.api.getProducts().subscribe({
      next: res => { 
        this.products = (res && res.length > 0) ? res : []; 
        this.isLoading = false; 
      },
      error: err => { 
        console.log(err);
        this.errorMessage = 'Failed to load products'; 
        this.isLoading = false; 
      }
    });
  }

  addProduct() {
    this.errorMessage = ''; this.successMessage = '';
    if(!this.newProduct.name || this.newProduct.price == null || this.newProduct.price <= 0) {
      this.errorMessage = 'Please provide a valid name and positive price'; return;
    }

    if (this.products.find(p => p.name.toLowerCase() === this.newProduct.name.toLowerCase())) {
        this.errorMessage = 'Validation Failed: A Product with this exact name already exists locally.';
        return;
    }

    this.isSaving = true;
    this.api.addProduct(this.newProduct).subscribe({
      next: (res) => {
        this.successMessage = 'Product added successfully!';
        if (!this.products.find(p => p.id === res.id)) {
            this.products.push(res); 
        }
        this.newProduct = { name: '', price: null };
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: err => {
        console.log(err);
        this.errorMessage = err.error && err.error.message ? err.error.message : 'Database duplicate collision aborted correctly.';
        this.isSaving = false;
      }
    });
  }
}
