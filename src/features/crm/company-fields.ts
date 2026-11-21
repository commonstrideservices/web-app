const industryAcronyms: ReadonlyMap<string, string> = new Map([
  ['ai', 'AI'], ['b2b', 'B2B'], ['b2c', 'B2C'], ['bpo', 'BPO'], ['fmcg', 'FMCG'],
  ['hr', 'HR'], ['ict', 'ICT'], ['it', 'IT'], ['ngo', 'NGO'], ['saas', 'SaaS'],
])

export function normalizeIndustry(value: string) {
  return titleCase(value, industryAcronyms)
}

export const subdivisionLabel = 'State / Province / Region'

function compactText(value: string) {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ')
}

function titleCase(value: string, acronyms?: ReadonlyMap<string, string>) {
  return compactText(value).replace(/\p{L}[\p{L}\p{M}\p{N}]*(?:['’][\p{L}\p{M}]+)*/gu, (word) => {
    const lower = word.toLocaleLowerCase('en')
    return acronyms?.get(lower) ?? lower.replace(/^\p{L}/u, (first) => first.toLocaleUpperCase('en'))
  })
}

export const industrySuggestions = [
  'Agriculture', 'Business Process Outsourcing (BPO)', 'Construction', 'Consumer Goods',
  'Education', 'Energy', 'Financial Services', 'Food And Beverage', 'Government', 'Healthcare',
  'Hospitality', 'Information Technology', 'Logistics', 'Manufacturing', 'Media And Entertainment',
  'Nonprofit', 'Professional Services', 'Real Estate', 'Retail', 'Technology', 'Telecommunications',
  'Transportation', 'Wholesale',
]

// ISO 3166-1 alpha-2 codes. Intl supplies the English display names.
const territoryCodes = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ
DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT
JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ
LA LB LC LI LK LR LS LT LU LV LY
MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
NA NC NE NF NG NI NL NO NP NR NU NZ OM
PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ
TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ
UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW
`.trim().split(/\s+/)

const countryDisplayNames = new Intl.DisplayNames('en', { type: 'region' })
const countriesByCode = new Map(territoryCodes.map((code) => [code, countryDisplayNames.of(code) ?? code]))

function countryKey(value: string) {
  return compactText(value).normalize('NFD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'").toLocaleLowerCase('en')
}

const countriesByName = new Map([...countriesByCode.values()].map((name) => [countryKey(name), name]))
const countryAliases = new Map([
  ['usa', 'US'], ['u.s.a.', 'US'], ['u.s.', 'US'], ['united states of america', 'US'],
  ['uk', 'GB'], ['u.k.', 'GB'], ['great britain', 'GB'], ['the philippines', 'PH'],
])

export const countrySuggestions = [...new Set(countriesByCode.values())].sort((left, right) => left.localeCompare(right, 'en'))

export function normalizeCountry(value: string) {
  const trimmed = compactText(value)
  const key = countryKey(trimmed)
  const code = countryAliases.get(key) ?? trimmed.toUpperCase()
  return countriesByName.get(key) ?? countriesByCode.get(code) ?? titleCase(trimmed)
}
