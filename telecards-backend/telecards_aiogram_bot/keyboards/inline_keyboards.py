from aiogram.types import InlineKeyboardMarkup, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config import WEB_APP_URL # Импортируем URL из конфига

def get_start_game_keyboard() -> InlineKeyboardMarkup:
    """
    Создает inline-клавиатуру с кнопкой для запуска Web App.
    """
    builder = InlineKeyboardBuilder()
    builder.button(
        text="🎮 Войти в игру TeleCards",
        web_app=WebAppInfo(url=WEB_APP_URL)
    )
    # Можно добавить больше кнопок, если нужно
    # builder.button(text="ℹ️ Правила", callback_data="rules")
    builder.adjust(1) # Расположить кнопки по одной в строке
    return builder.as_markup()