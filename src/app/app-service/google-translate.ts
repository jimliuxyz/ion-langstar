import { MiscFunc } from "./misc";


//https://cloud.google.com/translate/docs/languages
let langstr = `Afrikaans	af
Albanian	sq
Amharic	am
Arabic	ar
Armenian	hy
Azeerbaijani	az
Basque	eu
Belarusian	be
Bengali	bn
Bosnian	bs
Bulgarian	bg
Catalan	ca
Cebuano	ceb
Chinese (Simplified)	zh-CN
Chinese (Traditional)	zh-TW
Corsican	co
Croatian	hr
Czech	cs
Danish	da
Dutch	nl
English	en
Esperanto	eo
Estonian	et
Finnish	fi
French	fr
Frisian	fy
Galician	gl
Georgian	ka
German	de
Greek	el
Gujarati	gu
Haitian Creole	ht
Hausa	ha
Hawaiian	haw
Hebrew	iw
Hindi	hi
Hmong	hmn
Hungarian	hu
Icelandic	is
Igbo	ig
Indonesian	id
Irish	ga
Italian	it
Japanese	ja
Javanese	jw
Kannada	kn
Kazakh	kk
Khmer	km
Korean	ko
Kurdish	ku
Kyrgyz	ky
Lao	lo
Latin	la
Latvian	lv
Lithuanian	lt
Luxembourgish	lb
Macedonian	mk
Malagasy	mg
Malay	ms
Malayalam	ml
Maltese	mt
Maori	mi
Marathi	mr
Mongolian	mn
Myanmar (Burmese)	my
Nepali	ne
Norwegian	no
Nyanja (Chichewa)	ny
Pashto	ps
Persian	fa
Polish	pl
Portuguese (Portugal, Brazil)	pt
Punjabi	pa
Romanian	ro
Russian	ru
Samoan	sm
Scots Gaelic	gd
Serbian	sr
Sesotho	st
Shona	sn
Sindhi	sd
Sinhala (Sinhalese)	si
Slovak	sk
Slovenian	sl
Somali	so
Spanish	es
Sundanese	su
Swahili	sw
Swedish	sv
Tagalog (Filipino)	tl
Tajik	tg
Tamil	ta
Telugu	te
Thai	th
Turkish	tr
Ukrainian	uk
Urdu	ur
Uzbek	uz
Vietnamese	vi
Welsh	cy
Xhosa	xh
Yiddish	yi
Yoruba	yo
Zulu	zu`;

class GoogleLang{
  constructor(public code:string, public name:string) {
  }
}

function getCodeArr(): GoogleLang[]{
  const arr: GoogleLang[] = [];
  const langs= langstr.split("\n");

  for (const lang of langs){
    const pair = lang.split("\t");
    if (pair[1] === "haw") continue;
    if (pair[1] === "iw") continue;
    if (pair[1] === "hmn") continue;
    if (pair[1] === "jw") continue;
    
    arr.push(new GoogleLang(pair[1], pair[0]))
  }
  // console.log("GoogleLang", arr.map(lang=>lang.code));
  return arr;
}

const langarr = getCodeArr();


export class GoogleTranslate {

  static getLang(code: string): GoogleLang {
    code = MiscFunc.getLangCodeNormalize(code);
    let lang = langarr.find((lang) => {
      const code2 = MiscFunc.getLangCodeNormalize(lang.code);
      if (code === code2)
        return true;
    })
    return lang;
  }

  static async translate(srclang: string, desclang: string, content: string): Promise<string> {

    if (content.match(/^[A-Za-z0-9\s\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]*$/)) {
      srclang = "en";
    }
      
    try {
      let url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" 
      + this.getLang(srclang).code + "&tl=" + this.getLang(desclang).code + "&dt=t&q=" + encodeURI(content);
      // console.dir(url);

      let res = await fetch(url);
      let data = await res.json();

      // console.dir(data);

      let text = data[0][0][0];      
      return text;
    } catch (error) {
      // console.error(error);
      return content;
    }

  }

}

