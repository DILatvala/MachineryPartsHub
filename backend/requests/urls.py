from django.urls import path

from .views import (
    ServiceRequestCsrfView,
    ServiceRequestCreateView,
    ServiceRequestListView,
    ServiceRequestLoginView,
    ServiceRequestLogoutView,
    ServiceRequestSessionView,
    ServiceRequestUpdateView,
)

urlpatterns = [
    path('requests/csrf/', ServiceRequestCsrfView.as_view(), name='request-csrf'),
    path('requests/', ServiceRequestCreateView.as_view(), name='request-create'),
    path('requests/login/', ServiceRequestLoginView.as_view(), name='request-login'),
    path('requests/logout/', ServiceRequestLogoutView.as_view(), name='request-logout'),
    path('requests/session/', ServiceRequestSessionView.as_view(), name='request-session'),
    path('requests/list/', ServiceRequestListView.as_view(), name='request-list'),
    path('requests/<int:pk>/', ServiceRequestUpdateView.as_view(), name='request-update'),
]
