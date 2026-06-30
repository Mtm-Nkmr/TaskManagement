package com.example.taskmanagement.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public class TaskCreateRequest {

    @NotBlank(message = "タイトルは必須です")
    private String title;

    @Pattern(regexp = "todo|in_progress", message = "statusはtodoまたはin_progressを指定してください")
    private String status = "todo";

    private LocalDate dueDate;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
}
