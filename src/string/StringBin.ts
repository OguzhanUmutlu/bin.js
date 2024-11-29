import {Bin} from "../Bin";
import {
    base64Regex,
    cuid2Regex,
    cuidRegex,
    dateRegex,
    durationRegex,
    emailRegex,
    ipv4Regex,
    ipv6Regex,
    nanoidRegex,
    ulidRegex
} from "../Utils";

export abstract class StringBin extends Bin<string> {
    private regexValue: RegExp | null = null;
    private lenMin = 0;
    private lenMax = Infinity;

    findStringProblems(value: any) {
        if (typeof value !== "string") return this.makeProblem("Expected a string");

        if (this.regexValue && !this.regexValue.test(value)) return this.makeProblem(`Expected a string matching the regex: /${this.regexValue.source}/`);

        if (value.length < this.lenMin) return this.makeProblem(`Expected a string of at least ${this.lenMin} characters`);

        if (value.length > this.lenMax) return this.makeProblem(`Expected a string of at most ${this.lenMax} characters`);
    };

    regex(re: RegExp | null) {
        const o = this.copy();
        o.regexValue = re;
        return o;
    };

    cuid(requires = true) {
        return this.regex(requires ? cuidRegex : null);
    };

    cuid2(requires = true) {
        return this.regex(requires ? cuid2Regex : null);
    };

    ulid(requires = true) {
        return this.regex(requires ? ulidRegex : null);
    };

    nanoid(requires = true) {
        return this.regex(requires ? nanoidRegex : null);
    };

    duration(requires = true) {
        return this.regex(requires ? durationRegex : null);
    };

    email(requires = true) {
        return this.regex(requires ? emailRegex : null);
    };

    ipv4(requires = true) {
        return this.regex(requires ? ipv4Regex : null);
    };

    ipv6(requires = true) {
        return this.regex(requires ? ipv6Regex : null);
    };

    base64(requires = true) {
        return this.regex(requires ? base64Regex : null);
    };

    date(requires = true) {
        return this.regex(requires ? dateRegex : null);
    };

    min(len: number) {
        const o = this.copy();
        o.lenMin = len;
        return o;
    };

    max(len: number) {
        const o = this.copy();
        o.lenMax = len;
        return o;
    };

    length(len: number) {
        return this.min(len).max(len);
    };

    copy() {
        const o = super.copy();
        o.regexValue = this.regexValue;
        o.lenMin = this.lenMin;
        o.lenMax = this.lenMax;
        return <this>o;
    };
}