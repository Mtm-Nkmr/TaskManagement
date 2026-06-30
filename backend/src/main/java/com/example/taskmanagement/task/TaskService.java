package com.example.taskmanagement.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    public List<Task> findAll() {
        return taskRepository.findAll();
    }

    public Optional<Task> findById(Long id) {
        return taskRepository.findById(id);
    }

    public Task create(TaskCreateRequest request) {
        int maxSortOrder = taskRepository.findMaxSortOrderByStatus(request.getStatus());

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setStatus(request.getStatus());
        task.setDueDate(request.getDueDate());
        task.setSortOrder(maxSortOrder + 1);

        return taskRepository.save(task);
    }
}
