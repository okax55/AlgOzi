@echo off
echo ========================================================
echo PROJE INTERNETE (SUNUCUYA) HAZIRLANIYOR...
echo Lutfen bitmesini bekleyin...
echo ========================================================
echo.
call npm run build
echo.
echo ========================================================
echo ISLEM TAMAMLANDI! (DIST KLASORU OLUSTURULDU)
echo ========================================================
echo.
echo 1. https://app.netlify.com/drop adresine girin.
echo 2. "Yeni klasor" icindeki yeni olusan "dist" klasorunu 
echo    ekrandaki yuvarlagin icine surukleyip birakin.
echo 3. Siteniz saniyeler icinde yayina girecektir!
echo.
pause
