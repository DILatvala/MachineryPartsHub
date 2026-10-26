from django.db.models import Q
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
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))

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
