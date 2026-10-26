# Project Structure

```text
machinerypartshub/
├── backend/
│   ├── apps/
│   │   ├── catalog/
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   └── views.py
│   │   └── requests/
│   │       ├── admin.py
│   │       ├── apps.py
│   │       ├── models.py
│   │       ├── serializers.py
│   │       ├── urls.py
│   │       └── views.py
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
├── docs/
│   ├── plan.md
│   ├── task.md
│   └── deployment.md
├── .gitignore
├── README.md
└── docker-compose.yml
```

## Responsibilities

### backend/
Handles database models, API endpoints, validation, admin, and authentication.

### frontend/
Handles UI, catalog search, filtering, request submission, and responsive layout.

### docs/
Contains architecture and deployment notes for the team.
