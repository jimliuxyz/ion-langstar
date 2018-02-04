// import * as GeptData from "./words.GEPT.7000.data";
// import * as GeptList from "./words.GEPT.7000.list";
const GeptData = null;
const GeptList = null;

class Word{
  quiz: string;
  ans: string;
  exp: string;
  tip: string;
}

class CateWordList{
  bylevel = {};
  bytype = {};
  bylvtype = {};
  all = {};
  all_sorted = [];
}

const types = {};
types['abbr'] = "縮寫字";
types['contraction'] = "縮略語";
types['ad'] = "副詞";
types['adj'] = "形容詞";
types['art'] = "冠詞";
types['aux'] = "助動詞";
types['conj'] = "連接詞";
types['int'] = "感嘆詞";
types['noun'] = "名詞";
types['prep'] = "介系詞";
types['pron'] = "代名詞";
types['verb'] = "動詞";

types['phr'] = "片語";
types['vt'] = "及物動詞";
types['vi'] = "不及物動詞";
types['nc'] = "可數名詞";
types['nuc'] = "不可數名詞";

types['pl'] = "複數";
types['pp'] = "過去完成式";
types['pt'] = "過去式";


let cate: CateWordList;
export const getCates = function () {
  if (cate)
    return cate;
  cate = new CateWordList();

  for (let key in GeptList) {
    const text = GeptList[key];
    const type = types[key.replace("word_", "")];

    parse(text, type);
  }
  //console.log(cate);

  const arr = [];
  for (const word of Object.keys(cate.all)) {
    arr.push(word);
  }
  cate.all_sorted = arr;
  // console.log(cate.all_sorted.join(","));
  
  // console.log(trans.text.substr(59140, 10))

  // getWords(cate.bylvtype["GEPT-中級-代名詞"], "代名詞");
  // let tmp = getWords(cate.bytype["名詞"], "名詞").map(data=>data.quiz).join("\", \"");
  // console.log(tmp);
  
  return cate;
}
// getCates();

let transdata;
export const getWords = function (list: string[], type: string) {
  if (!transdata && GeptData)
    transdata = JSON.parse(GeptData.text);

  const output:Word[] = [];
  for (const word of list) {
    if (!transdata[word]) {
      console.log("word not found : " + word)
      continue;
    }

    let selected = transdata[word][type];
    if (!selected) selected = transdata[word]["unknown"];  
    if (!selected) selected = transdata[word][Object.keys(transdata[word])[0]];

    // console.log(selected)
    output.push(selected);
  }
  return output;
}

function parse(text: string, type: string) {
  const linearr = text.split('\n');
  
  for (const line of linearr){
    const items = line.split('\t\t');
    if (items.length!=3){
      if (line)
        console.warn("?" + line);
      continue;
    }
    const level = items[0];
    const lvtype = "GEPT-" + level + "-" + type;
    const word = items[1];


    if (!cate.bytype[type]) cate.bytype[type] = [];
    cate.bytype[type].push(word);

    if (!cate.bylevel[level]) cate.bylevel[level] = [];
    cate.bylevel[level].push(word);
    
    if (!cate.bylvtype[lvtype]) cate.bylvtype[lvtype] = [];
    cate.bylvtype[lvtype].push(word);

    cate.all[word] = null;
  }
}
