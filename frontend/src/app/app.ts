import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-layout">
      <nav class="sidebar">
        <div class="logo">📦 SCO</div>
        <div class="links">
          <a routerLink="/dashboard" routerLinkActive="active">📊 Dashboard</a>
          <a routerLink="/products" routerLinkActive="active">🏷️ Products</a>
          <a routerLink="/warehouses" routerLinkActive="active">🏢 Warehouses</a>
          <a routerLink="/orders" routerLinkActive="active">🛒 Orders</a>
          <a routerLink="/optimization" routerLinkActive="active">🚀 Optimization</a>
        </div>
      </nav>
      <div class="main-content">
        <header class="topbar">
          <h2>Smart Supply Chain Optimizer</h2>
        </header>
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .app-layout { display: flex; height: 100vh; background-color: #f4f7f6; }
    .sidebar { width: 250px; background: #2c3e50; color: white; display: flex; flex-direction: column; }
    .logo { padding: 20px; outline: none; margin-bottom: 10px; font-size: 1.5rem; font-weight: bold; text-align: center; border-bottom: 1px solid #34495e; }
    .links { display: flex; flex-direction: column; }
    .links a { padding: 15px 20px; color: #ecf0f1; text-decoration: none; display: flex; align-items: center; gap: 10px; }
    .links a:hover, .links a.active { background: #34495e; border-left: 4px solid #3498db; }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar { background: white; padding: 20px 30px; border-bottom: 1px solid #e1e8ed; z-index: 10; }
    .topbar h2 { margin: 0; color: #2c3e50; font-size: 1.25rem; }
    .page-content { flex: 1; padding: 30px; overflow-y: auto; }

    ::ng-deep * { box-sizing: border-box; }
    ::ng-deep .card { background: white; border-radius: 8px; border: 1px solid #dde1e5; padding: 20px; margin-bottom: 20px; }
    ::ng-deep .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    ::ng-deep .btn[disabled] { opacity: 0.6; cursor: not-allowed; }
    ::ng-deep .btn-primary { background: #3498db; color: white; }
    ::ng-deep .btn-primary:hover:not([disabled]) { background: #2980b9; }
    ::ng-deep .btn-success { background: #2ecc71; color: white; }
    ::ng-deep .btn-success:hover:not([disabled]) { background: #27ae60; }
    ::ng-deep .form-control { padding: 10px; border: 1px solid #ddd; border-radius: 4px; outline: none; }
    ::ng-deep .form-control:focus { border-color: #3498db; }
    ::ng-deep .table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #eee; }
    ::ng-deep .table th, ::ng-deep .table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
    ::ng-deep .table th { background-color: #f8f9fa; color: #333; font-weight: 600; }
    ::ng-deep .table tr:hover { background-color: #f1f4f6; }
    ::ng-deep .alert { padding: 10px 15px; border-radius: 4px; margin-bottom: 20px; }
    ::ng-deep .alert-danger { background: #ffeded; color: #e74c3c; border-left: 4px solid #e74c3c; }
    ::ng-deep .alert-success { background: #eafaf1; color: #27ae60; border-left: 4px solid #27ae60; }
  `]
})
export class App {}
