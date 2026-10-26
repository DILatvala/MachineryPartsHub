from django.urls import path

from .views import CategoryListView, PartDetailView, PartListView

urlpatterns = [
    path('catalog/categories/', CategoryListView.as_view(), name='category-list'),
    path('catalog/', PartListView.as_view(), name='part-list'),
    path('catalog/<int:pk>/', PartDetailView.as_view(), name='part-detail'),
]
