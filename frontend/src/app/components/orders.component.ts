import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display:flex; gap:20px; min-height: 600px;">

      <!-- RIGHT SIDE FORM PART (FIXED SECTION ONLY SHOWN) -->
      <div class="card" style="flex:1.2; display:flex; flex-direction:column;">
        <h3>🛒 Order Control Center</h3>

        <div style="padding:18px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">

            <input class="form-control" [(ngModel)]="newOrder.customerName" placeholder="Customer Name" />

            <!-- ✅ FIXED DROPDOWN -->
            <select class="form-control" [(ngModel)]="newOrder.productId">
              <option [ngValue]="null" disabled>Select Product</option>

              <option *ngFor="let p of products; trackBy: trackById" [ngValue]="p.id">
                {{ p.name }} — {{ p.price | currency }}
              </option>

            </select>

            <input class="form-control" type="number" [(ngModel)]="newOrder.quantity" placeholder="Quantity" />

          </div>

          <button class="btn btn-primary" (click)="addOrder()">Submit</button>
        </div>
      </div>
    </div>
  `
})
export class OrdersComponent implements OnInit {

  products: any[] = [];
  orders: any[] = [];

  newOrder: any = {
    customerName: '',
    productId: null,
    quantity: null
  };

  constructor(private api: ApiService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.api.getProducts().subscribe(res => this.products = res || []);
  }

  trackById(_: number, item: any) {
    return item.id;
  }

  addOrder() {
    console.log('Order:', this.newOrder);
  }
}