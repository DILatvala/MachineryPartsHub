from django.contrib import admin

from .models import ServiceRequest


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'vehicle', 'part_or_service', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'phone', 'vehicle', 'part_or_service')
