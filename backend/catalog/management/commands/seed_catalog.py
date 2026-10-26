from django.core.management.base import BaseCommand

from catalog.models import Category, Part


class Command(BaseCommand):
    help = 'Seed the catalog with demo automotive parts and service entries.'

    def handle(self, *args, **options):
        catalog = {
            'Двигатель': [
                ('Свечи зажигания', 'Комплект свечей для стабильного запуска и работы двигателя.'),
                ('Ремень ГРМ', 'Надёжный ремень для синхронизации работы двигателя.'),
                ('Топливный фильтр', 'Фильтр для очистки топлива и защиты системы впрыска.'),
            ],
            'Тормоза': [
                ('Тормозные колодки', 'Комплект колодок для ровного и безопасного торможения.'),
                ('Тормозной диск', 'Диск для замены при износе и вибрации.'),
            ],
            'Фильтры': [
                ('Масляный фильтр', 'Фильтр для очистки моторного масла.'),
                ('Воздушный фильтр', 'Улучшает работу двигателя и снижает нагрузку на систему.'),
            ],
            'Подвеска': [
                ('Амортизатор', 'Демпфер для комфортной и стабильной езды.'),
                ('Рычаг подвески', 'Элемент для точного управления ходовой частью.'),
            ],
            'Электрика': [
                ('Аккумулятор', 'Надёжный источник питания для автомобиля в любой сезон.'),
                ('Стартер', 'Электромеханизм запуска двигателя.'),
            ],
            'Сервис': [
                ('Диагностика', 'Комплексная проверка электроники, двигателя и ходовой части.'),
                ('Ремонт подвески', 'Профессиональная диагностика и восстановление ходовой.'),
            ],
        }

        created = 0
        for category_name, parts in catalog.items():
            category, _ = Category.objects.get_or_create(name=category_name)
            for part_name, description in parts:
                _, part_created = Part.objects.get_or_create(
                    category=category,
                    name=part_name,
                    defaults={'description': description, 'is_active': True},
                )
                if part_created:
                    created += 1

        self.stdout.write(self.style.SUCCESS(f'Seeded catalog entries: {created} new parts.'))
