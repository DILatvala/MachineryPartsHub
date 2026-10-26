from django.core.management.base import BaseCommand

from requests.models import ServiceRequest


class Command(BaseCommand):
    help = 'Seed demo service requests for the manager dashboard.'

    def handle(self, *args, **options):
        demo_requests = [
            {
                'name': 'Иван Петров',
                'phone': '+7 (921) 555-0101',
                'vehicle': 'Toyota Camry 2021',
                'part_or_service': 'Тормозные колодки',
                'notes': 'Нужно быстро проверить наличие и срок поставки.',
                'status': 'new',
            },
            {
                'name': 'Мария Смирнова',
                'phone': '+7 (901) 555-0199',
                'vehicle': 'Volkswagen Golf 2019',
                'part_or_service': 'Диагностика двигателя',
                'notes': 'Проблема с нестабильной работой на холостом ходу.',
                'status': 'pending',
            },
            {
                'name': 'Алексей Кузнецов',
                'phone': '+7 (912) 555-0188',
                'vehicle': 'Skoda Octavia 2020',
                'part_or_service': 'Аккумулятор',
                'notes': 'Требуется замена перед сезоном.',
                'status': 'completed',
            },
        ]

        created = 0
        for payload in demo_requests:
            _, created_flag = ServiceRequest.objects.get_or_create(
                name=payload['name'],
                phone=payload['phone'],
                vehicle=payload['vehicle'],
                part_or_service=payload['part_or_service'],
                defaults={'notes': payload['notes'], 'status': payload['status']},
            )
            if created_flag:
                created += 1

        self.stdout.write(self.style.SUCCESS(f'Seeded demo requests: {created} new entries.'))
