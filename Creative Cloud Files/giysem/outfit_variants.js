// Alternative suggestions per weather band and slot, tagged by style vibe
// (casual / elegant / sporty / bold; "minimal" borrows the elegant ones).
// The base outfit in outfit.js counts as one more "casual" option. Each day
// the engine picks one option per slot, preferring the user's vibe, rotating
// by date so the same weather doesn't produce the same words every day.
//
// Entry: [vibe, item, reason, gender?]  ({t} in a reason = feels-like temp;
// gender limits an entry to 'kadin' or 'erkek').

export const VARIANTS = {
  tr: {
    dondurucu: {
      ust: [
        ['casual', 'Termal içlik, üstüne kalın balıkçı yaka kazak', 'Hissedilen {t}°. Balıkçı yaka boynunu da sıcak tutar'],
        ['elegant', 'İnce termal içlik, üstüne yün ya da kaşmir kazak', 'Hissedilen {t}°. Yün ince olsa da çok iyi ısıtır'],
        ['sporty', 'Termal spor içlik, üstüne kalın sweatshirt', 'Hissedilen {t}°. Ter atan içlik hareket ederken de sıcak tutar'],
        ['bold', 'Termal içlik, üstüne renkli kalın örgü kazak', 'Hissedilen {t}°. Gri bir günde renkli bir kazak iyi gelir'],
      ],
      ustune: [
        ['elegant', 'İnce yün hırka', 'Araya ince bir kat, montun altında şişkinlik yapmaz'],
        ['sporty', 'Fermuarlı polar', 'Araya bir kat daha, ısınınca fermuarı açarsın'],
      ],
      dis: [
        ['casual', 'Kapüşonlu kalın parka', 'Rüzgarı ve soğuğu keser, kapüşonu da hazırda dursun'],
        ['elegant', 'Uzun yün kaban', 'Uzun kaban dizlerine kadar sıcak tutar'],
        ['sporty', 'Dizüstü şişme mont', 'Hafif ama çok sıcak, hareketini de kısıtlamaz'],
        ['bold', 'Renkli şişme mont', 'Hem sıcak tutar hem soğuk günü biraz aydınlatır'],
      ],
      alt: [
        ['casual', 'Astarlı kalın kot', 'Astarlı kot hem rahat hem sıcak'],
        ['elegant', 'Yün kumaş pantolon, altına ince termal tayt', 'Termal tayt pantolonun altında görünmez ama çok ısıtır'],
        ['sporty', 'Polar astarlı eşofman altı', 'İçi polar, soğukta bacakların ısınır'],
        ['elegant', 'Kalın tayt üstüne uzun yün etek', 'Kalın tayt bacaklarını sıcak tutar', 'kadin'],
      ],
      ayak: [
        ['elegant', 'Deri, içi astarlı bot', 'İçi astarlı deri bot hem şık hem sıcak'],
        ['sporty', 'Su geçirmez, kalın tabanlı spor bot', 'Kalın taban yerden gelen soğuğu keser'],
      ],
    },
    soguk: {
      ust: [
        ['casual', 'Uzun kollu tişört, üstüne kalın sweatshirt', 'Hissedilen {t}°. İki kat, içeri girince birini çıkarırsın'],
        ['elegant', 'Gömlek, üstüne ince yün kazak', 'Hissedilen {t}°. Gömlek yakası kazağın üstünden görünsün'],
        ['sporty', 'Uzun kollu spor tişört, üstüne kapüşonlu', 'Hissedilen {t}°. Kapüşonlu hem sıcak tutar hem rahattır'],
        ['bold', 'Desenli ya da renkli kalın kazak', 'Hissedilen {t}°. Kombini renkli bir kazak taşısın'],
      ],
      dis: [
        ['casual', 'Kapitone ceket', 'Hafif ama sıcak, günün her saatine uyar'],
        ['elegant', 'Kısa yün kaban', 'Kısa kaban hem şık durur hem sıcak tutar'],
        ['sporty', 'Kapüşonlu şişme ceket', 'Hafif şişme ceket soğuğu rahatça keser'],
        ['bold', 'Renkli kısa mont', 'Soğuk havaya biraz renk katar'],
      ],
      alt: [
        ['casual', 'Koyu renk kot', 'Kalın kot bu havada yeterince sıcak'],
        ['elegant', 'Yün kumaş pantolon', 'Yün kumaş hem şık hem sıcak'],
        ['sporty', 'Kalın eşofman altı', 'Rahat ve sıcak'],
        ['elegant', 'Kalın tayt üstüne diz altı yün etek', 'Kalın tayt soğuğu keser', 'kadin'],
      ],
      ayak: [
        ['casual', 'Bilekli bot', 'Bilekli bot hem sıcak tutar hem kaymaz'],
        ['elegant', 'Deri bot', 'Deri bot her kombine uyar'],
        ['sporty', 'Kalın tabanlı spor ayakkabı', 'Kalın taban soğuğu keser'],
      ],
    },
    serin: {
      ust: [
        ['casual', 'Uzun kollu tişört', 'Hissedilen {t}°. Uzun kol tek başına yetebilir'],
        ['elegant', 'Düz renk gömlek', 'Hissedilen {t}°. Gömlek bu havada tek başına rahat eder'],
        ['sporty', 'Uzun kollu spor tişört', 'Hissedilen {t}°. Nefes alan kumaş hareket ederken terletmez'],
        ['bold', 'Çizgili ya da desenli uzun kollu', 'Hissedilen {t}°. Desen kombini canlandırır'],
      ],
      ustune: [
        ['casual', 'İnce sweatshirt', 'Serinlerse giyersin, ısınırsan çıkarırsın'],
        ['elegant', 'İnce örgü hırka', 'İnce hırka kat kat giyime çok uyar'],
        ['sporty', 'Fermuarlı ince polar', 'Hafif polar hareket ederken rahat eder'],
      ],
      dis: [
        ['casual', 'Kot ceket', 'Kot ceket bu havanın klasiği'],
        ['elegant', 'Trençkot', 'Trençkot serin günlerde hem şık hem pratik'],
        ['sporty', 'İnce rüzgarlık', 'Hafif rüzgarlık çantaya da sığar'],
        ['bold', 'Renkli bomber ceket', 'Bomber ceket kombine karakter katar'],
      ],
      alt: [
        ['casual', 'Kot pantolon', 'Kot bu havada en rahat seçim'],
        ['elegant', 'Chino pantolon', 'Chino hem rahat hem derli toplu durur'],
        ['sporty', 'Jogger eşofman altı', 'Rahat ve hareketli bir gün için'],
        ['elegant', 'İnce tayt üstüne midi etek', 'İnce tayt serin havada yeterli', 'kadin'],
      ],
      ayak: [
        ['casual', 'Beyaz spor ayakkabı', 'Beyaz spor ayakkabı her şeye uyar'],
        ['elegant', 'Makosen ya da deri bot', 'Deri ayakkabı kombini toparlar'],
        ['sporty', 'Koşu ayakkabısı', 'Gün boyu yürüyeceksen en rahatı'],
      ],
    },
    ilik: {
      ust: [
        ['casual', 'Pamuklu tişört', 'Hissedilen {t}°. Tek kat yeterli'],
        ['elegant', 'Keten gömlek', 'Hissedilen {t}°. Keten hem şık durur hem serin tutar'],
        ['sporty', 'Nefes alan spor tişört', 'Hissedilen {t}°. Ter atan kumaş rahat ettirir'],
        ['bold', 'Renkli ya da baskılı tişört', 'Hissedilen {t}°. Güzel havaya renkli bir tişört'],
        ['elegant', 'Hafif bluz', 'Hissedilen {t}°. Hafif bir bluz yeterli', 'kadin'],
      ],
      ustune: [
        ['elegant', 'İnce hırka (yanında dursun)', 'Akşamüstü serinlerse omzuna alırsın'],
        ['sporty', 'İnce sweatshirt (yanında dursun)', 'Akşamüstü serinlerse giyersin'],
      ],
      alt: [
        ['casual', 'Açık renk kot', 'Açık renk kot ılık havaya çok yakışır'],
        ['elegant', 'Keten pantolon', 'Keten pantolon hafif ve şık'],
        ['sporty', 'İnce jogger', 'Rahat bir gün için'],
        ['elegant', 'Midi elbise', 'Ilık havada tek parça elbise en rahatı', 'kadin'],
      ],
      ayak: [
        ['casual', 'Kanvas spor ayakkabı', 'Hafif ve nefes alır'],
        ['elegant', 'Makosen', 'Makosen ılık havada şık ve rahat'],
        ['sporty', 'Hafif koşu ayakkabısı', 'Gün boyu rahat'],
      ],
    },
    sicak: {
      ust: [
        ['casual', 'İnce pamuklu tişört', 'Hissedilen {t}°. İnce kumaş seni terletmez'],
        ['elegant', 'Kısa kollu keten gömlek', 'Hissedilen {t}°. Keten sıcağı en iyi taşıyan kumaş'],
        ['sporty', 'Kolsuz spor atlet', 'Hissedilen {t}°. Kolsuz üst serin tutar'],
        ['bold', 'Renkli desenli gömlek', 'Hissedilen {t}°. Yaz havası renkli bir gömleği hak ediyor'],
        ['elegant', 'İnce askılı bluz', 'Hissedilen {t}°. Hafif ve serin', 'kadin'],
      ],
      alt: [
        ['casual', 'Kot şort', 'Kot şort sıcakta rahat'],
        ['elegant', 'Keten pantolon', 'Bol keten pantolon şort kadar serin tutar'],
        ['sporty', 'Spor şort', 'Hafif ve hareketli'],
        ['elegant', 'Hafif yazlık elbise', 'Yazlık elbise sıcakta en rahatı', 'kadin'],
      ],
      ayak: [
        ['casual', 'Kanvas ayakkabı ya da sandalet', 'Ayakların nefes alsın'],
        ['elegant', 'Deri sandalet', 'Deri sandalet şık ve serin'],
        ['sporty', 'Fileli spor ayakkabı', 'File kumaş ayakları serin tutar'],
      ],
    },
    cok_sicak: {
      ust: [
        ['casual', 'Beyaz ince tişört', 'Hissedilen {t}°. Açık renk güneşi geri yansıtır'],
        ['elegant', 'Açık renk keten gömlek, kolları kıvrık', 'Hissedilen {t}°. Keten ve açık renk en serin ikili'],
        ['sporty', 'Kolsuz, ter atan atlet', 'Hissedilen {t}°. Az kumaş, bol hava'],
      ],
      alt: [
        ['casual', 'Keten ya da pamuklu şort', 'Bacakların nefes alsın'],
        ['elegant', 'Bol keten pantolon', 'Bol kesim sıcakta şort kadar serin'],
        ['sporty', 'Hafif koşu şortu', 'Hafif ve çabuk kurur'],
        ['elegant', 'Bol keten elbise', 'Bol kesim elbise hava alır', 'kadin'],
      ],
      ayak: [
        ['casual', 'Sandalet', 'Sıcakta sandalet en iyisi'],
        ['elegant', 'Deri sandalet ya da espadril', 'Espadril yazın en şık seçeneklerden'],
        ['sporty', 'Spor sandalet', 'Hem rahat hem sağlam'],
      ],
    },
  },
  en: {
    dondurucu: {
      ust: [
        ['casual', 'Thermal base layer under a thick turtleneck', 'Feels like {t}°. A turtleneck keeps your neck warm too'],
        ['elegant', 'Thin thermal layer under a wool or cashmere sweater', 'Feels like {t}°. Wool warms well even when it is thin'],
        ['sporty', 'Thermal sports layer under a thick sweatshirt', 'Feels like {t}°. A wicking base layer keeps you warm on the move'],
        ['bold', 'Thermal layer under a bright chunky knit', 'Feels like {t}°. A colorful sweater lifts a grey day'],
      ],
      ustune: [
        ['elegant', 'Thin wool cardigan', 'A thin extra layer that won\'t bulk up under your coat'],
        ['sporty', 'Zip-up fleece', 'One more layer, unzip it when you warm up'],
      ],
      dis: [
        ['casual', 'Thick hooded parka', 'Blocks wind and cold, and the hood is ready when you need it'],
        ['elegant', 'Long wool coat', 'A long coat keeps you warm down to your knees'],
        ['sporty', 'Knee-length puffer', 'Light but very warm, and easy to move in'],
        ['bold', 'Bright puffer jacket', 'Warm, and it brightens up a cold day'],
      ],
      alt: [
        ['casual', 'Lined heavy jeans', 'Lined jeans are comfortable and warm'],
        ['elegant', 'Wool trousers with thin thermal leggings underneath', 'Thermal leggings stay hidden but add a lot of warmth'],
        ['sporty', 'Fleece-lined joggers', 'Fleece inside keeps your legs warm'],
        ['elegant', 'Long wool skirt over thick tights', 'Thick tights keep your legs warm', 'kadin'],
      ],
      ayak: [
        ['elegant', 'Lined leather boots', 'Lined leather boots look sharp and stay warm'],
        ['sporty', 'Waterproof, thick-soled trail boots', 'A thick sole keeps the cold of the ground away'],
      ],
    },
    soguk: {
      ust: [
        ['casual', 'Long-sleeve tee under a thick sweatshirt', 'Feels like {t}°. Two layers, take one off indoors'],
        ['elegant', 'Shirt under a thin wool sweater', 'Feels like {t}°. Let the shirt collar show over the sweater'],
        ['sporty', 'Long-sleeve sports top under a hoodie', 'Feels like {t}°. A hoodie is warm and easy'],
        ['bold', 'Patterned or bright chunky sweater', 'Feels like {t}°. Let a colorful sweater carry the look'],
      ],
      dis: [
        ['casual', 'Quilted jacket', 'Light but warm, works all day'],
        ['elegant', 'Short wool coat', 'A short coat looks sharp and keeps you warm'],
        ['sporty', 'Hooded puffer jacket', 'A light puffer handles the cold easily'],
        ['bold', 'Bright short jacket', 'Adds some color to a cold day'],
      ],
      alt: [
        ['casual', 'Dark jeans', 'Heavy jeans are warm enough today'],
        ['elegant', 'Wool trousers', 'Wool is smart and warm'],
        ['sporty', 'Heavy joggers', 'Comfortable and warm'],
        ['elegant', 'Below-the-knee wool skirt over thick tights', 'Thick tights block the cold', 'kadin'],
      ],
      ayak: [
        ['casual', 'Ankle boots', 'Warm and grippy'],
        ['elegant', 'Leather boots', 'Leather boots go with everything'],
        ['sporty', 'Thick-soled sneakers', 'A thick sole keeps the cold out'],
      ],
    },
    serin: {
      ust: [
        ['casual', 'Long-sleeve tee', 'Feels like {t}°. Long sleeves may be enough on their own'],
        ['elegant', 'Plain shirt', 'Feels like {t}°. A shirt on its own works in this weather'],
        ['sporty', 'Long-sleeve sports top', 'Feels like {t}°. Breathable fabric keeps you dry on the move'],
        ['bold', 'Striped or patterned long-sleeve', 'Feels like {t}°. A pattern livens up the outfit'],
      ],
      ustune: [
        ['casual', 'Light sweatshirt', 'Put it on if it cools off, take it off if you warm up'],
        ['elegant', 'Fine-knit cardigan', 'A thin cardigan is perfect for layering'],
        ['sporty', 'Light zip-up fleece', 'A light fleece is comfy on the move'],
      ],
      dis: [
        ['casual', 'Denim jacket', 'The classic for this weather'],
        ['elegant', 'Trench coat', 'Smart and practical on cool days'],
        ['sporty', 'Light windbreaker', 'Packs into a bag easily'],
        ['bold', 'Bright bomber jacket', 'A bomber adds character'],
      ],
      alt: [
        ['casual', 'Jeans', 'Jeans are the easy choice today'],
        ['elegant', 'Chinos', 'Comfortable and neat'],
        ['sporty', 'Joggers', 'For an easy, active day'],
        ['elegant', 'Midi skirt over thin tights', 'Thin tights are enough when it is cool', 'kadin'],
      ],
      ayak: [
        ['casual', 'White sneakers', 'White sneakers go with everything'],
        ['elegant', 'Loafers or leather boots', 'Leather shoes pull the outfit together'],
        ['sporty', 'Running shoes', 'Best if you\'ll be walking all day'],
      ],
    },
    ilik: {
      ust: [
        ['casual', 'Cotton tee', 'Feels like {t}°. One layer is enough'],
        ['elegant', 'Linen shirt', 'Feels like {t}°. Linen looks sharp and stays cool'],
        ['sporty', 'Breathable sports tee', 'Feels like {t}°. Wicking fabric keeps you comfortable'],
        ['bold', 'Bright or graphic tee', 'Feels like {t}°. Nice weather for a colorful tee'],
        ['elegant', 'Light blouse', 'Feels like {t}°. A light blouse is enough', 'kadin'],
      ],
      ustune: [
        ['elegant', 'Thin cardigan (keep it with you)', 'Throw it over your shoulders if it cools off'],
        ['sporty', 'Light sweatshirt (keep it with you)', 'Put it on if it cools off'],
      ],
      alt: [
        ['casual', 'Light-wash jeans', 'Light jeans suit mild weather'],
        ['elegant', 'Linen trousers', 'Light and smart'],
        ['sporty', 'Light joggers', 'For an easy day'],
        ['elegant', 'Midi dress', 'A one-piece dress is easiest in mild weather', 'kadin'],
      ],
      ayak: [
        ['casual', 'Canvas sneakers', 'Light and breathable'],
        ['elegant', 'Loafers', 'Smart and comfortable in mild weather'],
        ['sporty', 'Light running shoes', 'Comfortable all day'],
      ],
    },
    sicak: {
      ust: [
        ['casual', 'Thin cotton tee', 'Feels like {t}°. Thin fabric keeps you from sweating'],
        ['elegant', 'Short-sleeve linen shirt', 'Feels like {t}°. Linen handles heat best'],
        ['sporty', 'Sleeveless sports top', 'Feels like {t}°. Sleeveless keeps you cool'],
        ['bold', 'Bright printed shirt', 'Feels like {t}°. Summer weather deserves a colorful shirt'],
        ['elegant', 'Light strappy top', 'Feels like {t}°. Light and cool', 'kadin'],
      ],
      alt: [
        ['casual', 'Denim shorts', 'Comfortable in the heat'],
        ['elegant', 'Linen trousers', 'Loose linen is as cool as shorts'],
        ['sporty', 'Sports shorts', 'Light and easy to move in'],
        ['elegant', 'Light summer dress', 'The easiest thing to wear in the heat', 'kadin'],
      ],
      ayak: [
        ['casual', 'Canvas shoes or sandals', 'Let your feet breathe'],
        ['elegant', 'Leather sandals', 'Smart and cool'],
        ['sporty', 'Mesh sneakers', 'Mesh keeps your feet cool'],
      ],
    },
    cok_sicak: {
      ust: [
        ['casual', 'Thin white tee', 'Feels like {t}°. Light colors reflect the sun'],
        ['elegant', 'Light linen shirt, sleeves rolled', 'Feels like {t}°. Linen and light colors are the coolest pair'],
        ['sporty', 'Sleeveless wicking top', 'Feels like {t}°. Less fabric, more air'],
      ],
      alt: [
        ['casual', 'Linen or cotton shorts', 'Let your legs breathe'],
        ['elegant', 'Loose linen trousers', 'A loose cut is as cool as shorts'],
        ['sporty', 'Light running shorts', 'Light and quick-drying'],
        ['elegant', 'Loose linen dress', 'A loose dress lets air through', 'kadin'],
      ],
      ayak: [
        ['casual', 'Sandals', 'Sandals are best in this heat'],
        ['elegant', 'Leather sandals or espadrilles', 'Espadrilles are a summer classic'],
        ['sporty', 'Sport sandals', 'Comfortable and sturdy'],
      ],
    },
  },
};

