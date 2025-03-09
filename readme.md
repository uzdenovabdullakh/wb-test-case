**Инструкция по настройке и запуску приложения**

В корне проекта находится файл .env.example. Скопируйте его в новый файл .env, чтобы настроить окружение для приложения.
Заполните .env файл:
- **API_KEY** - ваш API ключ для доступа к данным WB API.
- **GOOGLE_PRIVATE_KEY** - private_key из Google Cloud Console. (пр.:-----BEGIN PRIVATE KEY-----\n PRIVATE KEY\n-----END PRIVATE KEY-----\n)
- **GOOGLE_CLIENT_EMAIL** - client_email из Google Cloud Console. (пр.:sheets-api-bot@your-project-id.iam.gserviceaccount.com )
- **GOOGLE_PROJECT_ID** - project_id из Google Cloud Console. (пр.: your-project-id)
- **GOOGLE_SPREADSHEET_IDS** - здесь через запятую указываются ID ваших таблиц, которые можно получить из URL.
Например:
URL: https://docs.google.com/spreadsheets/d/1RAO7kwOlSIgt7J6_XIK6nex1nXIWZb0NNdVjqB74dvM/edit
GOOGLE_SPREADSHEET_IDS:1RAO7kwOlSIgt7J6_XIK6nex1nXIWZb0NNdVjqB74dvM

Соберите и запустите контейнер с помощью Docker Compose:
docker compose up --build