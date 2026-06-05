<div class="markdown-body">

# Dokumentacja projektu
Autorzy: Magdalena Bernat, Wiktoria Awramik, Krzysztof Czerenko

## 1. Opis ogólny projektu

**University Room Reservation System** to system wspierający zarządzanie salami uczelnianymi oraz ich rezerwacjami. Celem projektu jest uporządkowanie procesu rezerwacji, wyeliminowanie konfliktów terminów i zapewnienie jednego, centralnego miejsca do obsługi dostępności zasobów.

System został przygotowany z myślą o trzech głównych grupach użytkowników:

- **administratorach**, którzy zarządzają salami i mają pełny wgląd w system,
- **wykładowcach**, którzy mogą rezerwować sale zgodnie z przypisanymi limitami,
- **studentach**, którzy również mogą składać rezerwacje, ale z bardziej restrykcyjnymi ograniczeniami.

Najważniejsze funkcjonalności systemu:

- logowanie użytkownika i autoryzacja na podstawie tokenu JWT,
- przeglądanie listy sal,
- filtrowanie sal po typie, budynku i pojemności,
- sprawdzanie dostępności sal w zadanym przedziale czasu,
- tworzenie i anulowanie rezerwacji,
- podgląd własnych rezerwacji,
- zarządzanie profilem użytkownika,
- administracyjne dodawanie, edycja i usuwanie sal,
- administracyjne zarządzanie użytkownikami,
- administracyjne blokowanie sal w wybranych terminach,
- walidacja konfliktów czasowych i limitów rezerwacji.

Projekt realizuje typowy scenariusz aplikacji biznesowej: frontend udostępnia interfejs użytkownika, backend wystawia REST API, a baza danych przechowuje informacje o użytkownikach, salach i rezerwacjach.

---

## 2. Stack technologiczny

### Backend

- **Java 21**
- **Spring Boot 4**
- **Spring Web MVC**
- **Spring Data JPA**
- **Spring Security**
- **JWT (jjwt)**
- **Flyway**
- **MySQL**
- **springdoc-openapi / Swagger UI**
- **Maven**

### Frontend

- **Next.js 16**
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **react-hook-form**
- **openapi-typescript**
- **ESLint**
- **pnpm**

### Testy i jakość

- **JUnit 5**
- **Mockito**
- **MockMvc**
- **Testcontainers**
- **JaCoCo**

---

## 3. Architektura systemu

Projekt został zbudowany w modelu **klient-serwer**:

1. **frontend** odpowiada za interfejs użytkownika i komunikację z API,
2. **backend** realizuje logikę biznesową, autoryzację i obsługę danych,
3. **baza MySQL** przechowuje trwały stan systemu.

### Architektura backendu

Backend opiera się na klasycznej, warstwowej architekturze:

- **controller** - przyjmuje żądania HTTP i zwraca odpowiedzi REST,
- **service** - zawiera logikę biznesową,
- **repository** - komunikuje się z bazą danych przez Spring Data JPA,
- **model** - encje i typy domenowe,
- **dto** - obiekty wejścia i wyjścia API,
- **security** - konfiguracja bezpieczeństwa oraz obsługa JWT,
- **exception** - centralna obsługa błędów.

Taki podział upraszcza rozwój projektu, zwiększa czytelność kodu i pozwala oddzielić warstwę transportową od logiki domenowej.

### Architektura frontendu

Frontend wykorzystuje **Next.js App Router** i jest podzielony na:

- warstwę stron w `frontend/src/app`,
- wspólne typy i klienta API w `frontend/src/app/lib`,
- automatycznie generowany kontrakt API w `frontend/src/api/schema.ts`,
- prosty **design system** w `frontend/src/design-system`.

Aplikacja frontendowa działa jako osobny klient SPA/SSR korzystający z backendowego API pod adresem `http://localhost:8080`.

### Warstwa danych

Schemat bazy danych jest zarządzany migracjami **Flyway**. Główne tabele to:

- `users`,
- `room`,
- `reservation`.

Migracje tworzą strukturę bazy oraz dane startowe potrzebne do uruchomienia aplikacji i testów.

---

## 4. Backend

### 4.1. Sposób działania

Backend wystawia REST API dla trzech głównych obszarów:

