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

    def test_category_list_returns_categories(self):
        response = self.client.get(reverse('category-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['name'], 'Brakes')


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
