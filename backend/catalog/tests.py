import tempfile
from io import BytesIO
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from PIL import Image

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

    def test_staff_can_upload_an_image_and_public_catalog_returns_its_url(self):
        image_buffer = BytesIO()
        Image.new('RGB', (2, 2), color='red').save(image_buffer, format='PNG')
        self.client.force_login(self.user)
        with tempfile.TemporaryDirectory() as media_root:
            with self.settings(
                DEBUG=True,
                MEDIA_ROOT=media_root,
                R2_STORAGE_ENABLED=False,
            ):
                response = self.client.post(
                    reverse('catalog-manage'),
                    {
                        'category': self.category.pk,
                        'name': 'Pump with image',
                        'description': 'Hydraulic pump',
                        'is_active': 'true',
                        'image': SimpleUploadedFile(
                            'pump.png',
                            image_buffer.getvalue(),
                            content_type='image/png',
                        ),
                    },
                )

                self.assertEqual(response.status_code, 201, response.content)
                self.assertIn('/media/catalog/', response.json()['image'])
                public_part = next(
                    item
                    for item in self.client.get(reverse('part-list')).json()
                    if item['id'] == response.json()['id']
                )
                self.assertEqual(public_part['image'], response.json()['image'])
                self.assertTrue(
                    next(Path(media_root).rglob('pump*.png')).is_file()
                )

    def test_staff_cannot_upload_a_non_image_file(self):
        self.client.force_login(self.user)
        response = self.client.post(
            reverse('catalog-manage'),
            {
                'category': self.category.pk,
                'name': 'Invalid image',
                'image': SimpleUploadedFile(
                    'notes.txt',
                    b'this is not an image',
                    content_type='text/plain',
                ),
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('image', response.json())

    def test_production_uploads_are_rejected_without_durable_object_storage(self):
        image_buffer = BytesIO()
        Image.new('RGB', (2, 2), color='blue').save(image_buffer, format='PNG')
        self.client.force_login(self.user)
        with self.settings(DEBUG=False, R2_STORAGE_ENABLED=False):
            response = self.client.post(
                reverse('catalog-manage'),
                {
                    'category': self.category.pk,
                    'name': 'Temporary image',
                    'image': SimpleUploadedFile(
                        'temporary.png',
                        image_buffer.getvalue(),
                        content_type='image/png',
                    ),
                },
            )

        self.assertEqual(response.status_code, 400)
        self.assertIn('persistent object storage', response.json()['image'][0])

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

        response = self.client.patch(
            reverse('catalog-manage-detail', args=[self.part.pk]),
            {'is_active': True},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.part.refresh_from_db()
        self.assertTrue(self.part.is_active)
        self.assertEqual(
            [part['id'] for part in self.client.get(reverse('part-list')).json()],
            [self.part.pk],
        )


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
