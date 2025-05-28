from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    bot_token: str
    web_app_url: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        extra='ignore'
    )

# Загружаем конфигурацию
try:
    settings = Settings()
except Exception as e:
    print(f"Ошибка при загрузке конфигурации: {e}")
    print("Убедитесь, что файл .env существует и содержит BOT_TOKEN и WEB_APP_URL.")
    exit()

# Для удобного доступа к настройкам
BOT_TOKEN = settings.bot_token
WEB_APP_URL = settings.web_app_url