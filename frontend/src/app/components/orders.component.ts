import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h3>Manage Orders</h3>
      <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="form-group" style="display:flex; gap:10px; margin-bottom:20px;">
        <input class="form-control" [(ngModel)]="newOrder.customerName" placeholder="Customer Name" />
        <select class="form-control" [(ngModel)]="newOrder.productId">
          <option [ngValue]="null" disabled>Select Product</option>
          <option *ngFor="let p of products; trackBy: trackById" [ngValue]="p.id">{{ p.name }}</option>
        </select>
        <input class="form-control" type="number" [(ngModel)]="newOrder.quantity" placeholder="Quantity" />
        <button class="btn btn-primary" (click)="addOrder()" [disabled]="isSaving">{{ isSaving ? 'Saving...' : 'Create Order' }}</button>
      </div>

      <div *ngIf="isLoading" style="color:#7f8c8d; margin-bottom:10px;">Loading orders...</div>

      <table class="table" *ngIf="!isLoading">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer Name</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let o of orders; trackBy: trackById">
            <td>#{{ o.id }}</td>
            <td><strong>{{ o.customerName }}</strong></td>
            <td>{{ getProductName(o.productId) }}</td>
            <td>{{ o.quantity }}</td>
            <td>
              <span class="badge" [ngClass]="getBadgeClass(o.status)">
                {{ o.status }}
              </span>
            </td>
            <td>
              <select class="form-control" style="width:130px; display:inline-block; padding: 6px;" 
                      [ngModel]="o.status" (ngModelChange)="updateStatus(o, $event)">
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </td>
          </tr>
          <tr *ngIf="!orders || orders.length === 0">
            <td colspan="6" style="text-align:center; color:#999;">No orders found</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .badge { padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-gray { background: #ecf0f1; color: #7f8c8d; }
    .badge-blue { background: #d6eaf8; color: #2980b9; }
    .badge-orange { background: #fdebd0; color: #d35400; }
    .badge-green { background: #d5f5e3; color: #27ae60; }
  `]
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  products: any[] = [];
  newOrder: any = { customerName: '', productId: null, quantity: null, status: 'PENDING' };
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getProducts().subscribe({ 
       next: res => { this.products = (res && res.length > 0) ? res : []; },
       error: err => console.log(err)
    });
    this.loadOrders();
  }

  trackById(index: number, item: any) { return item.id; }

  loadOrders() {
    this.isLoading = true;
    this.api.getOrders().subscribe({
      next: res => { 
        this.orders = (res && res.length > 0) ? res : []; 
        this.isLoading = false; 
      },
      error: err => { 
        console.log(err);
        this.errorMessage = 'Failed to load orders'; 
        this.isLoading = false; 
      }
    });
  }

  getProductName(id: number): string {
    if (!this.products) return 'Unknown';
    const p = this.products.find(x => x.id === id);
    return p ? p.name : 'Unknown Product (' + id + ')';
  }

  getBadgeClass(status: string) {
    if(status === 'PROCESSING') return 'badge-blue';
    if(status === 'SHIPPED') return 'badge-orange';
    if(status === 'DELIVERED') return 'badge-green';
    return 'badge-gray';
  }

  addOrder() {
    this.errorMessage = ''; this.successMessage = '';
    if(!this.newOrder.customerName || !this.newOrder.productId || this.newOrder.quantity == null || this.newOrder.quantity <= 0) {
      this.errorMessage = 'Please provide valid customer details, select a product, and quantity > 0'; return;
    }
    
    // Front-end duplicate catch
    if(this.orders.find(o => o.customerName.toLowerCase() === this.newOrder.customerName.toLowerCase() && o.productId === this.newOrder.productId && o.quantity === this.newOrder.quantity && o.status === 'PENDING')) {
       this.errorMessage = 'Duplicate order detected. Ensure unique parameters before submitting.';
       return;
    }

    this.isSaving = true;
    this.api.addOrder(this.newOrder).subscribe({
      next: (res) => {
        this.successMessage = 'Order placed successfully!';
        if(!this.orders.find(o => o.id === res.id)) {
            this.orders.push(res);
        }
        this.newOrder = { customerName: '', productId: null, quantity: null, status: 'PENDING' };
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

  updateStatus(order: any, newStatus: string) {
    this.api.updateOrderStatus(order.id, newStatus).subscribe({
      next: (res) => {
        order.status = res.status; 
        this.successMessage = 'Order status updated!';
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: err => {
        console.log(err);
        this.errorMessage = 'Failed to update order status';
      }
    });
  }
}
