package com.supplychain.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Customer name cannot be empty")
    private String customerName;

    private Long productId;

    @Positive(message = "Quantity must be > 0")
    private int quantity;

    private String status;

    private Double destinationLatitude;
    private Double destinationLongitude;
    private Long assignedHubId;

    public Order() {}

    public Order(String customerName, Long productId, int quantity, String status) {
        this.customerName = customerName;
        this.productId = productId;
        this.quantity = quantity;
        this.status = status;
    }

    public Order(String customerName, Long productId, int quantity, String status, Double lat, Double lng) {
        this.customerName = customerName;
        this.productId = productId;
        this.quantity = quantity;
        this.status = status;
        this.destinationLatitude = lat;
        this.destinationLongitude = lng;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Double getDestinationLatitude() { return destinationLatitude; }
    public void setDestinationLatitude(Double destinationLatitude) { this.destinationLatitude = destinationLatitude; }
    public Double getDestinationLongitude() { return destinationLongitude; }
    public void setDestinationLongitude(Double destinationLongitude) { this.destinationLongitude = destinationLongitude; }
    public Long getAssignedHubId() { return assignedHubId; }
    public void setAssignedHubId(Long assignedHubId) { this.assignedHubId = assignedHubId; }
}
