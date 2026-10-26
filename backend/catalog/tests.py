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