- **autoryzacja** (`/auth`),
- **sale** (`/rooms`),
- **rezerwacje** (`/reservations`),
- **użytkownicy** (`/users`).

Kontrolery przyjmują żądania, a właściwa logika jest delegowana do serwisów. Dzięki temu warstwa HTTP pozostaje cienka, a reguły biznesowe są utrzymywane w jednym miejscu.

### 4.2. Zastosowane wzorce i rozwiązania

#### Warstwowa architektura

Najważniejszym wzorcem jest **Layered Architecture**. Kontrolery nie wykonują bezpośrednio operacji na bazie danych - zamiast tego korzystają z serwisów, a te z repozytoriów.

#### Repository Pattern

Warstwa repozytoriów korzysta z mechanizmów Spring Data JPA. Repozytoria izolują kod biznesowy od szczegółów persystencji.

#### Specification Pattern

W projekcie wykorzystano klasy `RoomSpecs` i `ReservationSpecs`, które budują dynamiczne kryteria wyszukiwania. Pozwala to łatwo rozwijać filtrowanie bez rozbudowywania kontrolerów o złożoną logikę zapytań.

#### DTO Pattern

Do komunikacji z klientem używane są rekordy DTO, np. `RoomRequest`, `RoomResponse`, `ReservationRequest`, `ReservationResponse`. Dzięki temu model domenowy nie jest wystawiany bezpośrednio na zewnątrz.

#### Centralna obsługa wyjątków

Klasa `GlobalExceptionHandler` odpowiada za zamianę wyjątków na spójne odpowiedzi HTTP. To upraszcza kontrolery i zapewnia jednolity format błędów.

### 4.3. Bezpieczeństwo

Backend korzysta z **Spring Security** oraz tokenów **JWT**:

- użytkownik loguje się przez `POST /auth/login`,
- po poprawnym zalogowaniu otrzymuje token,
- token jest dołączany do kolejnych żądań jako `Authorization: Bearer ...`,
- filtr `JwtAuthenticationFilter` odczytuje token i buduje kontekst bezpieczeństwa,
- dostęp do wybranych endpointów jest ograniczony rolami, np. `ADMIN`.

Autoryzacja jest dodatkowo wspierana adnotacjami takimi jak `@PreAuthorize`.

### 4.4. Logika biznesowa

Główna logika biznesowa backendu została skupiona w warstwie serwisów. Każdy serwis odpowiada za inny obszar domeny, dzięki czemu kod jest bardziej czytelny, łatwiejszy do testowania i prostszy w rozwijaniu.

#### `ReservationServiceImpl`

Jest to najważniejszy serwis z perspektywy działania całego systemu, ponieważ obsługuje pełny cykl życia rezerwacji i blokad administracyjnych. Odpowiada między innymi za:

- walidację poprawnego zakresu czasu rezerwacji,
- sprawdzenie, czy sala istnieje i czy może zostać użyta,
- ograniczenie studentów do wybranych typów sal,
- egzekwowanie limitów rezerwacji zależnych od roli użytkownika,
- wykrywanie kolizji z innymi rezerwacjami,
- wykrywanie konfliktów z blokadami administracyjnymi,
- tworzenie blokad administracyjnych i anulowanie rezerwacji, które z nimi kolidują,
- anulowanie rezerwacji przez właściciela lub administratora,
- listowanie rezerwacji i odświeżanie ich statusów,
- pobieranie szczegółów rezerwacji z uwzględnieniem uprawnień użytkownika,
- sprawdzanie dostępności sal w wybranym przedziale czasu.

To właśnie w tym serwisie znajdują się najważniejsze reguły domenowe projektu, czyli zasady określające, kto, kiedy i na jakich warunkach może dokonać rezerwacji.

#### `RoomServiceImpl`

Serwis sal odpowiada za logikę związaną z zarządzaniem zasobami uczelni. Jego zadania obejmują:

- dodawanie nowych sal,
- aktualizację danych sali,
- usuwanie sal,
- pobieranie pojedynczej sali po identyfikatorze,
- filtrowanie listy sal po typie, budynku i pojemności.

Istotnym elementem tego serwisu jest także bezpieczne usuwanie sal - przed skasowaniem sali powiązane rezerwacje są odpowiednio anulowane i odłączane, aby zachować spójność danych.

