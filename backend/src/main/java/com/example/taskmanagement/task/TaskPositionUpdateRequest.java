package com.example.taskmanagement.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public class TaskPositionUpdateRequest {

    @NotBlank(message = "ステータスは必須です")
    private String status;

    @PositiveOrZero(message = "indexは0以上である必要があります")
    private int index;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }
}
