from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

from .models import ServiceRequest


class ServiceRequestAPITest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='manager',
            password='manager123',
            is_staff=True,
        )

    def test_create_request_returns_201(self):
        payload = {
            'name': 'Ivan Petrov',
            'phone': '+7 999 123 45 67',
            'vehicle': 'Toyota Camry 2021',
            'part_or_service': 'Brake pads',
            'notes': 'Need same day response',
        }

        response = self.client.post(reverse('request-create'), payload, content_type='application/json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ServiceRequest.objects.count(), 1)
        self.assertEqual(ServiceRequest.objects.get().status, 'new')

    def test_csrf_endpoint_returns_token_and_sets_cookie(self):
        response = self.client.get(reverse('request-csrf'))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['csrfToken'])
        self.assertIn('csrftoken', response.cookies)

    def test_list_requests_returns_all_requests(self):
        self.client.force_login(self.user)

        ServiceRequest.objects.create(
            name='Alice',
            phone='+1 555 0000',
            vehicle='Honda Civic 2019',
            part_or_service='Oil filter',
        )
        ServiceRequest.objects.create(
            name='Bob',
            phone='+1 555 1111',
            vehicle='Ford Focus 2020',
            part_or_service='Battery',
            status='pending',
        )

        response = self.client.get(reverse('request-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_patch_request_updates_status(self):
        self.client.force_login(self.user)

        request = ServiceRequest.objects.create(
            name='Charlie',
            phone='+1 555 2222',
            vehicle='BMW X5 2022',
            part_or_service='Diagnostic',
        )

        response = self.client.patch(
            reverse('request-update', args=[request.pk]),
            {'status': 'completed'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        request.refresh_from_db()
        self.assertEqual(request.status, 'completed')

    def test_invalid_request_is_rejected(self):
        payload = {
            'name': 'A',
            'phone': 'bad',
            'vehicle': 'Car',
            'part_or_service': 'Brake pads',
        }

        response = self.client.post(reverse('request-create'), payload, content_type='application/json')

        self.assertEqual(response.status_code, 400)

    def test_manager_login_success(self):
        response = self.client.post(
            reverse('request-login'),
            {'username': 'manager', 'password': 'manager123'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['detail'])
        self.assertTrue(self.client.session.get('_auth_user_id'))

    def test_manager_login_rejects_invalid_credentials(self):
        response = self.client.post(
            reverse('request-login'),
            {'username': 'manager', 'password': 'wrong-password'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 401)

    def test_honeypot_field_rejected(self):
        payload = {
            'name': 'Test User',
            'phone': '+1 555 123 4567',
            'vehicle': 'Audi A4 2022',
            'part_or_service': 'Brakes',
            'website': 'https://example.com',
        }

        response = self.client.post(reverse('request-create'), payload, content_type='application/json')

        self.assertEqual(response.status_code, 400)

    def test_rate_limit_blocks_repeated_requests(self):
        cache.clear()
        cache.set('service-request:127.0.0.1', 5, timeout=60)

        response = self.client.post(
            reverse('request-create'),
            {
                'name': 'Rate Limit',
                'phone': '+1 555 000 0001',
                'vehicle': 'Ford Mustang 2021',
                'part_or_service': 'Oil change',
            },
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 429)
