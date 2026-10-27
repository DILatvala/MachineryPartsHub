from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Part
from .serializers import CategorySerializer, PartSerializer


class CategoryListView(APIView):
    def get(self, request):
        queryset = Category.objects.all()
        serializer = CategorySerializer(queryset, many=True)
        return Response(serializer.data)


class PartListView(APIView):
    def get(self, request):
        queryset = Part.objects.filter(is_active=True).select_related('category')

        category = request.query_params.get('category')
        search = request.query_params.get('q', '').strip()

        if category:
            queryset = queryset.filter(category__name__icontains=category)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(brand__icontains=search)
                | Q(equipment_model__icontains=search)
                | Q(category__name__icontains=search)
            )

        brand = request.query_params.get('brand', '').strip()
        equipment_model = request.query_params.get('model', '').strip()
        if brand:
            queryset = queryset.filter(brand__icontains=brand)
        if equipment_model:
            queryset = queryset.filter(equipment_model__icontains=equipment_model)

        serializer = PartSerializer(queryset, many=True)
        return Response(serializer.data)


class PartDetailView(APIView):
    def get(self, request, pk):
        try:
            part = Part.objects.select_related('category').get(pk=pk, is_active=True)
        except Part.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        serializer = PartSerializer(part)
        return Response(serializer.data)


class PartManagementListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = Part.objects.select_related('category')
        serializer = PartSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PartSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PartManagementDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            part = Part.objects.get(pk=pk)
        except Part.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PartSerializer(part, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            part = Part.objects.get(pk=pk)
        except Part.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        part.is_active = False
        part.save(update_fields=['is_active', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
