from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse

from .models import Category, Part


class CatalogAPITest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Brakes')
        Part.objects.create(
            category=self.category,
            name='Brake pads',
            description='Ceramic brake pads for passenger vehicles.',
            brand='Acme',
            equipment_model='EX200',
            is_active=True,
        )
        Part.objects.create(
            category=self.category,
            name='Rear disc',
            description='Rear brake disc replacement.',
            is_active=False,
        )

    def test_catalog_list_returns_only_active_parts(self):
        response = self.client.get(reverse('part-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['name'], 'Brake pads')
        self.assertEqual(response.json()[0]['category_name'], 'Brakes')

    def test_catalog_search_matches_brand_and_equipment_model(self):
        response = self.client.get(reverse('part-list'), {'q': 'EX200'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['name'] for item in response.json()], ['Brake pads'])

        response = self.client.get(reverse('part-list'), {'brand': 'acme'})
        self.assertEqual([item['name'] for item in response.json()], ['Brake pads'])

    def test_category_list_returns_categories(self):
        response = self.client.get(reverse('category-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['name'], 'Brakes')


class CatalogManagementAPITest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Hydraulics')
        self.part = Part.objects.create(
            category=self.category,
            name='Pump',
            description='Hydraulic pump',
            brand='Acme',
            equipment_model='EX200',
        )
        self.user = get_user_model().objects.create_user(
            username='manager',
            password='manager123',
            is_staff=True,
        )

    def test_catalog_management_requires_staff(self):
        response = self.client.get(reverse('catalog-manage'))

        self.assertEqual(response.status_code, 403)

    def test_staff_can_create_part_with_brand_and_model(self):
        self.client.force_login(self.user)
        response = self.client.post(
            reverse('catalog-manage'),
            {
                'category': self.category.pk,
                'name': 'Filter',
                'description': 'Hydraulic filter',
                'brand': 'PartsCo',
                'equipment_model': 'D6',
                'is_active': True,
            },
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['brand'], 'PartsCo')
        self.assertEqual(response.json()['equipment_model'], 'D6')

    def test_staff_can_update_and_archive_part(self):
        self.client.force_login(self.user)
        response = self.client.patch(
            reverse('catalog-manage-detail', args=[self.part.pk]),
            {'brand': 'Updated Brand'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['brand'], 'Updated Brand')

        response = self.client.delete(
            reverse('catalog-manage-detail', args=[self.part.pk])
        )
        self.assertEqual(response.status_code, 204)
        self.part.refresh_from_db()
        self.assertFalse(self.part.is_active)


class SeedCatalogCommandTest(TestCase):
    def test_seed_replaces_legacy_demo_parts_without_deactivating_custom_parts(self):
        legacy_category = Category.objects.create(name='Тормоза')
        legacy_part = Part.objects.create(
            category=legacy_category,
            name='Тормозные колодки',
            description='Legacy demo part.',
        )
        custom_part = Part.objects.create(
            category=legacy_category,
            name='Custom manager part',
            description='Manager-maintained part.',
        )

        call_command('seed_catalog')

        legacy_part.refresh_from_db()
        custom_part.refresh_from_db()
        self.assertFalse(legacy_part.is_active)
        self.assertTrue(custom_part.is_active)
        self.assertTrue(
            Part.objects.filter(
                category__name='Гидравлика',
                name='Гидронасосы',
                is_active=True,
            ).exists()
        )
