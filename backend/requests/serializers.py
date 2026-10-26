import re

from rest_framework import serializers

from .models import ServiceRequest


class ServiceRequestSerializer(serializers.ModelSerializer):
    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Name must contain at least 2 characters.')
        return value.strip()

    def validate_phone(self, value):
        if not re.fullmatch(r'^\+?[\d\s()-]{7,}$', value.strip()):
            raise serializers.ValidationError('Enter a valid phone number.')
        return value.strip()

    def validate_vehicle(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Please include vehicle make, model, and year.')
        return value.strip()

    def validate_part_or_service(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Please describe the part or service you need.')
        return value.strip()

    class Meta:
        model = ServiceRequest
        fields = [
            'id',
            'name',
            'phone',
            'vehicle',
            'part_or_service',
            'notes',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
