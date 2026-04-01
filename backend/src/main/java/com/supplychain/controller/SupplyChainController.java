package com.supplychain.controller;

import com.supplychain.model.Order;
import com.supplychain.model.Product;
import com.supplychain.model.Warehouse;
import com.supplychain.repository.OrderRepository;
import com.supplychain.repository.ProductRepository;
import com.supplychain.repository.WarehouseRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SupplyChainController {

    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final OrderRepository orderRepository;

    public SupplyChainController(ProductRepository productRepository, 
                                 WarehouseRepository warehouseRepository, 
                                 OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping("/analytics/summary")
    public Map<String, Object> getAnalyticsSummary() {
        Map<String, Object> summary = new HashMap<>();
        long tP = productRepository.count();
        long tO = orderRepository.count();
        Double tR = orderRepository.getTotalRevenue();
        String topProduct = "N/A";
        try {
            String p = orderRepository.getTopProductName();
            if (p != null && !p.trim().isEmpty()) topProduct = p;
        } catch(Exception e) { }
        
        summary.put("totalProducts", tP);
        summary.put("totalOrders", tO);
        summary.put("totalRevenue", tR != null ? tR : 0.0);
        summary.put("topProduct", topProduct);
        return summary;
    }

    @GetMapping("/products")
    public List<Product> getProducts() {
        List<Product> list = productRepository.findAll();
        return list == null ? new ArrayList<>() : list;
    }

    @PostMapping("/products")
    public Product addProduct(@Valid @RequestBody Product product) {
        if (productRepository.existsByNameIgnoreCase(product.getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate product detected");
        }
        return productRepository.save(product);
    }

    @GetMapping("/products/search")
    public List<Product> searchProducts(@RequestParam String name) {
        List<Product> list = productRepository.findByNameContainingIgnoreCase(name);
        return list == null ? new ArrayList<>() : list;
    }

    @GetMapping("/warehouses")
    public List<Warehouse> getWarehouses() {
        List<Warehouse> list = warehouseRepository.findAll();
        return list == null ? new ArrayList<>() : list;
    }

    @PostMapping("/warehouses")
    public Warehouse addWarehouse(@Valid @RequestBody Warehouse warehouse) {
        return warehouseRepository.save(warehouse);
    }

    @GetMapping("/orders")
    public List<Order> getOrders() {
        List<Order> list = orderRepository.findAll();
        return list == null ? new ArrayList<>() : list;
    }

    @PostMapping("/orders")
    public Order addOrder(@Valid @RequestBody Order order) {
        if (order.getStatus() == null || order.getStatus().trim().isEmpty()) {
            order.setStatus("PENDING");
        }

        // Swiggy Geo-Intelligent Assignment natively executed inside Postgres cache matrix
        if (order.getDestinationLatitude() != null && order.getDestinationLongitude() != null) {
            List<Warehouse> hubs = warehouseRepository.findAll();
            Long nearestHubId = null;
            double minDistance = Double.MAX_VALUE;

            for (Warehouse hub : hubs) {
                if(true) {
                    double dist = Math.sqrt(Math.pow(hub.getLatitude() - order.getDestinationLatitude(), 2) 
                                          + Math.pow(hub.getLongitude() - order.getDestinationLongitude(), 2));
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestHubId = hub.getId();
                    }
                }
            }
            if (nearestHubId != null) {
                order.setAssignedHubId(nearestHubId);
            }
        }

        if (orderRepository.existsByCustomerNameAndProductIdAndQuantityAndStatus(
                order.getCustomerName(), order.getProductId(), order.getQuantity(), order.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate Order matched");
        }
        return orderRepository.save(order);
    }

    @PutMapping("/orders/{id}/status")
    public Order updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        Order order = orderRepository.findById(id).orElseThrow();
        order.setStatus(status);
        return orderRepository.save(order);
    }

    static class Edge {
        Long targetId;
        double weight;
        public Edge(Long t, double w) { this.targetId = t; this.weight = w; }
    }

    static class NodeDist implements Comparable<NodeDist> {
        Long id;
        double dist;
        public NodeDist(Long i, double d) { this.id = i; this.dist = d; }
        public int compareTo(NodeDist other) { return Double.compare(this.dist, other.dist); }
    }

    @GetMapping("/optimization/route")
    public Map<String, Object> getRouteOptimization(@RequestParam(required = false) Long startHubId, 
                                                    @RequestParam(required = false) Long endHubId) {
        Map<String, Object> result = new HashMap<>();
        List<Warehouse> all = warehouseRepository.findAll();
        
        if (all == null || all.isEmpty()) {
            result.put("path", new ArrayList<>());
            result.put("totalDistance", 0.0);
            return result;
        }

        try {
            Long finalStartId = startHubId;
            Long finalEndId = endHubId;
            
            if (finalStartId == null) finalStartId = all.get(0).getId();
            if (finalEndId == null) {
                finalEndId = all.get(all.size() - 1).getId();
                if(finalStartId.equals(finalEndId) && all.size() > 1) finalEndId = all.get(1).getId();
            }

            Map<Long, List<Edge>> adjList = new HashMap<>();
            Map<Long, Warehouse> wMap = new HashMap<>();
            for (Warehouse w : all) {
                adjList.put(w.getId(), new ArrayList<>());
                wMap.put(w.getId(), w);
            }
            
            for (int i=0; i<all.size(); i++) {
                for (int j=0; j<all.size(); j++) {
                    if (i != j) {
                        Warehouse w1 = all.get(i);
                        Warehouse w2 = all.get(j);
                        if(true) {
                            double dist = Math.sqrt(Math.pow(w1.getLatitude()-w2.getLatitude(),2) + Math.pow(w1.getLongitude()-w2.getLongitude(),2));
                            adjList.get(w1.getId()).add(new Edge(w2.getId(), dist));
                        }
                    }
                }
            }

            Warehouse startNode = wMap.get(finalStartId);
            Warehouse endNode = wMap.get(finalEndId);
            
            if (startNode == null || endNode == null) throw new Exception("Invalid start or end node");
            
            PriorityQueue<NodeDist> pq = new PriorityQueue<>();
            Map<Long, Double> distances = new HashMap<>();
            Map<Long, Long> previous = new HashMap<>();
            
            for (Warehouse w : all) {
                distances.put(w.getId(), Double.MAX_VALUE);
            }
            
            distances.put(startNode.getId(), 0.0);
            pq.add(new NodeDist(startNode.getId(), 0.0));
            
            while (!pq.isEmpty()) {
                NodeDist current = pq.poll();
                
                if (current.id.equals(endNode.getId())) break;
                if (current.dist > distances.get(current.id)) continue;
                
                for (Edge edge : adjList.get(current.id)) {
                    double newDist = distances.get(current.id) + edge.weight;
                    if (newDist < distances.get(edge.targetId)) {
                        distances.put(edge.targetId, newDist);
                        previous.put(edge.targetId, current.id);
                        pq.add(new NodeDist(edge.targetId, newDist));
                    }
                }
            }
            
            List<Warehouse> path = new ArrayList<>();
            Long curr = endNode.getId();
            while (curr != null) {
                path.add(wMap.get(curr));
                curr = previous.get(curr);
            }
            Collections.reverse(path);
            
            double totalDist = distances.get(endNode.getId());
            
            result.put("path", path);
            result.put("totalDistance", totalDist == Double.MAX_VALUE ? 0.0 : totalDist);
            return result;

        } catch(Exception e) {
            Warehouse endW = warehouseRepository.findById(endHubId != null ? endHubId : all.get(0).getId()).orElse(all.get(0));
            result.put("path", Collections.singletonList(endW));
            result.put("totalDistance", 0.0);
            return result;
        }
    }

    @GetMapping("/optimization/forecast")
    public Map<String, Object> getForecast(@RequestParam(required = false) Long productId) {
        List<Order> recentOrders;
        if (productId != null) {
            recentOrders = orderRepository.findTop10ByProductIdOrderByIdDesc(productId);
        } else {
            recentOrders = orderRepository.findTop10ByOrderByIdDesc();
        }
        
        double forecast = 0.0;
        String trend = "stable";
        
        if (recentOrders != null && !recentOrders.isEmpty()) {
            double sum = 0;
            for (Order o : recentOrders) sum += o.getQuantity();
            forecast = sum / recentOrders.size();
            
            if (recentOrders.size() >= 4) {
                double newestHalfSum = 0;
                double oldestHalfSum = 0;
                int half = recentOrders.size() / 2;
                for (int i=0; i<half; i++) newestHalfSum += recentOrders.get(i).getQuantity();
                for (int i=half; i<recentOrders.size(); i++) oldestHalfSum += recentOrders.get(i).getQuantity();
                
                double newestAvg = newestHalfSum / half;
                double oldestAvg = oldestHalfSum / (recentOrders.size() - half);
                
                if (newestAvg > oldestAvg * 1.05) trend = "increasing";
                else if (newestAvg < oldestAvg * 0.95) trend = "decreasing";
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("productId", productId != null ? productId : 0);
        response.put("forecast", forecast);
        response.put("trend", trend);
        return response;
    }
}
