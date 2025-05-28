from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message
from aiogram.utils.markdown import hbold

from keyboards.inline_keyboards import get_start_game_keyboard

# Создаем роутер для пользовательских команд
router = Router()

@router.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    """
    Этот обработчик будет вызван при команде /start
    """
    user_name = message.from_user.full_name
    welcome_text = (
        f"Привет, {hbold(user_name)}!\n\n"
        "Добро пожаловать в TeleCards! 🃏\n\n"
        "Нажми кнопку ниже, чтобы начать свое приключение в мире КрендиКоинов!"
    )
    await message.answer(
        welcome_text,
        reply_markup=get_start_game_keyboard()
    )

# Сюда можно добавлять другие обработчики для пользователя
# Например, обработчик для кнопки "Правила", если вы ее добавите
# @router.callback_query(F.data == "rules")
# async def process_rules_callback(callback_query: types.CallbackQuery):
#     await callback_query.message.answer("Здесь будут правила игры...")
#     await callback_query.answer()