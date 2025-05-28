import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode

# Импортируем конфигурацию и роутеры
from config import BOT_TOKEN
from handlers import user_handlers # Импортируем роутер из user_handlers

async def main() -> None:
    # Инициализация бота
    bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)

    # Инициализация диспетчера
    # В aiogram 3.x рекомендуется передавать свои аргументы в обработчики через dp['key'] = value
    # или используя middleware, если это общие данные для многих обработчиков.
    dp = Dispatcher()

    # Подключение роутеров
    # Все обработчики из user_handlers будут зарегистрированы в диспетчере
    dp.include_router(user_handlers.router)
    # Если у вас будут другие группы обработчиков (например, для админов),
    # создайте для них отдельные роутеры и подключите их здесь.
    # dp.include_router(admin_handlers.router)

    # Настройка логирования
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
        stream=sys.stdout, # выводить логи в stdout
    )
    logging.info("Запуск бота TeleCards...")

    # Пропускаем накопленные входящие сообщения, чтобы бот не отвечал на старые команды
    await bot.delete_webhook(drop_pending_updates=True)

    # Запуск опроса (polling)
    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close() # Корректное закрытие сессии бота
        logging.info("Бот TeleCards остановлен.")

if __name__ == "__main__":
    asyncio.run(main())