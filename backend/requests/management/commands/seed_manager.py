import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Create a default manager account for the protected admin dashboard.'

    def handle(self, *args, **options):
        username = os.getenv('MANAGER_USERNAME', '').strip()
        password = os.getenv('MANAGER_PASSWORD', '')
        if not username or not password:
            raise CommandError('Set MANAGER_USERNAME and MANAGER_PASSWORD before creating the manager account.')

        User = get_user_model()

        user, created = User.objects.get_or_create(username=username)
        user.is_staff = True
        user.is_superuser = False
        user.set_password(password)
        user.save()

        action = 'created' if created else 'updated'
        self.stdout.write(self.style.SUCCESS(f'{action} manager account: {username}'))
