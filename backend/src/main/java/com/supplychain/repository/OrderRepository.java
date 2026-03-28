package com.supplychain.repository;

import com.supplychain.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    @Query("SELECT COALESCE(AVG(o.quantity), 0.0) FROM Order o WHERE o.productId = :productId")
    Double getAverageQuantityByProductId(@Param("productId") Long productId);

    @Query("SELECT COALESCE(AVG(o.quantity), 0.0) FROM Order o")
    Double getGlobalAverageQuantity();

    @Query("SELECT COALESCE(SUM(o.quantity * p.price), 0.0) FROM Order o JOIN Product p ON o.productId = p.id")
    Double getTotalRevenue();

    @Query(value = "SELECT p.name FROM orders o JOIN product p ON o.product_id = p.id GROUP BY p.name ORDER BY COUNT(o.id) DESC LIMIT 1", nativeQuery = true)
    String getTopProductName();

    boolean existsByCustomerNameAndProductIdAndQuantityAndStatus(String customerName, Long productId, int quantity, String status);

    List<Order> findTop10ByProductIdOrderByIdDesc(Long productId);
    List<Order> findTop10ByOrderByIdDesc();
}