#### `UserServiceImpl`

Serwis użytkowników odpowiada za logikę dotyczącą danych profilu oraz obsługi użytkowników w systemie. W praktyce obejmuje to:

- pobieranie użytkownika po nazwie użytkownika lub identyfikatorze,
- listowanie użytkowników,
- aktualizację danych profilu zalogowanego użytkownika,
- kontrolę unikalności adresu e-mail podczas edycji profilu.

Jest to mniejszy serwis niż obsługa rezerwacji, ale pełni ważną rolę w utrzymaniu poprawnych i spójnych danych użytkowników.

#### Podział odpowiedzialności

Takie rozdzielenie logiki oznacza, że:

- `ReservationServiceImpl` odpowiada za **proces rezerwacji i reguły domenowe**,
- `RoomServiceImpl` odpowiada za **zarządzanie zasobami**, czyli salami,
- `UserServiceImpl` odpowiada za **obsługę danych użytkownika**.

Dzięki temu każdy serwis ma jasno określoną odpowiedzialność, co dobrze wpisuje się w zasady projektowania obiektowego i ułatwia dalszy rozwój systemu.

---

## 5. Frontend

### 5.1. Sposób działania

Frontend jest aplikacją zbudowaną w **Next.js** i napisany w **TypeScript**. Odpowiada za:

- logowanie użytkownika,
- prezentację danych pobieranych z API,
- obsługę formularzy,
- nawigację po systemie,
- rozdzielenie widoków zwykłego użytkownika i administratora.

Struktura katalogu `app` odwzorowuje główne moduły systemu:

- logowanie,
- panel główny,
- sale,
- rezerwacje,
- profil użytkownika,
- panel administratora dla sal, użytkowników i rezerwacji.

### 5.2. Kontekst autoryzacji

Istotnym elementem architektury frontendu jest **AuthContext**:

- przechowuje dane aktualnego użytkownika,
- pobiera profil po zapisanym tokenie JWT,
- obsługuje wylogowanie,
- udostępnia informację o stanie logowania wszystkim komponentom.

Dzięki temu logika autoryzacji nie jest powielana w wielu miejscach aplikacji.

### 5.3. Komunikacja z backendem

Frontend używa własnego klienta HTTP (`api-client.ts`) opartego o `fetch`. Klient:

- automatycznie ustawia nagłówek `Content-Type`,
- dołącza token JWT z `localStorage`,
- mapuje błędy HTTP na własny typ `APIError`,
- upraszcza wykonywanie żądań `GET`, `POST`, `PATCH`, `DELETE`.

Dodatkowo kontrakt API jest generowany automatycznie przez **openapi-typescript** na podstawie dokumentacji backendu (`/v3/api-docs`). Dzięki temu typy TypeScript są spójne z rzeczywistym API.

### 5.4. Formularze i komponenty

W projekcie wykorzystano dwa podejścia:

- klasyczne zarządzanie stanem formularza przy pomocy `useState`,
- formularze oparte o **react-hook-form** w bardziej rozbudowanych widokach.

Frontend posiada też własny, prosty **design system**, obejmujący m.in.:

- przyciski,
- pola formularzy,
- typografię,
- karty,
- tabele,
- badge i linki.

To rozwiązanie poprawia spójność interfejsu i ułatwia ponowne wykorzystanie komponentów.

### 5.5. Warstwa wizualna

Za stylowanie odpowiada **Tailwind CSS 4**. W `globals.css` zdefiniowano zestaw kolorów i tokenów wizualnych wykorzystywanych w całej aplikacji, co porządkuje wygląd interfejsu i ułatwia utrzymanie wspólnej estetyki.

### 5.6. Widoki aplikacji

**`/login`** — strona logowania umożliwiająca uwierzytelnienie użytkownika za pomocą loginu i hasła. Widok jest dostępny publicznie. W przypadku aktywnej sesji użytkownik zostaje automatycznie przekierowany do panelu głównego.

![Strona logowania](screenshots/login-page.png)
*Strona logowania*

**`/`** — panel główny aplikacji zawierający skróty do najważniejszych funkcjonalności systemu, takich jak zarządzanie salami, rezerwacjami oraz profilem użytkownika. Dla użytkowników posiadających rolę ADMIN dostępna jest dodatkowo sekcja administracyjna.