// Condition-driven extras (accessories, snow shoes, layer softening).
export const EXTRAS = {
  tr: {
    cold_acc: ['Bere, atkı ve eldiven', 'Isının çoğu baştan, boyundan ve ellerden kaçar'],
    cold_rain_acc: ['Şemsiye, bere ve eldiven', 'Hem ıslanma hem üşüme, ikisine de hazırlıklı ol'],
    sun_acc: ['Şapka ve güneş gözlüğü', 'Güneş tepede, başını ve gözlerini koru'],
    snow_shoe: ['Kaymaz tabanlı, su geçirmez bot', 'Kar ve buz kaygan olur, tabanı tırtıklı olsun'],
    dress_cold_top: ['İnce termal içlik ve kalın tayt', 'Elbisenin altına, ısıyı içeride tutar'],
    tights_cold: ' Altına kalın tayt giy.',
    tights_cool: ' Altına ince tayt iyi gider.',
    soft_mid: ['İnce polar ya da hırka (isteğe bağlı)', 'Montun zaten çok sıcak, üşürsen araya ince bir kat ekle'],
  },
  en: {
    cold_acc: ['Beanie, scarf and gloves', 'Most of your heat escapes from your head, neck and hands'],
    cold_rain_acc: ['Umbrella, beanie and gloves', 'Be ready for both rain and cold'],
    sun_acc: ['Cap and sunglasses', 'The sun is strong, protect your head and eyes'],
    snow_shoe: ['Non-slip, waterproof boots', 'Snow and ice get slippery, go for a grippy sole'],
    dress_cold_top: ['Thin thermal layer and thick tights', 'Under the dress, they keep the warmth in'],
    tights_cold: ' Wear thick tights underneath.',
    tights_cool: ' Thin tights work well underneath.',
    soft_mid: ['Thin fleece or cardigan (optional)', 'Your coat is already very warm, add a thin layer only if you feel cold'],
  },
};
