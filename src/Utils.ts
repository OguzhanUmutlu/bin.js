import {String32Bin} from "./string/LengthBasedStringBin";
import UInt32Bin from "./number/UInt32Bin";

export const DefaultStringBin = String32Bin;
export const DefaultLengthBin = UInt32Bin;

export const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&\/=]*)/;
export const cuidRegex = /^c[^\s-]{8,}$/i;
export const cuid2Regex = /^[0-9a-z]+$/;
export const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
export const uuidRegex =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
export const nanoidRegex = /^[a-z0-9_-]{21}$/i;
export const durationRegex =
    /^[-+]?P(?!$)(?:[-+]?\d+Y|[-+]?\d+[.,]\d+Y$)?(?:[-+]?\d+M|[-+]?\d+[.,]\d+M$)?(?:[-+]?\d+W|[-+]?\d+[.,]\d+W$)?(?:[-+]?\d+D|[-+]?\d+[.,]\d+D$)?(?:T(?=[\d+-])(?:[-+]?\d+H|[-+]?\d+[.,]\d+H$)?(?:[-+]?\d+M|[-+]?\d+[.,]\d+M$)?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
export const emailRegex =
    /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
export const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
export const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
export const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9]))$/;
export const base64Regex =
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
export const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
export const dateRegex = new RegExp(`^${dateRegexSource}$`);