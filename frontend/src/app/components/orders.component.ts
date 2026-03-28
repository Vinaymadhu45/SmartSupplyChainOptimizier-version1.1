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
          <tr *ngFor="let o of displayOrders; trackBy: trackById">
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
                      [ngModel]="o.status" (ngModelChange)="updateStatus(o.id, $event)">
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </td>
          </tr>
          <tr *ngIf="displayOrders.length === 0">
            <td colspan="6" style="text-align:center; color:#999;">No orders found</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="orders.length > 20" style="margin-top:10px; color:#7f8c8d; font-size:0.9em;">
        Showing top 20 of {{ orders.length }} rows.
      </div>
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
  displayOrders: any[] = [];
  products: any[] = [];
  newOrder: any = { customerName: '', productId: null, quantity: null, status: 'PENDING' };
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getProducts().subscribe({ next: res => this.products = res });
    this.loadOrders();
  }

  trackById(index: number, item: any) { return item.id; }

  loadOrders() {
    this.isLoading = true;
    this.api.getOrders().subscribe({
      next: res => { this.orders = res; this.displayOrders = res.slice(0, 20); this.isLoading = false; },
      error: err => { this.errorMessage = 'Failed to load orders'; this.isLoading = false; }
    });
  }

  getProductName(id: number): string {
    const p = this.products.find(x => x.id === id);
    return p ? p.name : 'Unknown Product (' + id + ')';
  }

  getBadgeClass(status: string) {
    if(status === 'PROCESSING') return 'badge-blue';
    if(status === 'SHIPPED') return 'badge-orange';
    if(status === 'DELIVERED') return 'badge-green';
    return 'badge-gray'; // PENDING or default
  }

  addOrder() {
    this.errorMessage = ''; this.successMessage = '';
    if(!this.newOrder.customerName || !this.newOrder.productId || this.newOrder.quantity == null || this.newOrder.quantity <= 0) {
      this.errorMessage = 'Please provide valid customer details, select a product, and quantity > 0'; return;
    }
    this.isSaving = true;
    this.api.addOrder(this.newOrder).subscribe({
      next: () => {
        this.successMessage = 'Order placed successfully!';
        this.newOrder = { customerName: '', productId: null, quantity: null, status: 'PENDING' };
        this.loadOrders();
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: err => {
        this.errorMessage = 'Failed to place order (Backend validation failed)';
        this.isSaving = false;
      }
    });
  }

  updateStatus(id: number, newStatus: string) {
    this.api.updateOrderStatus(id, newStatus).subscribe({
      next: () => {
        this.successMessage = 'Order status updated!';
        this.loadOrders();
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: err => {
        this.errorMessage = 'Failed to update order status';
      }
    });
  }
}
