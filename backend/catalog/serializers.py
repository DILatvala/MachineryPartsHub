from rest_framework import serializers

from .models import Category, Part


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class PartSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()

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
            'is_active',
        ]

    def get_category_name(self, obj):
        return obj.category.name