![Ekran główny standardowego użytkownika](screenshots/main-page-user.png)
*Ekran główny standardowego użytkownika*

![Ekran główny administratora](screenshots/main-page-admin.png)
*Ekran główny administratora*

**`/rooms`** — widok prezentujący listę dostępnych sal wraz z możliwością filtrowania wyników według typu sali, budynku oraz minimalnej pojemności. Dostęp do widoku mają wszyscy uwierzytelnieni użytkownicy.

![Widok dostępnych sal](screenshots/rooms.png)
*Widok dostępnych sal*

**`/rooms/[id]`** — szczegółowy widok wybranej sali, umożliwiający przegląd jej parametrów, sprawdzenie dostępności w określonym terminie oraz utworzenie rezerwacji. Użytkownicy z rolą STUDENT nie mogą rezerwować sal wykładowych ani laboratoryjnych. System egzekwuje limity czasu trwania pojedynczej rezerwacji oraz maksymalnej liczby rezerwacji w tygodniu, zależne od roli użytkownika (STUDENT: maks. 2 godziny i 5 rezerwacji tygodniowo, PROWADZĄCY: maks. 4 godziny i 10 rezerwacji tygodniowo, ADMIN: bez ograniczeń). Możliwość rezerwacji tylko przyszłych terminów w slotach czasowych o określonych długościach.

![Widok rezerwacji wybranej sali](screenshots/new-reservation.png)
*Widok rezerwacji wybranej sali*

**`/reservations`** — widok prezentujący rezerwacje użytkownika z podziałem na aktywne, zakończone oraz anulowane. Umożliwia anulowanie aktywnych rezerwacji. Dostępny dla wszystkich zalogowanych użytkowników.

![Widok swoich rezerwacji](screenshots/my-reservations.png)
*Widok swoich rezerwacji*

**`/reservations/[id]`** — szczegółowy widok pojedynczej rezerwacji zawierający informacje o terminie, sali oraz celu rezerwacji. Użytkownik standardowy ma dostęp wyłącznie do własnych rezerwacji, natomiast administrator może przeglądać wszystkie wpisy wraz z danymi osoby rezerwującej. Anulowanie jest możliwe wyłącznie dla rezerwacji o statusie aktywnym.

![Widok szczegółów rezerwacji](screenshots/reservation-details.png)
*Widok szczegółów rezerwacji*

**`/users/me`** — widok profilu użytkownika umożliwiający podgląd podstawowych informacji o koncie (login, rola) oraz edycję danych osobowych, takich jak imię, nazwisko i adres e-mail.

![Profil użytkownika](screenshots/my-profile.png)
*Profil użytkownika*

**`/admin/rooms`** — panel administracyjny służący do zarządzania salami. Umożliwia dodawanie, edycję oraz usuwanie sal. Dostęp do widoku posiadają wyłącznie użytkownicy z rolą ADMIN. Pozostali użytkownicy są przekierowywani do panelu głównego.

![Panel administracyjny do zarządzania salami](screenshots/rooms-management.png)
*Panel administracyjny do zarządzania salami*

**`/admin/users`** — panel administracyjny prezentujący listę wszystkich kont użytkowników wraz z przypisanymi rolami. Widok umożliwia sortowanie danych według imienia lub roli, jednak nie udostępnia funkcji edycji kont. Dostęp ograniczony do roli ADMIN.

![Panel administracyjny do przeglądania wszystkich użytkowników](screenshots/users-management.png)
*Panel administracyjny do przeglądania wszystkich użytkowników*

**`/admin/reservations`** — panel administracyjny umożliwiający przegląd wszystkich rezerwacji oraz blokad administracyjnych w systemie. Widok wspiera filtrowanie danych według statusu i typu wpisu, usuwanie aktywnych rezerwacji oraz tworzenie nowych blokad terminów. Dostęp wyłącznie dla użytkowników z rolą ADMIN.

![Panel administracyjny do zarządzania rezerwacjami](screenshots/reservations-management.png)
*Panel administracyjny do zarządzania rezerwacjami*

---

## 6. Testy

