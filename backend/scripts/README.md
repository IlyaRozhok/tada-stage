# Database Seeding Scripts

## Описание

Этот скрипт создает 5 операторов с 5 свойствами каждый для тестирования платформы.

## Предварительные требования

1. Убедитесь, что бэкенд сервер запущен на `http://localhost:3001`
2. Установите зависимости: `npm install axios`

## Запуск скрипта

```bash
cd tada-api-stage/backend/scripts
node seed-operators-fixed.js
```

Или используйте bash скрипт:

```bash
cd tada-api-stage/backend/scripts
./run-seed.sh
```

## Что создается

### Операторы

1. **John Smith** (London)

   - Email: `operator1@tada.com`
   - Password: `password123`
   - Компания: Smith Properties Ltd

2. **Sarah Johnson** (Manchester)

   - Email: `operator2@tada.com`
   - Password: `password123`
   - Компания: Johnson Real Estate

3. **Michael Brown** (Birmingham)

   - Email: `operator3@tada.com`
   - Password: `password123`
   - Компания: Brown & Associates

4. **Emma Wilson** (Edinburgh)

   - Email: `operator4@tada.com`
   - Password: `password123`
   - Компания: Wilson Properties

5. **David Taylor** (Bristol)
   - Email: `operator5@tada.com`
   - Password: `password123`
   - Компания: Taylor Estates

### Свойства

Каждый оператор получает 5 уникальных свойств в своем регионе:

- **London**: Luxury apartments, studios, family homes
- **Manchester**: City center apartments, student accommodation, family houses
- **Birmingham**: Modern flats, student housing, luxury properties
- **Edinburgh**: Historic apartments, student accommodation, family homes
- **Bristol**: Harbor view apartments, student housing, family homes

## Использование

После запуска скрипта вы можете:

1. Войти в систему как любой из операторов
2. Управлять их свойствами через дашборд оператора
3. Тестировать функциональность платформы

## Логин данные

```
1. operator1@tada.com / password123
2. operator2@tada.com / password123
3. operator3@tada.com / password123
4. operator4@tada.com / password123
5. operator5@tada.com / password123
```

## Примечания

- Все операторы создаются с ролью "operator"
- Каждое свойство имеет уникальный адрес и характеристики
- Цены варьируются от £750 до £4500 в месяц
- Все свойства имеют детальные описания и особенности
