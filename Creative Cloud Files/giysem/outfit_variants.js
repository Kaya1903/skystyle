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
        ['elegant', 'İnce termal içlik, üstüne yün ya da kaşmir kazak', 'Hissedilen {t}°. Yün ince de olsa çok iyi ısıtır'],
        ['sporty', 'Termal spor içlik, üstüne kalın sweatshirt', 'Hissedilen {t}°. Nefes alan içlik hareket ederken de sıcak tutar'],
        ['bold', 'Termal içlik, üstüne renkli kalın örgü kazak', 'Hissedilen {t}°. Gri havaya renkli bir kazak iyi gelir'],
      ],
      ustune: [
        ['elegant', 'İnce yün hırka', 'Araya ince bir kat, montun altında şişkinlik yapmaz'],
        ['sporty', 'Fermuarlı polar', 'Araya bir kat daha, ısınınca fermuarı açarsın'],
      ],
      dis: [
        ['casual', 'Kapüşonlu kalın parka', 'Rüzgarı ve soğuğu keser, kapüşonu hazır dursun'],
        ['elegant', 'Uzun yün kaban', 'Uzun kaban dizlere kadar sıcak tutar'],
        ['sporty', 'Diz boyu şişme mont', 'Hafif ama çok sıcak, hareketini kısıtlamaz'],
        ['bold', 'Renkli şişme mont', 'Hem sıcak tutar hem soğuk havaya renk katar'],
      ],
      alt: [
        ['casual', 'Kalın astarlı kot', 'Astarlı kot hem rahat hem sıcak'],
        ['elegant', 'Yün pantolon, altına ince termal tayt', 'Pantolonun altında görünmez ama çok iyi ısıtır'],
        ['sporty', 'Polar astarlı eşofman altı', 'İçi polar, soğukta bacakların ısınır'],
        ['elegant', 'Kalın tayt üstüne uzun yün etek', 'Kalın tayt bacaklarını sıcak tutar', 'kadin'],
      ],
      ayak: [
        ['elegant', 'İçi astarlı deri bot', 'İçi astarlı deri bot hem şık hem sıcak'],
        ['sporty', 'Kalın tabanlı su geçirmez spor bot', 'Kalın taban yerden gelen soğuğu keser'],
      ],
    },
    soguk: {
      ust: [
        ['casual', 'Uzun kollu tişört, üstüne kalın sweatshirt', 'Hissedilen {t}°. İki kat; içeri girince birini çıkarırsın'],
        ['elegant', 'Gömlek, üstüne ince yün kazak', 'Hissedilen {t}°. Gömlek yakası kazağın üstünden şık durur'],
        ['sporty', 'Uzun kollu spor tişört, üstüne kapüşonlu', 'Hissedilen {t}°. Kapüşonlu hem sıcak tutar hem rahat'],
        ['bold', 'Renkli veya desenli kalın kazak', 'Hissedilen {t}°. Kombini renkli bir kazak taşısın'],
      ],
      dis: [
        ['casual', 'Kapitone ceket', 'Hafif ama sıcak, günün her saatine uyar'],
        ['elegant', 'Kısa yün kaban', 'Kısa kaban hem şık hem sıcak'],
        ['sporty', 'Kapüşonlu şişme ceket', 'Hafif şişme ceket soğuğu rahatça keser'],
        ['bold', 'Renkli kısa mont', 'Soğuk havaya biraz renk katar'],
      ],
      alt: [
        ['casual', 'Koyu renk kot', 'Kalın kot bu hava için yeterince sıcak'],
        ['elegant', 'Yün pantolon', 'Yün kumaş hem şık hem sıcak'],
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
        ['elegant', 'Düz renk gömlek', 'Hissedilen {t}°. Gömlek bu havada tek başına rahat'],
        ['sporty', 'Uzun kollu spor tişört', 'Hissedilen {t}°. Nefes alan kumaş hareket ederken bunaltmaz'],
        ['bold', 'Çizgili veya desenli uzun kollu üst', 'Hissedilen {t}°. Desen kombini canlandırır'],
      ],
      ustune: [
        ['casual', 'İnce sweatshirt', 'Serinlerse giyersin, ısınırsan çıkarırsın'],
        ['elegant', 'İnce örgü hırka', 'İnce hırka katmanlamaya çok yakışır'],
        ['sporty', 'Fermuarlı ince polar', 'Hafif polar hareket ederken rahat'],
      ],
      dis: [
        ['casual', 'Kot ceket', 'Kot ceket bu havanın klasiği'],
        ['elegant', 'Trençkot', 'Trençkot serin günlerde hem şık hem pratik'],
        ['sporty', 'İnce rüzgarlık', 'Hafif rüzgarlık çantaya da sığar'],
        ['bold', 'Renkli bomber ceket', 'Bomber ceket kombine karakter katar'],
      ],
      alt: [
        ['casual', 'Kot pantolon', 'Kot bu havada en rahat seçim'],
        ['elegant', 'Chino pantolon', 'Chino hem rahat hem derli toplu'],
        ['sporty', 'Jogger eşofman altı', 'Rahat ve hareketli bir gün için'],
        ['elegant', 'İnce tayt üstüne midi etek', 'İnce tayt serin havada yeterli', 'kadin'],
      ],
      ayak: [
        ['casual', 'Beyaz spor ayakkabı', 'Beyaz spor ayakkabı her şeye uyar'],
        ['elegant', 'Loafer veya deri bot', 'Kombini toparlayan klasik bir seçim'],
        ['sporty', 'Koşu ayakkabısı', 'Gün boyu yürüyeceksen en rahatı'],
      ],
    },
    ilik: {
      ust: [
        ['casual', 'Pamuklu tişört', 'Hissedilen {t}°. Tek kat yeterli'],
        ['elegant', 'Keten gömlek', 'Hissedilen {t}°. Keten hem şık durur hem ferah tutar'],
        ['sporty', 'Nefes alan spor tişört', 'Hissedilen {t}°. Nefes alan kumaş rahat ettirir'],
        ['bold', 'Renkli ya da baskılı tişört', 'Hissedilen {t}°. Güzel havaya renkli bir tişört'],
        ['elegant', 'Hafif bluz', 'Hissedilen {t}°. Hafif bir bluz yeterli', 'kadin'],
      ],
      ustune: [
        ['elegant', 'İnce hırka (yanında bulunsun)', 'Akşamüstü serinlerse omzuna alırsın'],
        ['sporty', 'İnce sweatshirt (yanında bulunsun)', 'Akşamüstü serinlerse giyersin'],
      ],
      alt: [
        ['casual', 'Açık renk kot', 'Açık renk kot ılık havaya çok yakışır'],
        ['elegant', 'Keten pantolon', 'Keten pantolon hafif ve şık'],
        ['sporty', 'İnce jogger', 'Rahat bir gün için'],
        ['elegant', 'Midi elbise', 'Ilık havada tek parça elbise en rahatı', 'kadin'],
      ],
      ayak: [
        ['casual', 'Kanvas spor ayakkabı', 'Hafif ve nefes alır'],
        ['elegant', 'Makosen', 'Loafer ılık havada şık ve rahat'],
        ['sporty', 'Hafif koşu ayakkabısı', 'Gün boyu rahat'],
      ],
    },
    sicak: {
      ust: [
        ['casual', 'İnce pamuklu tişört', 'Hissedilen {t}°. İnce kumaş bunaltmaz'],
        ['elegant', 'Kısa kollu keten gömlek', 'Hissedilen {t}°. Keten sıcağı en iyi taşıyan kumaş'],
        ['sporty', 'Kolsuz spor atlet', 'Hissedilen {t}°. Kolsuz üst ferah tutar'],
        ['bold', 'Renkli desenli gömlek', 'Hissedilen {t}°. Güneşli havaya renkli bir gömlek yakışır'],
        ['elegant', 'İnce askılı üst', 'Hissedilen {t}°. Hafif ve ferah', 'kadin'],
      ],
      alt: [
        ['casual', 'Kot şort', 'Kot şort sıcakta rahat'],
        ['elegant', 'Keten pantolon', 'Geniş paça keten pantolon şort kadar serin tutar'],
        ['sporty', 'Spor şort', 'Hafif ve hareketli'],
        ['elegant', 'Hafif yazlık elbise', 'Yazlık elbise sıcakta en rahatı', 'kadin'],
      ],
      ayak: [
        ['casual', 'Kanvas ayakkabı veya sandalet', 'Ayakların nefes alsın'],
        ['elegant', 'Deri sandalet', 'Deri sandalet şık ve ferah'],
        ['sporty', 'Fileli spor ayakkabı', 'File kumaş ayakları ferah tutar'],
      ],
    },
    cok_sicak: {
      ust: [
        ['casual', 'Beyaz ince tişört', 'Hissedilen {t}°. Açık renk güneş ışığını geri yansıtır'],
        ['elegant', 'Açık renk keten gömlek, kollar sıvalı', 'Hissedilen {t}°. Açık renk keten en serin ikili'],
        ['sporty', 'Kolsuz, ter atan atlet', 'Hissedilen {t}°. Az kumaş, bol hava'],
      ],
      alt: [
        ['casual', 'Keten ya da pamuklu şort', 'Bacakların nefes alsın'],
        ['elegant', 'Geniş paça keten pantolon', 'Bol kesim sıcakta şort kadar ferah'],
        ['sporty', 'Hafif koşu şortu', 'Hafif ve çabuk kurur'],
        ['elegant', 'Bol keten elbise', 'Bol kesim elbise hava alır', 'kadin'],
      ],
      ayak: [
        ['casual', 'Sandalet', 'Sıcakta sandalet en rahatı'],
        ['elegant', 'Deri sandalet ya da espadril', 'Espadril sıcak havalarda en rahat seçeneklerden'],
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

// Gender-specific pools, so women's and men's suggestions actually differ.
// Same shape as VARIANTS; entries are [vibe, item, reason]. The engine prefers
// these over the neutral pool when a gender is chosen.
export const GENDERED = {
  tr: {
    kadin: {
      dondurucu: {
        ust: [
          ['casual', 'Termal içlik, üstüne uzun balıkçı yaka triko', 'Hissedilen {t}°. Uzun triko beli de örter, soğuk içeri sızmaz'],
          ['elegant', 'İnce termal içlik, üstüne kaşmir kazak', 'Hissedilen {t}°. Kaşmir ince ama çok sıcak tutar'],
          ['sporty', 'Termal üst, üstüne kalın kapüşonlu', 'Hissedilen {t}°. Nefes alan üst hareketi destekler, kapüşon ısıyı tutar'],
          ['bold', 'Termal içlik, üstüne renkli desenli triko', 'Hissedilen {t}°. Soğuk günde renkli bir triko iyi gelir'],
        ],
        dis: [
          ['casual', 'Uzun, kapüşonlu kaz tüyü mont', 'Dizlere kadar örter, kapüşonu rüzgarı keser'],
          ['elegant', 'Belden oturan uzun yün kaban', 'Uzun kaban hem şık hem sıcak'],
          ['sporty', 'Uzun şişme mont', 'Hafif ama çok sıcak'],
        ],
        alt: [
          ['casual', 'Polar tayt üstüne kalın örgü elbise', 'Polar tayt soğuğu keser'],
          ['elegant', 'Yün pantolon, altına termal tayt', 'Termal tayt görünmez ama çok ısıtır'],
          ['sporty', 'Polar astarlı tayt, üstüne uzun sweatshirt', 'Rahat ve sıcak, hareket etmesi kolay'],
        ],
        ayak: [
          ['casual', 'İçi kürklü su geçirmez bot', 'Kürk iç astar ayaklarını sıcak tutar'],
          ['elegant', 'Diz altı astarlı deri çizme', 'Uzun çizme bacaklarını da korur'],
          ['sporty', 'Kalın tabanlı kar botu', 'Kalın taban karda kaymaz ve soğuğu keser'],
        ],
      },
      soguk: {
        ust: [
          ['casual', 'Boğazlı triko', 'Hissedilen {t}°. Boğazlı yaka boynunu sıcak tutar'],
          ['elegant', 'Gömlek yakalı ince kazak', 'Hissedilen {t}°. Yaka kazağın üstünden şık durur'],
          ['sporty', 'Kapüşonlu sweatshirt', 'Hissedilen {t}°. Rahat ve sıcak'],
          ['bold', 'Renkli örgü kazak', 'Hissedilen {t}°. Kombini renkli kazak taşısın'],
        ],
        dis: [
          ['casual', 'Kısa kapitone mont', 'Hafif ama sıcak'],
          ['elegant', 'Kaşe kaban', 'Kaşe kaban soğuk günlerin klasiği'],
          ['sporty', 'Kapüşonlu şişme ceket', 'Soğuğu rahatça keser'],
        ],
        alt: [
          ['casual', 'Kalın tayt, üstüne triko elbise', 'Triko elbise ve kalın tayt sıcak tutar'],
          ['elegant', 'Yüksek bel kumaş pantolon', 'Yüksek bel hem şık hem sıcak'],
          ['sporty', 'Kalın tayt', 'Rahat ve hareketli bir gün için'],
        ],
        ayak: [
          ['casual', 'Bilekli bot', 'Sıcak tutar ve kaymaz'],
          ['elegant', 'Alçak topuklu deri bot', 'Deri bot her kombine yakışır'],
          ['sporty', 'Kalın tabanlı spor ayakkabı', 'Kalın taban soğuğu keser'],
        ],
      },
      serin: {
        ust: [
          ['casual', 'Çizgili uzun kollu tişört', 'Hissedilen {t}°. Uzun kol tek başına yetebilir'],
          ['elegant', 'Saten gömlek', 'Hissedilen {t}°. Saten gömlek serin havada şık durur'],
          ['sporty', 'Kısa sweatshirt', 'Hissedilen {t}°. Rahat ve sıcak tutar'],
        ],
        dis: [
          ['casual', 'Kot ceket', 'Serin günlerin klasiği'],
          ['elegant', 'Klasik trençkot', 'Trençkot serin havada en şık seçim'],
          ['sporty', 'İnce bomber ceket', 'Hafif ve rahat'],
        ],
        ustune: [
          ['casual', 'İnce hırka', 'Serinlerse giyersin'],
          ['elegant', 'Uzun örgü hırka', 'Uzun hırka zarif durur'],
        ],
        alt: [
          ['casual', 'Yüksek bel kot', 'Rahat ve her şeye uyar'],
          ['elegant', 'Midi etek, altına ince tayt', 'İnce tayt serin havada yeterli'],
          ['sporty', 'Tayt', 'Hareketli bir gün için'],
        ],
        ayak: [
          ['casual', 'Beyaz spor ayakkabı', 'Her kombine uyar'],
          ['elegant', 'Babet veya loafer', 'Babet kombini zarif kılar'],
          ['sporty', 'Koşu ayakkabısı', 'Gün boyu rahat'],
        ],
      },
      ilik: {
        ust: [
          ['casual', 'Bisiklet yaka tişört', 'Hissedilen {t}°. Tek kat yeterli'],
          ['elegant', 'Hafif bluz', 'Hissedilen {t}°. Hafif bluz ılık havaya çok yakışır'],
          ['sporty', 'Hafif spor tişört', 'Hissedilen {t}°. Nefes alır'],
        ],
        alt: [
          ['casual', 'Kot etek', 'Ilık havada rahat'],
          ['elegant', 'Midi elbise', 'Tek parça elbise en rahatı'],
          ['sporty', 'Bisiklet taytı veya jogger', 'Rahat ve hareketli'],
        ],
        ayak: [
          ['casual', 'Kanvas ayakkabı', 'Hafif ve rahat'],
          ['elegant', 'Babet', 'Zarif ve rahat'],
          ['sporty', 'Hafif spor ayakkabı', 'Gün boyu rahat'],
        ],
      },
      sicak: {
        ust: [
          ['casual', 'Askılı bluz veya crop üst', 'Hissedilen {t}°. Hafif ve ferah'],
          ['elegant', 'İpek askılı bluz', 'Hissedilen {t}°. İpek tene serin gelir'],
          ['sporty', 'Spor atlet', 'Hissedilen {t}°. Kolsuz ferah tutar'],
        ],
        alt: [
          ['casual', 'Kot şort', 'Sıcakta rahat'],
          ['elegant', 'Uçuşan midi etek', 'Uçuşan kumaş hava alır'],
          ['sporty', 'Spor şort', 'Hafif ve hareketli'],
          ['bold', 'Renkli yazlık elbise', 'Güneşli havaya renkli bir elbise'],
        ],
        ayak: [
          ['casual', 'Sandalet', 'Ayakların nefes alsın'],
          ['elegant', 'Bantlı sandalet', 'Şık ve ferah'],
          ['sporty', 'Fileli spor ayakkabı', 'Ayakları ferah tutar'],
        ],
      },
      cok_sicak: {
        ust: [
          ['casual', 'İnce askılı üst', 'Hissedilen {t}°. Az kumaş, bol hava'],
          ['elegant', 'Bol kesim keten bluz', 'Hissedilen {t}°. Keten en ferah kumaş'],
          ['sporty', 'Ter atan spor atlet', 'Hissedilen {t}°. Çabuk kurur'],
        ],
        alt: [
          ['casual', 'Keten şort', 'Bacakların nefes alsın'],
          ['elegant', 'Bol keten elbise', 'Bol kesim hava alır'],
          ['sporty', 'Hafif koşu şortu', 'Hafif ve çabuk kurur'],
        ],
        ayak: [
          ['casual', 'Terlik veya sandalet', 'Sıcakta en rahatı'],
          ['elegant', 'Espadril', 'Sıcak günler için şık bir seçenek'],
          ['sporty', 'Spor sandalet', 'Rahat ve sağlam'],
        ],
      },
    },
    erkek: {
      dondurucu: {
        ust: [
          ['casual', 'Termal içlik, üstüne kalın balıkçı yaka kazak', 'Hissedilen {t}°. Balıkçı yaka boynunu da korur'],
          ['elegant', 'Termal içlik, üstüne merinos yün kazak', 'Hissedilen {t}°. Merinos yün ince ama çok iyi ısıtır'],
          ['sporty', 'Termal spor içlik, üstüne polar sweatshirt', 'Hissedilen {t}°. Nefes alır, sıcak tutar'],
          ['bold', 'Termal içlik, üstüne renkli kalın kazak', 'Hissedilen {t}°. Gri havaya renkli bir kazak'],
        ],
        dis: [
          ['casual', 'Kapüşonlu kaz tüyü parka', 'Rüzgarı ve soğuğu keser'],
          ['elegant', 'Uzun yün kaban, yanında kaşmir atkı', 'Uzun kaban dizlere kadar sıcak tutar'],
          ['sporty', 'Teknik kayak montu', 'Rüzgar kesen ve suya dayanıklı, çok sıcak'],
        ],
        alt: [
          ['casual', 'Kalın astarlı kot, altına termal tayt', 'Termal tayt kotun altında belli olmaz ama çok ısıtır'],
          ['elegant', 'Kalın yün pantolon, altına termal tayt', 'Yün ve termal birlikte soğuğu keser'],
          ['sporty', 'Polarlı outdoor pantolon', 'Rüzgar kesen kumaş, içi polar'],
        ],
        ayak: [
          ['casual', 'Su geçirmez kalın tabanlı bot', 'Yerden gelen soğuğu keser'],
          ['elegant', 'İçi astarlı deri bot', 'Şık ve sıcak'],
          ['sporty', 'Kar ve doğa botu', 'Karda kaymaz, ayakları kuru tutar'],
        ],
      },
      soguk: {
        ust: [
          ['casual', 'Kalın sweatshirt', 'Hissedilen {t}°. Kalın sweatshirt tek başına iyi ısıtır'],
          ['elegant', 'Oxford gömlek, üstüne V yaka kazak', 'Hissedilen {t}°. Gömlek yakası kazağın üstünden şık durur'],
          ['sporty', 'Kapüşonlu sweatshirt', 'Hissedilen {t}°. Rahat ve sıcak'],
          ['bold', 'Renkli veya desenli kalın kazak', 'Hissedilen {t}°. Desen kombine karakter katar'],
        ],
        dis: [
          ['casual', 'Kapitone ceket', 'Hafif ama sıcak'],
          ['elegant', 'Kısa yün kaban', 'Kısa kaban hem şık hem sıcak'],
          ['sporty', 'Şişme ceket', 'Soğuğu rahatça keser'],
        ],
        alt: [
          ['casual', 'Koyu renk kot', 'Kalın kot bu hava için yeterli'],
          ['elegant', 'Yün pantolon', 'Şık ve sıcak'],
          ['sporty', 'Kalın eşofman altı', 'Rahat ve sıcak'],
        ],
        ayak: [
          ['casual', 'Bağcıklı bot', 'Sıcak tutar ve kaymaz'],
          ['elegant', 'Chelsea bot', 'Her kombine yakışır'],
          ['sporty', 'Kalın tabanlı spor ayakkabı', 'Kalın taban soğuğu keser'],
        ],
      },
      serin: {
        ust: [
          ['casual', 'Düğmeli yakalı uzun kollu tişört', 'Hissedilen {t}°. Uzun kol tek başına yetebilir'],
          ['elegant', 'Oxford gömlek', 'Hissedilen {t}°. Oxford gömlek her yere uyar'],
          ['sporty', 'Uzun kollu spor tişört', 'Hissedilen {t}°. Nefes alır'],
        ],
        dis: [
          ['casual', 'Kot ceket', 'Serin günlerin klasiği'],
          ['elegant', 'Hafif blazer', 'Blazer kombini toparlar'],
          ['sporty', 'Bomber ceket', 'Hafif ve rahat'],
        ],
        ustune: [
          ['casual', 'Fermuarlı ince sweatshirt', 'Serinlerse giyersin'],
          ['elegant', 'İnce triko hırka', 'Katmanlamaya çok yakışır'],
        ],
        alt: [
          ['casual', 'Kot pantolon', 'Rahat ve her şeye uyar'],
          ['elegant', 'Chino pantolon', 'Derli toplu ve rahat'],
          ['sporty', 'Jogger', 'Hareketli bir gün için'],
        ],
        ayak: [
          ['casual', 'Süet spor ayakkabı', 'Rahat ve şık'],
          ['elegant', 'Deri loafer', 'Kombini toparlar'],
          ['sporty', 'Koşu ayakkabısı', 'Gün boyu rahat'],
        ],
      },
      ilik: {
        ust: [
          ['casual', 'Pamuklu tişört', 'Hissedilen {t}°. Tek kat yeterli'],
          ['elegant', 'Polo yaka tişört', 'Hissedilen {t}°. Polo hem rahat hem derli toplu'],
          ['sporty', 'Nefes alan spor tişört', 'Hissedilen {t}°. Nefes alır'],
        ],
        alt: [
          ['casual', 'Açık renk kot', 'Ilık havaya yakışır'],
          ['elegant', 'Chino pantolon', 'Hafif ve şık'],
          ['sporty', 'İnce jogger', 'Rahat bir gün için'],
        ],
        ayak: [
          ['casual', 'Kanvas ayakkabı', 'Hafif ve rahat'],
          ['elegant', 'Süet loafer', 'Ilık havada şık'],
          ['sporty', 'Hafif koşu ayakkabısı', 'Gün boyu rahat'],
        ],
      },
      sicak: {
        ust: [
          ['casual', 'Pamuklu tişört', 'Hissedilen {t}°. İnce kumaş bunaltmaz'],
          ['elegant', 'Kısa kollu keten gömlek', 'Hissedilen {t}°. Keten sıcağı iyi taşır'],
          ['sporty', 'Kolsuz atlet', 'Hissedilen {t}°. Ferah tutar'],
          ['bold', 'Renkli desenli gömlek', 'Hissedilen {t}°. Güneşli havaya renkli bir gömlek yakışır'],
        ],
        alt: [
          ['casual', 'Kot şort', 'Sıcakta rahat'],
          ['elegant', 'Keten pantolon', 'Bol keten şort kadar ferah'],
          ['sporty', 'Spor şort', 'Hafif ve hareketli'],
        ],
        ayak: [
          ['casual', 'Kanvas ayakkabı', 'Hafif ve nefes alır'],
          ['elegant', 'Deri sandalet ya da espadril', 'Şık ve ferah'],
          ['sporty', 'Fileli spor ayakkabı', 'Ayakları ferah tutar'],
        ],
      },
      cok_sicak: {
        ust: [
          ['casual', 'Beyaz ince tişört', 'Hissedilen {t}°. Açık renk güneş ışığını yansıtır'],
          ['elegant', 'Keten gömlek, kollar sıvalı', 'Hissedilen {t}°. Keten en ferah kumaş'],
          ['sporty', 'Kolsuz atlet', 'Hissedilen {t}°. Az kumaş, bol hava'],
        ],
        alt: [
          ['casual', 'Keten şort', 'Bacakların nefes alsın'],
          ['elegant', 'Geniş paça keten pantolon', 'Bol kesim hava alır'],
          ['sporty', 'Koşu şortu', 'Hafif ve çabuk kurur'],
        ],
        ayak: [
          ['casual', 'Sandalet', 'Sıcakta en rahatı'],
          ['elegant', 'Espadril', 'Sıcak günler için şık bir seçim'],
          ['sporty', 'Spor sandalet', 'Rahat ve sağlam'],
        ],
      },
    },
  },
  en: {
    kadin: {
      dondurucu: {
        ust: [
          ['casual', 'Thermal layer under a long turtleneck knit', 'Feels like {t}°. A long knit covers your waist so no cold gets in'],
          ['elegant', 'Thin thermal layer under a cashmere sweater', 'Feels like {t}°. Cashmere is thin but very warm'],
          ['sporty', 'Thermal top under a thick hoodie', 'Feels like {t}°. The thermal wicks, the hoodie keeps the heat'],
          ['bold', 'Thermal layer under a colorful patterned knit', 'Feels like {t}°. A bright knit helps on a cold day'],
        ],
        dis: [
          ['casual', 'Long hooded down coat', 'Covers you to the knees, the hood blocks the wind'],
          ['elegant', 'Long belted wool coat', 'Smart and warm'],
          ['sporty', 'Long puffer', 'Light but very warm'],
        ],
        alt: [
          ['casual', 'Fleece-lined leggings under a thick knit dress', 'Fleece-lined leggings block the cold completely'],
          ['elegant', 'Wool trousers with thermal leggings underneath', 'The thermal layer stays hidden but adds warmth'],
          ['sporty', 'Fleece-lined leggings with a long sweatshirt', 'Comfortable, warm and easy to move in'],
        ],
        ayak: [
          ['casual', 'Fur-lined waterproof boots', 'The lining keeps your feet warm'],
          ['elegant', 'Below-the-knee lined leather boots', 'Tall boots protect your legs too'],
          ['sporty', 'Thick-soled snow boots', 'Grippy in snow and keep the cold out'],
        ],
      },
      soguk: {
        ust: [
          ['casual', 'Turtleneck knit', 'Feels like {t}°. A turtleneck keeps your neck warm'],
          ['elegant', 'Thin sweater with a shirt collar', 'Feels like {t}°. The collar looks sharp over the sweater'],
          ['sporty', 'Hoodie', 'Feels like {t}°. Easy and warm'],
          ['bold', 'Colorful knit sweater', 'Feels like {t}°. Let a colorful sweater lead'],
        ],
        dis: [
          ['casual', 'Short quilted jacket', 'Light but warm'],
          ['elegant', 'Wool-blend coat', 'The cold-weather classic'],
          ['sporty', 'Hooded puffer jacket', 'Handles the cold easily'],
        ],
        alt: [
          ['casual', 'Knit dress over thick tights', 'A knit dress and thick tights keep you warm'],
          ['elegant', 'High-waisted wool trousers', 'Smart and warm'],
          ['sporty', 'Thick leggings', 'For an active day'],
        ],
        ayak: [
          ['casual', 'Ankle boots', 'Warm and grippy'],
          ['elegant', 'Low-heeled leather boots', 'Leather boots suit any outfit'],
          ['sporty', 'Thick-soled sneakers', 'A thick sole keeps the cold out'],
        ],
      },
      serin: {
        ust: [
          ['casual', 'Striped long-sleeve tee', 'Feels like {t}°. Long sleeves may be enough'],
          ['elegant', 'Satin shirt', 'Feels like {t}°. Satin looks elegant on a cool day'],
          ['sporty', 'Cropped sweatshirt', 'Feels like {t}°. Comfortable and warm'],
        ],
        dis: [
          ['casual', 'Denim jacket', 'The classic for cool days'],
          ['elegant', 'Classic trench coat', 'The smartest choice in cool weather'],
          ['sporty', 'Light bomber jacket', 'Light and easy'],
        ],
        ustune: [
          ['casual', 'Thin cardigan', 'Put it on if it cools off'],
          ['elegant', 'Long knit cardigan', 'A long cardigan looks graceful'],
        ],
        alt: [
          ['casual', 'High-waisted jeans', 'Comfortable and goes with everything'],
          ['elegant', 'Midi skirt with thin tights', 'Thin tights are enough in cool weather'],
          ['sporty', 'Leggings', 'For an active day'],
        ],
        ayak: [
          ['casual', 'White sneakers', 'Go with everything'],
          ['elegant', 'Ballet flats or loafers', 'Flats make the outfit graceful'],
          ['sporty', 'Running shoes', 'Comfortable all day'],
        ],
      },
      ilik: {
        ust: [
          ['casual', 'Crew-neck tee', 'Feels like {t}°. One layer is enough'],
          ['elegant', 'Light blouse', 'Feels like {t}°. A light blouse suits mild weather'],
          ['sporty', 'Light sports tee', 'Feels like {t}°. Breathable'],
        ],
        alt: [
          ['casual', 'Denim skirt', 'Comfortable in mild weather'],
          ['elegant', 'Midi dress', 'A one-piece dress is easiest'],
          ['sporty', 'Bike shorts or joggers', 'Comfortable and active'],
        ],
        ayak: [
          ['casual', 'Canvas shoes', 'Light and comfortable'],
          ['elegant', 'Ballet flats', 'Graceful and comfortable'],
          ['sporty', 'Light sneakers', 'Comfortable all day'],
        ],
      },
      sicak: {
        ust: [
          ['casual', 'Strappy top or crop tee', 'Feels like {t}°. Light and cool'],
          ['elegant', 'Silk camisole', 'Feels like {t}°. Silk feels cool on the skin'],
          ['sporty', 'Sports tank', 'Feels like {t}°. Sleeveless keeps you cool'],
        ],
        alt: [
          ['casual', 'Denim shorts', 'Comfortable in the heat'],
          ['elegant', 'Flowy midi skirt', 'Flowy fabric lets air through'],
          ['sporty', 'Sports shorts', 'Light and active'],
          ['bold', 'Bright summer dress', 'A colorful dress for summer weather'],
        ],
        ayak: [
          ['casual', 'Sandals', 'Let your feet breathe'],
          ['elegant', 'Strappy sandals', 'Smart and cool'],
          ['sporty', 'Mesh sneakers', 'Keep your feet cool'],
        ],
      },
      cok_sicak: {
        ust: [
          ['casual', 'Thin strappy top', 'Feels like {t}°. Less fabric, more air'],
          ['elegant', 'Loose linen blouse', 'Feels like {t}°. Linen is the coolest fabric'],
          ['sporty', 'Wicking sports tank', 'Feels like {t}°. Dries quickly'],
        ],
        alt: [
          ['casual', 'Linen shorts', 'Let your legs breathe'],
          ['elegant', 'Loose linen dress', 'A loose cut lets air through'],
          ['sporty', 'Light running shorts', 'Light and quick-drying'],
        ],
        ayak: [
          ['casual', 'Flip-flops or sandals', 'Easiest in the heat'],
          ['elegant', 'Espadrilles', 'A summer classic'],
          ['sporty', 'Sport sandals', 'Comfortable and sturdy'],
        ],
      },
    },
    erkek: {
      dondurucu: {
        ust: [
          ['casual', 'Thermal layer under a thick turtleneck', 'Feels like {t}°. A turtleneck protects your neck too'],
          ['elegant', 'Thermal layer under a merino sweater', 'Feels like {t}°. Merino is thin but very warm'],
          ['sporty', 'Thermal sports layer under a fleece sweatshirt', 'Feels like {t}°. Wicks sweat, keeps you warm'],
          ['bold', 'Thermal layer under a bright chunky sweater', 'Feels like {t}°. A bright sweater on a grey day'],
        ],
        dis: [
          ['casual', 'Hooded down parka', 'Blocks wind and cold'],
          ['elegant', 'Long wool overcoat with a cashmere scarf', 'A long coat keeps you warm to the knees'],
          ['sporty', 'Technical ski jacket', 'Wind- and waterproof, very warm'],
        ],
        alt: [
          ['casual', 'Lined heavy jeans with thermal leggings underneath', 'Thermals stay hidden under jeans but add a lot of warmth'],
          ['elegant', 'Heavy wool trousers with thermal leggings underneath', 'Wool and thermals together beat the cold'],
          ['sporty', 'Fleece-lined outdoor trousers', 'Windproof shell, fleece inside'],
        ],
        ayak: [
          ['casual', 'Thick-soled waterproof boots', 'Keep the cold of the ground away'],
          ['elegant', 'Lined leather boots', 'Smart and warm'],
          ['sporty', 'Snow and hiking boots', 'Grippy in snow, keep your feet dry'],
        ],
      },
      soguk: {
        ust: [
          ['casual', 'Heavy sweatshirt', 'Feels like {t}°. A heavy sweatshirt warms well on its own'],
          ['elegant', 'Oxford shirt under a V-neck sweater', 'Feels like {t}°. Let the shirt collar show'],
          ['sporty', 'Hoodie', 'Feels like {t}°. Easy and warm'],
          ['bold', 'Patterned chunky sweater', 'Feels like {t}°. A pattern adds character'],
        ],
        dis: [
          ['casual', 'Quilted jacket', 'Light but warm'],
          ['elegant', 'Short wool coat', 'Smart and warm'],
          ['sporty', 'Puffer jacket', 'Handles the cold easily'],
        ],
        alt: [
          ['casual', 'Dark jeans', 'Heavy jeans are enough today'],
          ['elegant', 'Wool trousers', 'Smart and warm'],
          ['sporty', 'Heavy joggers', 'Comfortable and warm'],
        ],
        ayak: [
          ['casual', 'Lace-up boots', 'Warm and grippy'],
          ['elegant', 'Chelsea boots', 'Go with any outfit'],
          ['sporty', 'Thick-soled sneakers', 'A thick sole keeps the cold out'],
        ],
      },
      serin: {
        ust: [
          ['casual', 'Long-sleeve henley', 'Feels like {t}°. Long sleeves may be enough'],
          ['elegant', 'Oxford shirt', 'Feels like {t}°. An Oxford shirt works anywhere'],
          ['sporty', 'Long-sleeve sports top', 'Feels like {t}°. Breathable'],
        ],
        dis: [
          ['casual', 'Denim jacket', 'The classic for cool days'],
          ['elegant', 'Light blazer', 'A blazer pulls the outfit together'],
          ['sporty', 'Bomber jacket', 'Light and easy'],
        ],
        ustune: [
          ['casual', 'Light zip-up sweatshirt', 'Put it on if it cools off'],
          ['elegant', 'Fine-knit cardigan', 'Great for layering'],
        ],
        alt: [
          ['casual', 'Jeans', 'Comfortable and goes with everything'],
          ['elegant', 'Chinos', 'Neat and comfortable'],
          ['sporty', 'Joggers', 'For an active day'],
        ],
        ayak: [
          ['casual', 'Suede sneakers', 'Comfortable and smart'],
          ['elegant', 'Leather loafers', 'Pull the outfit together'],
          ['sporty', 'Running shoes', 'Comfortable all day'],
        ],
      },
      ilik: {
        ust: [
          ['casual', 'Cotton tee', 'Feels like {t}°. One layer is enough'],
          ['elegant', 'Polo shirt', 'Feels like {t}°. A polo is easy and neat'],
          ['sporty', 'Breathable sports tee', 'Feels like {t}°. Wicks sweat'],
        ],
        alt: [
          ['casual', 'Light-wash jeans', 'Suit mild weather'],
          ['elegant', 'Chinos', 'Light and smart'],
          ['sporty', 'Light joggers', 'For an easy day'],
        ],
        ayak: [
          ['casual', 'Canvas shoes', 'Light and comfortable'],
          ['elegant', 'Suede loafers', 'Smart in mild weather'],
          ['sporty', 'Light running shoes', 'Comfortable all day'],
        ],
      },
      sicak: {
        ust: [
          ['casual', 'Cotton tee', 'Feels like {t}°. Thin fabric keeps you from sweating'],
          ['elegant', 'Short-sleeve linen shirt', 'Feels like {t}°. Linen handles heat well'],
          ['sporty', 'Tank top', 'Feels like {t}°. Keeps you cool'],
          ['bold', 'Bright printed shirt', 'Feels like {t}°. Summer weather deserves a colorful shirt'],
        ],
        alt: [
          ['casual', 'Denim shorts', 'Comfortable in the heat'],
          ['elegant', 'Linen trousers', 'Loose linen is as cool as shorts'],
          ['sporty', 'Sports shorts', 'Light and active'],
        ],
        ayak: [
          ['casual', 'Canvas shoes', 'Light and breathable'],
          ['elegant', 'Leather sandals or espadrilles', 'Smart and cool'],
          ['sporty', 'Mesh sneakers', 'Keep your feet cool'],
        ],
      },
      cok_sicak: {
        ust: [
          ['casual', 'Thin white tee', 'Feels like {t}°. Light colors reflect the sun'],
          ['elegant', 'Linen shirt, sleeves rolled', 'Feels like {t}°. Linen is the coolest fabric'],
          ['sporty', 'Tank top', 'Feels like {t}°. Less fabric, more air'],
        ],
        alt: [
          ['casual', 'Linen shorts', 'Let your legs breathe'],
          ['elegant', 'Loose linen trousers', 'A loose cut lets air through'],
          ['sporty', 'Running shorts', 'Light and quick-drying'],
        ],
        ayak: [
          ['casual', 'Sandals', 'Easiest in the heat'],
          ['elegant', 'Espadrilles', 'A smart summer choice'],
          ['sporty', 'Sport sandals', 'Comfortable and sturdy'],
        ],
      },
    },
  },
};

// Extra layers by how cold or hot it really is (bands are wide; -1° and -23°
// both sit in "dondurucu"). Level 1: below -5°, 2: below -11°, 3: below -17°.
export const INTENSITY = {
  tr: {
    thermal_legs: ' Altına termal tayt giy.',
    wool_socks: ' Yün çorapla giy.',
    deep_coat: ['Uzun, kapüşonlu kaz tüyü parka', 'Bu soğukta en kalın montunu giy, kapüşonu da kapat'],
    l2_acc: ['Bere, boyunluk ve kalın eldiven', 'Bu soğukta açıkta kalan ten çabuk üşür, yüzünü ve ellerini koru'],
    l3_acc: ['Kar maskesi, kalın eldiven ve yün çorap', 'Dışarıda uzun kalma; açıkta kalan ten çabuk soğur'],
    l3_layers: ' Kat kat giyin; iki ince kat tek kalından daha iyi ısıtır.',
    gale: ' Rüzgar çok sert, yüzünü açıkta bırakma.',
    heat_acc: ['Güneş gözlüğü, şapka ve matara', 'Bu sıcakta uzun süre güneşte kalma, bol su iç'],
  },
  en: {
    thermal_legs: ' Wear thermal leggings underneath.',
    wool_socks: ' Wear them with wool socks.',
    deep_coat: ['Long hooded down parka', 'Wear your warmest coat in this cold, hood up'],
    l2_acc: ['Beanie, neck gaiter and thick gloves', 'Exposed skin gets cold fast in this, protect your face and hands'],
    l3_acc: ['Balaclava, thick gloves and wool socks', 'Don\'t stay out long; exposed skin can freeze within minutes'],
    l3_layers: ' Layer up, two thin layers warm better than one thick one.',
    gale: ' The wind is very strong, keep your face covered.',
    heat_acc: ['Sunglasses, a hat and a water bottle', 'Avoid long stretches in the sun and drink plenty of water'],
  },
};

// Tops written as two layers in one line ("thermal under a sweater") are split
// into the base layer (ust) and the warm layer (ustune), so an outfit never
// lists a sweater and a cardigan together. combo -> [base layer, warm layer]
export const LAYER_SPLIT = {
  tr: {
    'İnce termal içlik, üzerine kalın örgü kazak': ['İnce termal içlik', 'Kalın örgü kazak'],
    'İnce termal içlik, üzerine kalın triko kazak': ['İnce termal içlik', 'Kalın triko kazak'],
    'Kalın kumaşlı düz tişört, üstüne kalın örgü kazak': ['Kalın kumaşlı düz tişört', 'Kalın örgü kazak'],
    'Kalın kumaşlı düz tişört, üstüne kalın triko kazak': ['Kalın kumaşlı düz tişört', 'Kalın triko kazak'],
    'Termal içlik, üstüne kalın balıkçı yaka kazak': ['Termal içlik', 'Kalın balıkçı kazak'],
    'İnce termal içlik, üstüne yün ya da kaşmir kazak': ['İnce termal içlik', 'Yün ya da kaşmir kazak'],
    'Termal spor içlik, üstüne kalın sweatshirt': ['Termal spor içlik', 'Kalın sweatshirt'],
    'Termal içlik, üstüne renkli kalın örgü kazak': ['Termal içlik', 'Renkli kalın örgü kazak'],
    'Uzun kollu tişört, üstüne kalın sweatshirt': ['Uzun kollu tişört', 'Kalın sweatshirt'],
    'Gömlek, üstüne ince yün kazak': ['Gömlek', 'İnce yün kazak'],
    'Uzun kollu spor tişört, üstüne kapüşonlu': ['Uzun kollu spor tişört', 'Kapüşonlu sweatshirt'],
    'Termal içlik, üstüne uzun balıkçı yaka triko': ['Termal içlik', 'Uzun balıkçı kazak'],
    'İnce termal içlik, üstüne kaşmir kazak': ['İnce termal içlik', 'Kaşmir kazak'],
    'Termal üst, üstüne kalın kapüşonlu': ['Termal üst', 'Kalın kapüşonlu sweatshirt'],
    'Termal içlik, üstüne renkli desenli triko': ['Termal içlik', 'Renkli desenli triko'],
    'Termal içlik, üstüne merinos yün kazak': ['Termal içlik', 'Merinos yün kazak'],
    'Termal spor içlik, üstüne polar sweatshirt': ['Termal spor içlik', 'Polar sweatshirt'],
    'Termal içlik, üstüne renkli kalın kazak': ['Termal içlik', 'Renkli kalın kazak'],
    'Oxford gömlek, üstüne V yaka kazak': ['Oxford gömlek', 'V yaka kazak'],
  },
  en: {
    'Thin thermal base layer, thick knit sweater on top': ['Thin thermal base layer', 'Thick knit sweater'],
    'Thick, plain t-shirt with a heavy knit sweater on top': ['Thick, plain t-shirt', 'Heavy knit sweater'],
    'Thermal base layer under a thick turtleneck': ['Thermal base layer', 'Thick turtleneck'],
    'Thin thermal layer under a wool or cashmere sweater': ['Thin thermal base layer', 'Wool or cashmere sweater'],
    'Thermal sports layer under a thick sweatshirt': ['Thermal sports layer', 'Thick sweatshirt'],
    'Thermal layer under a bright chunky knit': ['Thermal base layer', 'Bright chunky knit'],
    'Long-sleeve tee under a thick sweatshirt': ['Long-sleeve tee', 'Thick sweatshirt'],
    'Shirt under a thin wool sweater': ['Shirt', 'Thin wool sweater'],
    'Long-sleeve sports top under a hoodie': ['Long-sleeve sports top', 'Hoodie'],
    'Thermal layer under a long turtleneck knit': ['Thermal base layer', 'Long turtleneck knit'],
    'Thin thermal layer under a cashmere sweater': ['Thin thermal base layer', 'Cashmere sweater'],
    'Thermal top under a thick hoodie': ['Thermal base layer', 'Thick hoodie'],
    'Thermal layer under a colorful patterned knit': ['Thermal base layer', 'Colorful patterned knit'],
    'Thermal layer under a thick turtleneck': ['Thermal base layer', 'Thick turtleneck'],
    'Thermal layer under a merino sweater': ['Thermal base layer', 'Merino sweater'],
    'Thermal sports layer under a fleece sweatshirt': ['Thermal sports layer', 'Fleece sweatshirt'],
    'Thermal layer under a bright chunky sweater': ['Thermal base layer', 'Bright chunky sweater'],
    'Oxford shirt under a V-neck sweater': ['Oxford shirt', 'V-neck sweater'],
  },
};

// Condition-driven extras (accessories, snow shoes, layer softening).
export const EXTRAS = {
  tr: {
    cold_acc: ['Bere, atkı ve eldiven', 'Isı en çok baştan, boyundan ve ellerden kaçar'],
    cold_rain_acc: ['Şemsiye, bere ve eldiven', 'Hem ıslanmaya hem soğuğa hazırlıklı ol'],
    sun_acc: ['Güneş gözlüğü ve şapka', 'Güneş tepede; gözünü ve başını koru'],
    cool_sun_acc: ['Güneş gözlüğü', 'Hava serin ama güneş açık, alçak güneş göz alabilir'],
    snow_shoe: ['Kaymaz tabanlı, su geçirmez bot', 'Kar ve buz kaygan olur, tırtıklı taban tercih et'],
    dress_cold_top: ['İnce termal içlik ve kalın tayt', 'Elbisenin altına, ısıyı içeride tutar'],
    tights_cold: ' Altına kalın tayt giy.',
    acc_rest_hat: ' Bereni ve eldivenini de unutma.',
    acc_rest_scarf: ' Atkını ve eldivenini de unutma.',
    acc_rest_all: ' Bere, atkı ve eldiveni de unutma.',
    tights_cool: ' Altına ince tayt iyi gider.',
    soft_mid: ['İnce polar ya da hırka (isteğe bağlı)', 'Montun zaten çok sıcak, üşürsen araya ince bir kat ekle'],
    rain_shoes_cold: ['Kalın tabanlı su geçirmez bot', 'Su geçirmez deri bot', 'Kalın çoraplı yağmur çizmesi', 'Su geçirmez, kalın tabanlı spor ayakkabı'],
    rain_shoes_mild: ['Kapalı, suya dayanıklı hafif ayakkabı', 'Su geçirmez spor ayakkabı', 'Yağmur çizmesi'],
    rain_shoes_hot: ['Kapalı, suya dayanıklı ayakkabı (sandalet ıslanır)', 'Su geçirmez spor ayakkabı', 'Yağmur çizmesi'],
    snow_shoes: ['Kaymaz tabanlı, su geçirmez bot', 'Kaymaz tabanlı kar botu'],
    base_thermal: ['İnce termal içlik', 'Hissedilen {t}°. En alta ince termal giy, ısıyı içeride tutsun'],
    base_plain_reason: 'Hissedilen {t}°. Kazağın altına düz, rahat bir kat',
    learn_mid: ['İnce bir hırka ya da polar', 'Böyle bir havada üşümüştün, bir kat daha ekledim'],
    learn_cold_note: ' Altına ince bir içlik ekle.',
    learn_warm_note: ' Bugün daha ince kumaşlar seç.',
    soft_mid_kadin: ['İnce örgü hırka (isteğe bağlı)', 'Montun zaten çok sıcak, üşürsen altına ince bir hırka giy'],
    soft_mid_erkek: ['İnce fermuarlı polar (isteğe bağlı)', 'Montun zaten çok sıcak, üşürsen altına ince bir polar giy'],
  },
  en: {
    cold_acc: ['Beanie, scarf and gloves', 'Most of your heat escapes from your head, neck and hands'],
    cold_rain_acc: ['Umbrella, beanie and gloves', 'Be ready for both rain and cold'],
    sun_acc: ['Sunglasses and a cap', 'The sun is strong, protect your eyes and head'],
    cool_sun_acc: ['Sunglasses', 'It is cool but clear, and the low sun can be glaring'],
    snow_shoe: ['Non-slip, waterproof boots', 'Snow and ice get slippery, go for a grippy sole'],
    dress_cold_top: ['Thin thermal layer and thick tights', 'Under the dress, they keep the warmth in'],
    tights_cold: ' Wear thick tights underneath.',
    acc_rest_hat: " Don't forget a hat and gloves too.",
    acc_rest_scarf: " Don't forget a scarf and gloves too.",
    acc_rest_all: " Don't forget a hat, scarf and gloves too.",
    tights_cool: ' Thin tights work well underneath.',
    soft_mid: ['Thin fleece or cardigan (optional)', 'Your coat is already very warm, add a thin layer only if you feel cold'],
    rain_shoes_cold: ['Waterproof, thick-soled boots', 'Waterproof leather boots', 'Rubber rain boots with warm socks', 'Waterproof, thick-soled sneakers'],
    rain_shoes_mild: ['Waterproof, light closed shoes', 'Waterproof sneakers', 'Rubber rain boots'],
    rain_shoes_hot: ['Waterproof, light closed shoes (sandals will get soaked today)', 'Waterproof sneakers', 'Rubber rain boots'],
    snow_shoes: ['Non-slip, waterproof boots', 'Snow boots with a grippy sole'],
    base_thermal: ['Thin thermal base layer', 'Feels like {t}°. Start with a thin thermal, it keeps the warmth in'],
    base_plain_reason: 'Feels like {t}°. A plain, comfortable layer under your sweater',
    learn_mid: ['A thin cardigan or fleece', 'You were cold in weather like this, so I added one more layer'],
    learn_cold_note: ' Add a thin thermal layer underneath.',
    learn_warm_note: ' Go for thinner fabrics today.',
    soft_mid_kadin: ['Thin knit cardigan (optional)', 'Your coat is already very warm, add a thin cardigan only if you feel cold'],
    soft_mid_erkek: ['Thin zip-up fleece (optional)', 'Your coat is already very warm, add a thin fleece only if you feel cold'],
  },
};