### 6.1. Zakres testów
Zautomatyzowany zestaw testów został zaprojektowany w celu zapewnienia stabilności i bezpieczeństwa systemu rezerwacji sal uniwersyteckich. Pokrywa on pełną ścieżkę krytyczną aplikacji — od niskopoziomowych reguł biznesowych po integrację z bazą danych i mechanizmami autoryzacji HTTP.

Kluczowe metryki charakteryzujące zestaw testów po rozbudowie:
* **Liczba zautomatyzowanych testów**: **116** (łączna suma testów jednostkowych i integracyjnych).
* **Wskaźnik powodzenia (Pass Rate)**: **100%** (0 błędów, 0 awarii).
* **Czas wykonania pakietu (Execution Time)**: Około **56 sekund** dla pełnego cyklu (włączając podnoszenie kontenera bazy danych w Dockerze).

[Wyniki testów](./Test%20Results%20-%20java_in_university-room-reservation-system.html)

---

### 6.2. Testy jednostkowe
Testy jednostkowe koncentrują się na izolowanym weryfikowaniu logiki biznesowej zawartej w warstwie usług (`Services`). Do ich realizacji wykorzystano technologie **JUnit 5** oraz **Mockito**, co pozwala na pełne mockowanie zależności bazodanowych i konfiguracyjnych.

Zastosowane dobre praktyki i architektura testów jednostkowych:
* **Struktura klas `@Nested`**: Testy zostały pogrupowane tematycznie według zachowań biznesowych za pomocą niestatycznych klas wewnętrznych z adnotacją `@Nested` (np. bloki `TworzenieRezerwacji`, `AnulowanieRezerwacji`, `SprawdzanieDostepnosciSal`). Zwiększa to czytelność kodu testowego i ułatwia lokalizację scenariuszy.
* **Język Wszechobecny (Ubiquitous Language)**: Nazwy metod technicznych są pisane w języku angielskim, natomiast opisy w adnotacjach **`@DisplayName`** zostały sporządzone w **języku polskim**. Podejście to bezpośrednio odzwierciedla zasady **Domain-Driven Design (DDD)**.
* **Scenariusze negatywne**: Szczególny nacisk położono na weryfikację zachowań w sytuacjach błędnych (np. próba rezerwacji sali w przeszłości, nakładanie się rezerwacji, przekroczenie limitów czasu rezerwacji).

---

### 6.3. Testy integracyjne
Testy integracyjne weryfikują pełne komponenty Spring Boot (warstwę kontrolerów i repozytoriów) oraz ich interakcję z bazą danych i mechanizmami Spring Security. Wykorzystują one **Spring Boot Test**, bibliotekę **MockMvc** do symulowania żądań HTTP oraz środowisko **Testcontainers**.

Kluczowe aspekty techniczne testów integracyjnych:
* **Prawdziwa baza danych (MySQL 8.0)**: W przeciwieństwie do uproszczonych baz in-memory (np. H2), testy integracyjne uruchamiane są na rzeczywistej bazie danych MySQL 8.0 działającej wewnątrz tymczasowego kontenera Docker. Zapobiega to ukrywaniu błędów specyficznych dla produkcyjnego dialektu SQL oraz mechanizmu blokowania transakcji.
>**Optymalizacja wzorcem Singleton**:
> Podnoszenie osobnego kontenera dla każdej klasy testowej wiązałoby się z dużym narzutem czasowym. Klasa bazowa **`BaseIntegrationTest`** implementuje wzorzec Singleton — statyczna instancja kontenera MySQL jest inicjalizowana w statycznym bloku i współdzielona przez wszystkie klasy testów integracyjnych dziedziczące po niej. Dzięki temu baza danych podnosi się **dokładnie raz** na całą sesję JVM.

---

### 6.4. Co jest sprawdzane
Poza podstawowymi operacjami CRUD, zestaw testów weryfikuje zaawansowane scenariusze architektoniczne i biznesowe:

