package com.supplychain;

import com.supplychain.model.Order;
import com.supplychain.model.Product;
import com.supplychain.model.Warehouse;
import com.supplychain.repository.OrderRepository;
import com.supplychain.repository.ProductRepository;
import com.supplychain.repository.WarehouseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public CommandLineRunner loadData(ProductRepository productRepository,
                                      WarehouseRepository warehouseRepository,
                                      OrderRepository orderRepository) {
        return args -> {
            // Insert 3 products
            Product p1 = new Product("Industrial Sensor", 250.0);
            Product p2 = new Product("Conveyor Belt Assembly", 1500.0);
            Product p3 = new Product("Hydraulic Pump", 450.0);
            productRepository.save(p1);
            productRepository.save(p2);
            productRepository.save(p3);

            // Insert 2 warehouses
            Warehouse w1 = new Warehouse("Central Hub", 40.7128, -74.0060);
            Warehouse w2 = new Warehouse("West Coast Facility", 34.0522, -118.2437);
            warehouseRepository.save(w1);
            warehouseRepository.save(w2);

            // Insert 1 sample order
            Order o1 = new Order("Acme Corp", p1.getId(), 50, "DELIVERED");
            orderRepository.save(o1);
        };
    }
}
