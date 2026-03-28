import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard.component';
import { ProductsComponent } from './components/products.component';
import { WarehousesComponent } from './components/warehouses.component';
import { OrdersComponent } from './components/orders.component';
import { OptimizationComponent } from './components/optimization.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'warehouses', component: WarehousesComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'optimization', component: OptimizationComponent }
];
