package com.example.taskmanagement.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("SELECT COALESCE(MAX(t.sortOrder), -1) FROM Task t WHERE t.status = :status")
    int findMaxSortOrderByStatus(@Param("status") String status);
}
