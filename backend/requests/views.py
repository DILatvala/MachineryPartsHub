from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ServiceRequest
from .serializers import ServiceRequestSerializer


class ServiceRequestCsrfView(APIView):
    def get(self, request):
        return Response({'csrfToken': get_token(request)})


class ServiceRequestCreateView(APIView):
    def post(self, request):
        client_ip = request.META.get('REMOTE_ADDR', 'unknown')
        rate_limit_key = f'service-request:{client_ip}'
        request_count = cache.get(rate_limit_key, 0)

        if request_count >= 5:
            return Response({'detail': 'Too many requests. Please try again in a minute.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        honeypot = request.data.get('website') or request.data.get('company') or request.data.get('hp')
        if honeypot and str(honeypot).strip():
            return Response({'detail': 'Invalid submission.'}, status=status.HTTP_400_BAD_REQUEST)

        cache.set(rate_limit_key, request_count + 1, timeout=60)

        serializer = ServiceRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceRequestListView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = ServiceRequest.objects.all()
        serializer = ServiceRequestSerializer(queryset, many=True)
        return Response(serializer.data)


class ServiceRequestUpdateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            service_request = ServiceRequest.objects.get(pk=pk)
        except ServiceRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ServiceRequestSerializer(service_request, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceRequestLoginView(APIView):
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        user = authenticate(request, username=username, password=password)
        if user is None or not user.is_staff:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        login(request, user)
        return Response({'detail': 'Authenticated.', 'username': user.username})


class ServiceRequestLogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'detail': 'Logged out.'})


class ServiceRequestSessionView(APIView):
    def get(self, request):
        if request.user.is_authenticated and request.user.is_staff:
            return Response({'authenticated': True, 'username': request.user.username})
        return Response({'authenticated': False}, status=status.HTTP_401_UNAUTHORIZED)
