package com.supplychain.controller;

import com.supplychain.model.Order;
import com.supplychain.model.Product;
import com.supplychain.model.Warehouse;
import com.supplychain.repository.OrderRepository;
import com.supplychain.repository.ProductRepository;
import com.supplychain.repository.WarehouseRepository;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
public class SupplyChainController {

    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final OrderRepository orderRepository;

    // Cache computed forecast values to avoid recalculating on every request
    private final Map<Long, Double> forecastCache = new ConcurrentHashMap<>();

    public SupplyChainController(ProductRepository productRepository, 
                                 WarehouseRepository warehouseRepository, 
                                 OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.orderRepository = orderRepository;
    }

    // 1. Products
    @GetMapping("/products")
    public List<Product> getProducts() {
        return productRepository.findAll();
    }

    @PostMapping("/products")
    public Product addProduct(@Valid @RequestBody Product product) {
        return productRepository.save(product);
    }

    @GetMapping("/products/search")
    public List<Product> searchProducts(@RequestParam String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    // 2. Warehouses
    @GetMapping("/warehouses")
    public List<Warehouse> getWarehouses() {
        return warehouseRepository.findAll();
    }

    @PostMapping("/warehouses")
    public Warehouse addWarehouse(@Valid @RequestBody Warehouse warehouse) {
        return warehouseRepository.save(warehouse);
    }

    // 3. Orders
    @GetMapping("/orders")
    public List<Order> getOrders() {
        return orderRepository.findAll();
    }

    @PostMapping("/orders")
    public Order addOrder(@Valid @RequestBody Order order) {
        if (order.getStatus() == null || order.getStatus().trim().isEmpty()) {
            order.setStatus("PENDING");
        }
        forecastCache.clear(); // Wipe cache to refresh calculation
        return orderRepository.save(order);
    }

    @PutMapping("/orders/{id}/status")
    public Order updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        Order order = orderRepository.findById(id).orElseThrow();
        order.setStatus(status);
        forecastCache.clear(); // Wipe cache to refresh calculation
        return orderRepository.save(order);
    }

    // 4. Optimization
    @GetMapping("/optimization/route")
    public List<Warehouse> getRouteOptimization() {
        return warehouseRepository.findAll(); // mock response referencing existing logic
    }

    @GetMapping("/optimization/forecast")
    public Map<String, Object> getForecast(@RequestParam(required = false) Long productId) {
        Long cacheKey = productId != null ? productId : -1L;
        
        // Return from cache if present to prevent heavy math/db queries
        if (!forecastCache.containsKey(cacheKey)) {
            Double avg;
            if (productId != null) {
                avg = orderRepository.getAverageQuantityByProductId(productId);
            } else {
                avg = orderRepository.getGlobalAverageQuantity();
            }
            if (avg == null) avg = 120.0; // mock default if zero orders match
            forecastCache.put(cacheKey, avg);
        }

        Map<String, Object> forecast = new HashMap<>();
        forecast.put("productId", cacheKey == -1L ? 1 : cacheKey); // fallback format compatibility
        forecast.put("forecastedDemand", forecastCache.get(cacheKey));
        return forecast;
    }
}
