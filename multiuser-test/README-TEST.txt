GYMLOG CRUSH — MULTI USER TEST 0.60.0

BEZPIECZNY TEST — NIE PODMIENIAJ JESZCZE GŁÓWNEJ APLIKACJI.

Najlepszy sposób testu na GitHub Pages:
1. W repo GymLog-CRUSH-PWA utwórz folder: multiuser-test
2. Wrzuć do niego WSZYSTKIE pliki z tej paczki.
3. Po commicie otwórz:
   https://hubert00741.github.io/GymLog-CRUSH-PWA/multiuser-test/
4. Zaloguj się loginem: hubert
   Hasło: to, które ustawiłeś w Supabase.
5. Jeśli aplikacja znajdzie starą historię, wybierz „PRZENIEŚ MOJE DANE”.
   Stary localStorage nie jest kasowany — kopiujemy dane do osobnego magazynu użytkownika i Supabase.

WAŻNE:
- nie usuwaj obecnej PWA z ekranu iPhone'a;
- test działa w osobnym folderze i ma własny service worker;
- dane użytkowników są rozdzielone przez user_id oraz RLS;
- publishable key Supabase jest publicznym kluczem frontendowym — service_role NIE znajduje się w plikach;
- aplikacja nie ma ekranu rejestracji; przed produkcją dodatkowo wyłączymy publiczne sign-up w ustawieniach Supabase Auth.
