const FULLWIDTH_OFFSET = 0xfee0;

function charToZenkaku(char: string): string {
  if (char === " ") return "　";
  const code = char.charCodeAt(0);
  if (code >= 0x21 && code <= 0x7e) {
    return String.fromCharCode(code + FULLWIDTH_OFFSET);
  }
  return char;
}

function charToHankaku(char: string): string {
  if (char === "　") return " ";
  const code = char.charCodeAt(0);
  if (code >= 0xff01 && code <= 0xff5e) {
    return String.fromCharCode(code - FULLWIDTH_OFFSET);
  }
  return char;
}

export function toZenkakuAscii(value: string): string {
  return [...value].map(charToZenkaku).join("");
}

export function toHankakuAscii(value: string): string {
  return [...value].map(charToHankaku).join("");
}

export function toUppercaseHankaku(value: string): string {
  return toHankakuAscii(value.toUpperCase());
}

export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

const ROMAJI_TABLE: Array<[RegExp, string]> = [
  [/kyou/gi, "きょう"],
  [/kyo/gi, "きょ"],
  [/kya/gi, "きゃ"],
  [/kyu/gi, "きゅ"],
  [/shi/gi, "し"],
  [/chi/gi, "ち"],
  [/tsu/gi, "つ"],
  [/ktsu/gi, "っ"],
  [/fu/gi, "ふ"],
  [/ji/gi, "じ"],
  [/dzu/gi, "づ"],
  [/ja/gi, "じゃ"],
  [/ju/gi, "じゅ"],
  [/jo/gi, "じょ"],
  [/ca/gi, "か"],
  [/ci/gi, "し"],
  [/cu/gi, "く"],
  [/ce/gi, "せ"],
  [/co/gi, "こ"],
  [/ba/gi, "ば"],
  [/bi/gi, "び"],
  [/bu/gi, "ぶ"],
  [/be/gi, "べ"],
  [/bo/gi, "ぼ"],
  [/pa/gi, "ぱ"],
  [/pi/gi, "ぴ"],
  [/pu/gi, "ぷ"],
  [/pe/gi, "ぺ"],
  [/po/gi, "ぽ"],
  [/da/gi, "だ"],
  [/di/gi, "ぢ"],
  [/du/gi, "づ"],
  [/de/gi, "で"],
  [/do/gi, "ど"],
  [/ga/gi, "が"],
  [/gi/gi, "ぎ"],
  [/gu/gi, "ぐ"],
  [/ge/gi, "げ"],
  [/go/gi, "ご"],
  [/za/gi, "ざ"],
  [/zi/gi, "じ"],
  [/zu/gi, "ず"],
  [/ze/gi, "ぜ"],
  [/zo/gi, "ぞ"],
  [/sa/gi, "さ"],
  [/si/gi, "し"],
  [/su/gi, "す"],
  [/se/gi, "せ"],
  [/so/gi, "そ"],
  [/ta/gi, "た"],
  [/te/gi, "て"],
  [/to/gi, "と"],
  [/na/gi, "な"],
  [/ni/gi, "に"],
  [/nu/gi, "ぬ"],
  [/ne/gi, "ね"],
  [/no/gi, "の"],
  [/ha/gi, "は"],
  [/hi/gi, "ひ"],
  [/hu/gi, "ふ"],
  [/he/gi, "へ"],
  [/ho/gi, "ほ"],
  [/ma/gi, "ま"],
  [/mi/gi, "み"],
  [/mu/gi, "む"],
  [/me/gi, "め"],
  [/mo/gi, "も"],
  [/ya/gi, "や"],
  [/yu/gi, "ゆ"],
  [/yo/gi, "よ"],
  [/ra/gi, "ら"],
  [/ri/gi, "り"],
  [/ru/gi, "る"],
  [/re/gi, "れ"],
  [/ro/gi, "ろ"],
  [/wa/gi, "わ"],
  [/wo/gi, "を"],
  [/nn/gi, "ん"],
  [/n(?![aeiouy])/gi, "ん"],
  [/a/gi, "あ"],
  [/i/gi, "い"],
  [/u/gi, "う"],
  [/e/gi, "え"],
  [/o/gi, "お"]
];

function romajiToHiragana(input: string): string {
  let result = input;
  for (const [pattern, hira] of ROMAJI_TABLE) {
    result = result.replace(pattern, hira);
  }
  return result;
}

function hiraganaToKatakana(input: string): string {
  return [...input].map((char) => {
    const code = char.charCodeAt(0);
    if (code >= 0x3041 && code <= 0x3096) {
      return String.fromCharCode(code + 0x60);
    }
    return char;
  }).join("");
}

export function toKatakanaZenkaku(value: string): string {
  const hiragana = romajiToHiragana(value);
  const katakana = hiraganaToKatakana(hiragana);
  return toZenkakuAscii(katakana);
}

export function splitBirthdate(value: string): { year: string; month: string; day: string } | null {
  const match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  return { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) };
}

export function splitPostal(value: string): { first3: string; last4: string } | null {
  const digits = digitsOnly(value);
  if (digits.length === 7) {
    return { first3: digits.slice(0, 3), last4: digits.slice(3) };
  }
  return null;
}

export function splitPhone(value: string): { first: string; second?: string; third?: string } {
  const digits = digitsOnly(value);
  if (digits.length >= 10) {
    return { first: digits.slice(0, 3), second: digits.slice(3, 7), third: digits.slice(7, 11) };
  }
  return { first: digits };
}
