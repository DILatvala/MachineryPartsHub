from django.urls import path

from .views import (
    CategoryListView,
    PartDetailView,
    PartListView,
    PartManagementDetailView,
    PartManagementListView,
)

urlpatterns = [
    path('catalog/categories/', CategoryListView.as_view(), name='category-list'),
    path('catalog/manage/', PartManagementListView.as_view(), name='catalog-manage'),
    path('catalog/manage/<int:pk>/', PartManagementDetailView.as_view(), name='catalog-manage-detail'),
    path('catalog/', PartListView.as_view(), name='part-list'),
    path('catalog/<int:pk>/', PartDetailView.as_view(), name='part-detail'),
]