* **Obrona przed współbieżnością (Race Conditions)**:
    * Przetestowano scenariusz, w którym pula 10 wątków (symulująca 10 studentów korzystających z klasy `ExecutorService` i zsynchronizowanych obiektem `CountDownLatch`) próbuje zarezerwować dokładnie tę samą salę na ten sam przedział czasu.
    * System chroni spójność danych poprzez **blokowanie pesymistyczne zapisu (`PESSIMISTIC_WRITE`)** na poziomie repozytorium (`findWithLockById` w encji `Room`).
    * Test weryfikuje, że dokładnie **jedna** rezerwacja kończy się sukcesem, a pozostałe **9** żądań zostaje bezpiecznie odrzuconych z wyjątkiem `ReservationConflictException` (zwracającym status HTTP 409).
* **Ochrona prywatności danych osobowych (RODO/GDPR)**:
    * System musi zapobiegać ujawnianiu danych osób rezerwujących salę nieuprawnionym użytkownikom.
    * Testy integracyjne weryfikują automatyczne **maskowanie pola `bookerName`** (nazwy użytkownika dokonującego rezerwacji) w odpowiedziach JSON na zapytania `/reservations` i `/reservations/{id}`, jeżeli żądanie pochodzi od roli `STUDENT` lub `LECTURER`.
    * Pełne dane osobowe rezerwujących są udostępniane wyłącznie dla roli `ADMIN`.

---

### 6.5. Pokrycie kodu
Pokrycie kodu jest automatycznie monitorowane i mierzone przez bibliotekę **JaCoCo (Java Code Coverage)** podczas każdego uruchomienia komendy testowej.

Zasady i granice pokrycia kodu w projekcie:
* **Klasy operacyjne**: Logika biznesowa w serwisach oraz obsługa endpointów w kontrolerach posiadają pokrycie linii i gałęzi decyzyjnych (branch coverage) na poziomie bliskim **100%**.
* **Wyłączenia z reguł pokrycia**: Klasy czysto szablonowe (boilerplate), takie jak encje JPA (modele domenowe), rekordy DTO (struktury przesyłu danych), własne klasy wyjątków (np. `RoomNotFoundException`) oraz pliki konfiguracyjne Springa zostały celowo wyłączone z restrykcyjnych reguł JaCoCo. Klasy te nie zawierają własnej logiki biznesowej, a ich testowanie jednostkowe generowałoby fałszywy wskaźnik pokrycia bez rzeczywistego wpływu na bezpieczeństwo kodu.

![Podsumowanie Jacoco](screenshots/raport-jacoco.png)
*Podsumowanie JaCoCo*

---

## 7. Instrukcja uruchomienia

### Wymagania

- **Docker**
- **Java 21+**
- **Node.js**
- **pnpm**

### 1. Uruchom bazę danych

```bash
docker run --name room-reservation-db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=room_reservation -p 3306:3306 -d mysql:8
```

### 2. Utwórz plik `.env` w katalogu głównym

Minimalna konfiguracja:

```properties
DB_URL=jdbc:mysql://localhost:3306/room_reservation
DB_USERNAME=root
DB_PASSWORD=root
JWT_SECRET=twoj-sekretny-klucz-o-dlugosci-minimum-32-znakow
```

### 3. Uruchom backend

```bash
.\mvnw spring-boot:run
```

Backend startuje pod adresem **http://localhost:8080**. Podczas startu Flyway automatycznie wykona migracje bazy danych.

### 4. Uruchom frontend

W osobnym terminalu:

```bash
cd frontend
pnpm i
pnpm dev
```

Frontend działa pod adresem **http://localhost:4000**. Podczas uruchomienia generowane są także typy API na podstawie dokumentacji OpenAPI z backendu, dlatego backend powinien być już uruchomiony.

### 5. Dokumentacja API

Swagger UI jest dostępny pod adresem:

**http://localhost:8080/swagger-ui/index.html**

---

### 8. Podział pracy

| Osoba | Rola |
|-------|------|
| Krzysztof Czerenko | backend, baza danych |
| Magdalena Bernat | frontend |
| Wiktoria Awramik | testy, raport Jacoco |

---

## 8. Podsumowanie

Projekt realizuje kompletny system rezerwacji sal uczelnianych z podziałem na backend, frontend i warstwę testową. Zastosowane rozwiązania - takie jak architektura warstwowa, JWT, DTO, Specification Pattern, Testcontainers i własny design system - pokazują praktyczne wykorzystanie współczesnych narzędzi i wzorców stosowanych w aplikacjach webowych.

</div>