from django.conf import settings
from rest_framework import serializers

from .models import Category, Part


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class PartSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_empty_file=False)

    class Meta:
        model = Part
        fields = [
            'id',
            'name',
            'description',
            'category',
            'category_name',
            'brand',
            'equipment_model',
            'image',
            'is_active',
        ]

    def validate_image(self, image):
        if not settings.DEBUG and not settings.R2_STORAGE_ENABLED:
            raise serializers.ValidationError(
                'Configure persistent object storage before uploading images in production.'
            )
        if image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Image files must be 5 MB or smaller.')
        return image

    def get_category_name(self, obj):
        return obj.category.name
