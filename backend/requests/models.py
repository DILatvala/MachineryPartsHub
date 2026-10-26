from django.db import models


class ServiceRequest(models.Model):
    STATUS_NEW = 'new'
    STATUS_PENDING = 'pending'
    STATUS_COMPLETED = 'completed'

    STATUS_CHOICES = [
        (STATUS_NEW, 'New'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=32)
    vehicle = models.CharField(max_length=200)
    part_or_service = models.CharField(max_length=300)
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NEW)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} — {self.part_or_service}'
