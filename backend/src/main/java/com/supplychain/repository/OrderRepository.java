package com.supplychain.repository;

import com.supplychain.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT AVG(o.quantity) FROM Order o WHERE o.productId = :productId")
    Double getAverageQuantityByProductId(@Param("productId") Long productId);

    @Query("SELECT AVG(o.quantity) FROM Order o")
    Double getGlobalAverageQuantity();
}
