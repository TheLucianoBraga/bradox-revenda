const ID_PAYLOAD_FORMAT = "00";
const ID_MERCHANT_ACCOUNT = "26";
const ID_MERCHANT_ACCOUNT_GUI = "00";
const ID_MERCHANT_ACCOUNT_KEY = "01";
const ID_MERCHANT_ACCOUNT_DESCRIPTION = "02";
const ID_MERCHANT_CATEGORY_CODE = "52";
const ID_TRANSACTION_CURRENCY = "53";
const ID_TRANSACTION_AMOUNT = "54";
const ID_COUNTRY_CODE = "58";
const ID_MERCHANT_NAME = "59";
const ID_MERCHANT_CITY = "60";
const ID_ADDITIONAL_DATA = "62";
const ID_ADDITIONAL_DATA_TXID = "05";
const ID_CRC16 = "63";

function sanitize(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .,@+\-_/]/g, "")
    .trim()
    .slice(0, maxLength);
}

function field(id: string, value: string) {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixCopyPaste(input: {
  pixKey: string;
  amount: number;
  receiverName?: string | null;
  receiverCity?: string | null;
  txid?: string | null;
  description?: string | null;
}) {
  const merchantAccount = [
    field(ID_MERCHANT_ACCOUNT_GUI, "br.gov.bcb.pix"),
    field(ID_MERCHANT_ACCOUNT_KEY, input.pixKey.trim()),
    input.description ? field(ID_MERCHANT_ACCOUNT_DESCRIPTION, sanitize(input.description, 72)) : "",
  ].join("");

  const txid = sanitize(input.txid || "BRADOX", 25) || "BRADOX";
  const payload = [
    field(ID_PAYLOAD_FORMAT, "01"),
    field(ID_MERCHANT_ACCOUNT, merchantAccount),
    field(ID_MERCHANT_CATEGORY_CODE, "0000"),
    field(ID_TRANSACTION_CURRENCY, "986"),
    field(ID_TRANSACTION_AMOUNT, input.amount.toFixed(2)),
    field(ID_COUNTRY_CODE, "BR"),
    field(ID_MERCHANT_NAME, sanitize(input.receiverName || "BRADOX DIGITAL", 25) || "BRADOX DIGITAL"),
    field(ID_MERCHANT_CITY, sanitize(input.receiverCity || "SAO PAULO", 15) || "SAO PAULO"),
    field(ID_ADDITIONAL_DATA, field(ID_ADDITIONAL_DATA_TXID, txid)),
    `${ID_CRC16}04`,
  ].join("");

  return `${payload}${crc16(payload)}`;
}
