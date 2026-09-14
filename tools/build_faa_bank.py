#!/usr/bin/env python3
"""Build official JKSSB FAA subject banks: 500 MCQs × 8 subjects.

Numerical keys are computed (not guessed). Theory items use standard
JKSSB / class-level facts. Deterministic seed for reproducible IDs.
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "qbanks" / "finance" / "faa"
N = 500
SEED = 2025

DIFFS = ["easy", "easy", "medium", "medium", "hard"]


def difficulty(i: int) -> str:
    return DIFFS[i % len(DIFFS)] if i % 5 != 4 else "hard"


def fmt(x: float) -> str:
    if abs(x - round(x)) < 1e-9:
        return str(int(round(x)))
    s = f"{x:.2f}".rstrip("0").rstrip(".")
    return s


def pack_options(correct, distractors, rng: random.Random):
    opts = [str(correct)]
    for d in distractors:
        ds = str(d)
        if ds not in opts:
            opts.append(ds)
    k = 0
    while len(opts) < 4:
        k += 1
        extra = f"None of the typical values ({k})"
        if extra not in opts:
            opts.append(extra)
    opts = opts[:4]
    rng.shuffle(opts)
    letters = "ABCD"
    packed = [{"id": letters[i], "text": opts[i]} for i in range(4)]
    key = letters[opts.index(str(correct))]
    return packed, key


def item(qid, subject, topic, question, options, key, expl, i, source="Generated syllabus drill (not an official JKSSB key)"):
    return {
        "question_id": qid,
        "question": question,
        "options": options,
        "correct_option": key,
        "subject": subject,
        "topic": topic,
        "subtopic": "",
        "difficulty": difficulty(i),
        "year": "2025",
        "exam": "Accounts Assistant (Finance)",
        "explanation": expl,
        "verification_status": "generated",
        "source": source,
        "tags": [subject, topic, difficulty(i)],
        "pool_type": "post_primary",
        "post_id": "accounts-assistant-finance",
    }


def write_bank(name: str, subject: str, questions: list[dict]):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.json"
    payload = {
        "post_id": "accounts-assistant-finance",
        "subject": subject,
        "question_count": len(questions),
        "schema": ["question_id", "question", "options", "correct_option", "subject", "topic", "difficulty", "explanation"],
        "questions": questions,
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {path} ({len(questions)})")


# ---------- Mathematics (computed) ----------
def gen_mathematics(rng: random.Random) -> list[dict]:
    sub = "Mathematics"
    qs = []
    seen: set[str] = set()
    i = 0

    def add(topic, q, correct, distractors, expl):
        nonlocal i
        if q in seen:
            return False
        seen.add(q)
        i += 1
        opts, key = pack_options(correct, distractors, rng)
        qs.append(item(f"faa-mathematics-{i:03d}", sub, topic, q, opts, key, expl, i - 1))
        return True

    n = 0
    while len(qs) < N:
        k = len(qs)
        kind = k % 10
        if kind == 0:
            P = 2000 + 25 * k
            R = 5 + (k % 8)
            T = 2 + (k % 5)
            ans = P * R * T / 100
            add("Simple interest", f"Find simple interest on ₹{P} at {R}% per annum for {T} years.",
                fmt(ans), [fmt(ans * 2), fmt(ans / 2 if ans else 1), fmt(P * R / 100)],
                f"SI = (P×R×T)/100 = ({P}×{R}×{T})/100 = {fmt(ans)}.")
        elif kind == 1:
            P = 1500 + 50 * k
            R = 5 + (k % 6)
            ans = P * (1 + R / 100) ** 2 - P
            add("Compound interest", f"Find compound interest on ₹{P} at {R}% per annum for 2 years, compounded annually.",
                fmt(round(ans, 2)), [fmt(P * R * 2 / 100), fmt(P), fmt(P * R / 100)],
                f"CI = P(1+R/100)^2 − P = {fmt(round(ans, 2))}.")
        elif kind == 2:
            s = 10 + k
            diff = 2 + (k % 6)
            x = (s + diff) / 2
            y = (s - diff) / 2
            add("Linear equations", f"If x + y = {s} and x − y = {diff}, then x equals:",
                fmt(x), [fmt(y), fmt(s), fmt(diff)],
                f"Add the equations: 2x = {s + diff} ⇒ x = {fmt(x)}.")
        elif kind == 3:
            nn = 8 + k
            r = 2 if k % 2 == 0 else 3
            perm = math.perm(nn, r)
            add("Permutations", f"The value of P({nn},{r}) is:",
                str(perm), [str(math.comb(nn, r)), str(nn * r), str(math.factorial(r))],
                f"P(n,r) = n!/(n−r)! = {perm}.")
        elif kind == 4:
            nn = 8 + k
            r = 2 if k % 2 == 0 else 3
            comb = math.comb(nn, r)
            add("Combinations", f"The value of C({nn},{r}) is:",
                str(comb), [str(math.perm(nn, r)), str(nn + r), str(nn * r)],
                f"C(n,r) = n!/(r!(n−r)!) = {comb}.")
        elif kind == 5:
            a, b, both = 20 + k, 30 + 2 * k, 10 + (k % 9)
            union = a + b - both
            add("Set Theory", f"If n(A) = {a}, n(B) = {b} and n(A∩B) = {both}, then n(A∪B) is:",
                str(union), [str(a + b), str(both), str(abs(a - b))],
                f"n(A∪B) = n(A)+n(B)−n(A∩B) = {union}.")
        elif kind == 6:
            w, x, y, z = 1 + (k % 9), 2 + (k % 8), 3 + (k % 7), 4 + k
            det = w * z - x * y
            add("Matrices & Determinants", f"The determinant of matrix [[{w}, {x}], [{y}, {z}]] is:",
                str(det), [str(w * z), str(w + z), str(x * y)],
                f"det = {w}×{z} − {x}×{y} = {det}.")
        elif kind == 7:
            red = 2 + (k % 5)
            total = 12 + k
            add("Probability", f"A bag has {red} red and {total - red} other balls. Probability of a red ball is:",
                f"{red}/{total}", [f"{total - red}/{total}", f"{red}/{total - red}", "1"],
                f"P = favourable/total = {red}/{total}.")
        elif kind == 8:
            coeff = 2 + k
            add("Limits & Derivatives", f"d/dx of {coeff}x² is:",
                f"{2 * coeff}x", [f"{coeff}x", f"{coeff}x²", str(2 * coeff)],
                f"Derivative of ax² is 2ax. Here 2×{coeff}x = {2 * coeff}x.")
        else:
            triples = [(3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25), (9, 40, 41)]
            a, b, c = triples[k % 5]
            scale = 1 + k
            add("Vectors", f"The magnitude of vector {a * scale}i + {b * scale}j is:",
                str(c * scale), [str((a + b) * scale), str(a * scale + b * scale), str(scale)],
                f"|a| = √(({a * scale})²+({b * scale})²) = {c * scale}.")
        n += 1
        if n > 5000:
            raise SystemExit("Mathematics: could not fill 500 unique stems")
    return qs[:N]


# ---------- Statistics (computed + theory) ----------
def gen_statistics(rng: random.Random) -> list[dict]:
    sub = "Statistics"
    qs: list[dict] = []
    seen: set[str] = set()
    theory = [
        ("Primary and secondary data", "Data collected by the investigator for the first time is called:", "Primary data", ["Secondary data", "Continuous data", "Discrete data"], "Primary data is original data collected first-hand."),
        ("Primary and secondary data", "Census reports, when used by a researcher, are an example of:", "Secondary data", ["Primary data", "Experimental data", "Dummy data"], "Published census figures are secondary for a later user."),
        ("Methods of collecting data", "Which is a method of collecting primary data?", "Direct personal interview", ["Gazetteer", "Journal reprint", "Old census table"], "Interview collects first-hand information."),
        ("Questionnaires", "A good questionnaire should preferably have:", "Clear and unambiguous questions", ["Leading questions only", "No instructions", "Unrelated items mixed randomly"], "Clarity reduces response error."),
        ("Tabulation", "The process of arranging data in rows and columns is:", "Tabulation", ["Sampling", "Editing", "Coding"], "Tabulation organises data for analysis."),
        ("Measures of central Tendency", "Which is not a measure of central tendency?", "Range", ["Mean", "Median", "Mode"], "Range is a measure of dispersion."),
        ("Measures of central Tendency", "The middle value of an ordered data set is the:", "Median", ["Mean", "Mode", "Range"], "Median is the positional middle value."),
        ("Measures of central Tendency", "The most frequent value in a dataset is the:", "Mode", ["Mean", "Median", "Variance"], "Mode = highest frequency value."),
        ("Theory of Probability", "Probability of an impossible event is:", "0", ["1", "0.5", "−1"], "An impossible event never occurs."),
        ("Theory of Probability", "Probability of a sure event is:", "1", ["0", "0.5", "2"], "A sure event always occurs."),
        ("Theory of Attributes", "In theory of attributes, a class frequency cannot be:", "Negative", ["Zero", "Positive", "An integer"], "Frequencies are non-negative."),
        ("Index Numbers", "Laspeyre’s price index uses weights of the:", "Base year", ["Current year", "Average of both years", "Next year"], "Laspeyre uses base-year quantities."),
        ("Index Numbers", "Paasche’s price index uses weights of the:", "Current year", ["Base year", "First year only", "Population"], "Paasche uses current-year quantities."),
        ("Index Numbers", "CPI commonly stands for:", "Consumer Price Index", ["Cost Price Index", "Central Price Indicator", "Current Profit Index"], "CPI tracks consumer prices."),
        ("Index Numbers", "WPI stands for:", "Wholesale Price Index", ["World Price Index", "Weekly Price Index", "Weighted Profit Index"], "WPI is wholesale price index."),
        ("Demography", "Census in India is conducted generally every:", "10 years", ["5 years", "2 years", "20 years"], "Indian Census is decennial."),
        ("Demography", "The last completed Census of India (as commonly cited in exams) is:", "2011", ["2021", "2001", "1991"], "Census 2021 was postponed; 2011 is the last completed."),
        ("Vital Statistics", "CBR stands for:", "Crude Birth Rate", ["Child Birth Ratio", "Census Birth Rate", "Combined Birth Rate"], "CBR = births per 1000 mid-year population."),
        ("Vital Statistics", "CDR stands for:", "Crude Death Rate", ["Child Death Ratio", "Census Death Rate", "Corrected Death Rate"], "CDR = deaths per 1000 mid-year population."),
        ("Vital Statistics", "GFR relates to:", "Fertility", ["Only mortality", "Only migration", "Only literacy"], "General Fertility Rate is a fertility measure."),
        ("Vital Statistics", "GRR and NRR are measures of:", "Reproduction / fertility", ["Only prices", "Only rainfall", "Only literacy"], "Gross and Net Reproduction Rates."),
        ("Vital Statistics", "IMR stands for:", "Infant Mortality Rate", ["Index Mortality Rate", "Internal Migration Rate", "Insured Mortality Ratio"], "IMR is infant deaths per 1000 live births."),
        ("Theory of Probability", "Two events that cannot occur together are:", "Mutually exclusive", ["Independent", "Exhaustive only", "Complementary only"], "Mutually exclusive events have empty intersection."),
        ("Tabulation", "A table showing frequencies of class intervals is a:", "Frequency distribution", ["Questionnaire", "Histogram only", "Pie only"], "Frequency distribution tabulates class frequencies."),
        ("Methods of collecting data", "Mail questionnaire is generally a method of collecting:", "Primary data", ["Secondary data only", "Dummy data", "Census tables"], "Filled questionnaires are first-hand responses."),
    ]
    i = 0

    def add_item(topic, q, c, wrong, expl):
        nonlocal i
        if q in seen:
            return False
        seen.add(q)
        i += 1
        opts, key = pack_options(c, wrong, rng)
        qs.append(item(f"faa-statistics-{i:03d}", sub, topic, q, opts, key, expl, i - 1))
        return True

    for t in theory:
        add_item(*t)

    n = 0
    while len(qs) < N:
        kind = n % 5
        if kind == 0:
            data = [2 + n + k for k in range(5)]
            mean = sum(data) / len(data)
            add_item(
                "Measures of central Tendency",
                f"The arithmetic mean of {', '.join(map(str, data))} is:",
                fmt(mean),
                [fmt(sum(data)), fmt(min(data)), fmt(max(data))],
                f"Mean = ({'+'.join(map(str, data))})/{len(data)} = {fmt(mean)}.",
            )
        elif kind == 1:
            base = 4 + n
            data = [base, base + 2, base + 4, base + 6, base + 8]
            med = data[2]
            add_item(
                "Measures of central Tendency",
                f"The median of {', '.join(map(str, data))} is:",
                str(med),
                [str(data[0]), str(data[-1]), fmt(sum(data) / 5)],
                "For 5 ordered values, median is the 3rd value.",
            )
        elif kind == 2:
            m = 3 + n
            data = [m, m, m, m + 2, m + 5]
            add_item(
                "Measures of central Tendency",
                f"The mode of {', '.join(map(str, data))} is:",
                str(m),
                [str(m + 2), str(m + 5), str(data[-1])],
                f"{m} occurs most frequently.",
            )
        elif kind == 3:
            a, b = 2 + n, 20 + 2 * n
            add_item(
                "Measures of central Tendency",
                f"The range of data whose smallest value is {a} and largest is {b} is:",
                str(b - a),
                [str(a + b), str(b), str(a)],
                "Range = largest − smallest.",
            )
        else:
            red = 2 + (n % 7)
            total = 8 + n
            add_item(
                "Theory of Probability",
                f"A bag has {red} red and {total - red} blue balls. Probability of drawing a red ball is:",
                f"{red}/{total}",
                [f"{total - red}/{total}", f"{red}/{total - red}", "1"],
                f"P = favourable/total = {red}/{total}.",
            )
        n += 1
        if n > 5000:
            raise SystemExit("Statistics: could not fill 500 unique stems")
    return qs[:N]


# Remaining generators continue in main()
def gen_from_theory(prefix: str, subject: str, rows: list[tuple], rng: random.Random, filler=None) -> list[dict]:
    qs = []
    seen = set()
    i = 0
    for row in rows:
        topic, q, c, wrong, expl = row
        if q in seen:
            continue
        seen.add(q)
        i += 1
        opts, key = pack_options(c, wrong, rng)
        qs.append(item(f"{prefix}-{i:03d}", subject, topic, q, opts, key, expl, i - 1))
    while len(qs) < N and filler:
        extra = filler(len(qs), rng)
        if not extra:
            break
        topic, q, c, wrong, expl = extra
        if q in seen:
            # try a few more unique draws
            retry = False
            for _ in range(30):
                extra = filler(len(qs) + rng.randint(1, 10_000), rng)
                topic, q, c, wrong, expl = extra
                if q not in seen:
                    retry = True
                    break
            if not retry:
                raise SystemExit(f"{subject}: filler stalled at {len(qs)} unique items")
        seen.add(q)
        i += 1
        opts, key = pack_options(c, wrong, rng)
        qs.append(item(f"{prefix}-{i:03d}", subject, topic, q, opts, key, expl, i - 1))
    if len(qs) < N:
        raise SystemExit(f"{subject}: only {len(qs)} unique items, need {N}")
    return qs[:N]


def fill_accountancy(n, rng):
    kind = n % 5
    if kind == 0:
        a = 40000 + 250 * n
        l = 12000 + 175 * n
        c = a - l
        return ("Accounting equation", f"If assets are ₹{a} and liabilities are ₹{l}, capital is:",
                f"₹{c}", [f"₹{a + l}", f"₹{l}", f"₹{a}"], f"Capital = Assets − Liabilities = {c}.")
    if kind == 1:
        cogs = 30000 + 200 * n
        gp = 8000 + 125 * n
        sales = cogs + gp
        return ("Trading Account", f"If net sales are ₹{sales} and cost of goods sold is ₹{cogs}, gross profit is:",
                f"₹{gp}", [f"₹{sales}", f"₹{cogs}", f"₹{sales + cogs}"], "GP = Net sales − COGS.")
    if kind == 2:
        cost = 20000 + 1000 * n
        years = 5 + (n % 5)
        dep = cost / years
        return ("Cost Accounting", f"Cost of a machine is ₹{cost} and useful life is {years} years with no scrap. Annual SLM depreciation is:",
                f"₹{fmt(dep)}", [f"₹{cost}", f"₹{cost * years}", f"₹{fmt(dep * 2)}"], "SLM = Cost/life.")
    if kind == 3:
        cap = 50000 + 2500 * n
        rate = [6, 8, 10, 12][n % 4]
        interest = cap * rate / 100
        return ("Partnership Accounts", f"If interest on capital is allowed at {rate}% on ₹{cap}, the interest is:",
                f"₹{fmt(interest)}", [f"₹{cap}", f"₹{rate}", f"₹{fmt(interest * 2)}"], "Interest = Capital × rate/100.")
    dr = 50000 + 300 * n
    cr = dr - (200 + n)
    diff = abs(dr - cr)
    return ("Trial Balance", f"If total of debit column is ₹{dr} and credit column is ₹{cr}, the difference is:",
            f"₹{diff}", [f"₹{dr + cr}", f"₹{dr}", f"₹{cr}"], "Difference = |Dr − Cr|; locate the error before closing.")
    kind = n % 5
    if kind == 0:
        a = rng.choice([50000, 80000, 100000, 120000, 150000])
        l = rng.choice([20000, 30000, 40000, 50000])
        c = a - l
        return ("Accounting equation", f"If assets are ₹{a} and liabilities are ₹{l}, capital is:",
                f"₹{c}", [f"₹{a + l}", f"₹{l}", f"₹{a}"], f"Capital = Assets − Liabilities = {c}.")
    if kind == 1:
        cogs = rng.choice([40000, 50000, 60000, 72000])
        sales = cogs + rng.choice([10000, 15000, 20000, 25000])
        gp = sales - cogs
        return ("Trading Account", f"If net sales are ₹{sales} and cost of goods sold is ₹{cogs}, gross profit is:",
                f"₹{gp}", [f"₹{sales}", f"₹{cogs}", f"₹{sales + cogs}"], "GP = Net sales − COGS.")
    if kind == 2:
        cost = rng.choice([10000, 20000, 40000, 50000])
        years = rng.choice([4, 5, 8, 10])
        dep = cost / years
        return ("Cost Accounting", f"Cost of a machine is ₹{cost} and useful life is {years} years with no scrap. Annual SLM depreciation is:",
                f"₹{fmt(dep)}", [f"₹{cost}", f"₹{cost * years}", f"₹{fmt(dep * 2)}"], "SLM = Cost/life.")
    if kind == 3:
        cap = rng.choice([100000, 200000, 500000])
        rate = rng.choice([6, 8, 10, 12])
        interest = cap * rate / 100
        return ("Partnership Accounts", f"If interest on capital is allowed at {rate}% on ₹{cap}, the interest is:",
                f"₹{fmt(interest)}", [f"₹{cap}", f"₹{rate}", f"₹{fmt(interest * 2)}"], "Interest = Capital × rate/100.")
    dr, cr = rng.choice([(45000, 42000), (80000, 76500), (12000, 15000)])
    diff = abs(dr - cr)
    return ("Trial Balance", f"If total of debit column is ₹{dr} and credit column is ₹{cr}, the difference is:",
            f"₹{diff}", [f"₹{dr + cr}", f"₹{dr}", f"₹{cr}"], "Difference = |Dr − Cr|; locate the error before closing.")


def fill_english(n, rng):
    names = ["Ravi", "Meena", "Aamir", "Sofia", "Kabir", "Zoya", "Arjun", "Noor", "Ishaan", "Fatima"]
    objs = ["accounts", "cricket", "history", "mathematics", "science", "chess", "football", "music", "Urdu", "economics"]
    name = names[n % len(names)]
    obj = objs[(n // len(names)) % len(objs)]
    kind = (n // 100) % 5
    if kind == 0:
        return ("Tenses", f"{name} ____ {obj} every Sunday.", "practises" if obj != "cricket" else "plays",
                ["play", "playing", "gone"], "Present simple, third person singular.")
    if kind == 1:
        return ("Articles", f"{name} bought ____ useful book on {obj}.", "a", ["an", "the always only", "no article"],
                "Useful begins with a consonant sound yu, so ‘a’.")
    if kind == 2:
        return ("Prepositions", f"{name} is fond ____ {obj}.", "of", ["on", "at", "over"], "Fond of.")
    if kind == 3:
        return ("Active & Passive Voice", f"Someone taught {name} {obj}. Passive:",
                f"{name} was taught {obj}.", [f"{name} taught {obj} by someone was.", f"{obj} was {name}.", f"{name} has teach {obj}."],
                "Past simple passive: was/were + V3.")
    return ("Prepositions", f"Divide this notes on {obj} ____ {name} and the class (more than two).", "among",
            ["between", "in", "at"], "Among for more than two.")
    names = ["Ravi", "Meena", "Aamir", "Sofia", "Kabir", "Zoya", "Arjun", "Noor", "Ishaan", "Fatima"]
    name = names[n % len(names)]
    kind = n % 8
    if kind == 0:
        return ("Tenses", f"{name} ____ cricket every Sunday.", "plays", ["play", "playing", "played"], "Third person singular present: verb+s.")
    if kind == 1:
        return ("Articles", f"{name} saw ____ eagle in the sky.", "an", ["a", "the only possible never", "no article required always"], "Eagle begins with a vowel sound.")
    if kind == 2:
        return ("Prepositions", f"{name} is interested ____ accounts.", "in", ["on", "at", "over"], "Interested in.")
    if kind == 3:
        return ("Modals", f"{name} ____ to the office yesterday, so he took leave. (ability in past)", "could not go / could not", ["must go", "shall go", "can yesterday"], "Past inability.")
    if kind == 4:
        return ("Active & Passive Voice", f"People speak Kashmiri in the valley. Passive closest is:", "Kashmiri is spoken in the valley.", ["Kashmiri spoken people.", "Kashmiri was speak.", "Kashmiri has speak."], "Present simple passive.")
    if kind == 5:
        return ("Idioms and phrases", f"If {name} ‘calls a spade a spade’, it means {name} is:", "frank / speaks plainly", ["a gardener", "dishonest", "silent always"], "Idiom: speak plainly.")
    if kind == 6:
        return ("Synonyms", f"Choose the synonym of ‘begin’ as {name} would use it:", "start", ["end", "stop", "finish"], "Begin ≈ start.")
    return ("Antonyms", f"Antonym of ‘success’ in {name}’s result is:", "failure", ["victory", "win", "gain"], "Success ≠ failure.")


def fill_science(n, rng):
    kind = n % 6
    if kind == 0:
        m = 2 + n
        a = 2 + (n % 5)
        f = m * a
        return ("Newton's Laws of Motion", f"Force on a mass of {m} kg with acceleration {a} m/s² is:",
                f"{f} N", [f"{m + a} N", f"{a} N", f"{m} N"], "F = ma.")
    if kind == 1:
        i = 2 + (n % 7)
        r = 2 + (n % 9)
        v = i * r
        return ("Electric Current", f"Current {i} A flows through {r} Ω. Voltage is:",
                f"{v} V", [f"{i + r} V", f"{r} V", f"{i} V"], "V = IR.")
    if kind == 2:
        v = 10 + n
        i = 2 + (n % 6)
        p = v * i
        return ("Electric Current", f"A device on {v} V draws {i} A. Power is:",
                f"{p} W", [f"{v + i} W", f"{v} W", f"{i} W"], "P = VI.")
    if kind == 3:
        u = n % 8
        a = 2 + (n % 4)
        t = 2 + (n % 5)
        vel = u + a * t
        return ("Newton's Laws of Motion", f"A body starts with {u} m/s and accelerates at {a} m/s² for {t} s. Final velocity is:",
                f"{vel} m/s", [f"{u} m/s", f"{a * t} m/s", f"{u + a} m/s"], "v = u + at.")
    if kind == 4:
        dist = 10 + 2 * n
        t = 2 + (n % 9)
        speed = dist / t
        return ("Newton's Laws of Motion", f"A body covers {dist} km in {t} hours. Average speed is:",
                f"{fmt(speed)} km/h", [f"{dist} km/h", f"{t} km/h", f"{fmt(dist * t)} km/h"], "Speed = distance/time.")
    v = 2 + n
    t = 2 + (n % 6)
    s = v * t
    return ("Newton's Laws of Motion", f"A body moves at {v} m/s for {t} s. Distance (uniform speed) is:",
            f"{s} m", [f"{v + t} m", f"{v} m", f"{t} m"], "s = vt.")
    kind = n % 6
    if kind == 0:
        m = rng.choice([2, 4, 5, 8, 10])
        a = rng.choice([2, 3, 4, 5])
        f = m * a
        return ("Newton's Laws of Motion", f"Force on a mass of {m} kg with acceleration {a} m/s² is:",
                f"{f} N", [f"{m + a} N", f"{a} N", f"{m} N"], "F = ma.")
    if kind == 1:
        i = rng.choice([2, 3, 4, 5])
        r = rng.choice([2, 4, 5, 10])
        v = i * r
        return ("Electric Current", f"Current {i} A flows through {r} Ω. Voltage is:",
                f"{v} V", [f"{i + r} V", f"{r} V", f"{i} V"], "V = IR.")
    if kind == 2:
        v = rng.choice([10, 20, 12, 24])
        i = rng.choice([2, 4, 5])
        p = v * i
        return ("Electric Current", f"A device on {v} V draws {i} A. Power is:",
                f"{p} W", [f"{v + i} W", f"{v} W", f"{i} W"], "P = VI.")
    if kind == 3:
        u = rng.choice([0, 5, 10])
        a = rng.choice([2, 4, 5])
        t = rng.choice([2, 3, 4])
        v = u + a * t
        return ("Newton's Laws of Motion", f"A body starts with {u} m/s and accelerates at {a} m/s² for {t} s. Final velocity is:",
                f"{v} m/s", [f"{u} m/s", f"{a * t} m/s", f"{u + a} m/s"], "v = u + at.")
    if kind == 4:
        dist = rng.choice([10, 20, 30, 40, 50, 60])
        t = rng.choice([2, 4, 5, 10])
        speed = dist / t
        return ("Newton's Laws of Motion", f"A body covers {dist} km in {t} hours. Average speed is:",
                f"{fmt(speed)} km/h", [f"{dist} km/h", f"{t} km/h", f"{fmt(dist * t)} km/h"], "Speed = distance/time.")
    v = rng.choice([2, 4, 5, 10])
    t = rng.choice([2, 3, 4, 5])
    s = v * t
    return ("Newton's Laws of Motion", f"A body moves at {v} m/s for {t} s. Distance (uniform speed) is:",
            f"{s} m", [f"{v + t} m", f"{v} m", f"{t} m"], "s = vt.")


def fill_computers(n, rng):
    a = 1 + n
    b = 2 + 2 * n
    kind = n % 4
    if kind == 0:
        return ("MS Excel", f"In Excel, if A1={a} and A2={b}, then =A1+A2 returns:",
                str(a + b), [str(a), str(b), str(a * b)], "Addition of two cells.")
    if kind == 1:
        return ("MS Excel", f"In Excel, ={a}*{b} evaluates to:",
                str(a * b), [str(a + b), str(a), str(b)], "Multiplication.")
    if kind == 2:
        bits = 8 * (1 + n)
        return ("Fundamentals", f"{bits} bits equal how many bytes?",
                str(bits // 8), [str(bits), str(bits * 8), str(bits // 2)], "1 byte = 8 bits.")
    return ("MS Excel", f"=SUM({a},{b}) in Excel equals:",
            str(a + b), [str(a * b), str(abs(a - b)), str(a)], "SUM adds arguments.")


def fill_economics(n, rng):
    kind = n % 4
    if kind == 0:
        c = 40 + n
        i = 10 + (n % 20)
        g = 10 + (n % 15)
        x, m = 5 + (n % 10), 3 + (n % 8)
        gdp = c + i + g + (x - m)
        return ("National Income", f"If C={c}, I={i}, G={g}, X={x}, M={m} (same units), GDP (expenditure) is:",
                str(gdp), [str(c + i), str(c + i + g), str(x + m)], "GDP = C+I+G+(X−M).")
    if kind == 1:
        gdp = 100 + 3 * n
        dep = 10 + (n % 20)
        return ("National Income", f"If GDP is {gdp} and depreciation is {dep}, NDP is:",
                str(gdp - dep), [str(gdp + dep), str(gdp), str(dep)], "NDP = GDP − depreciation.")
    if kind == 2:
        p1, q1 = 10 + (n % 9), 20 + n
        p2, q2 = p1 + 2 + (n % 3), max(1, q1 - 2 - (n % 4))
        dp = (p2 - p1) / p1 * 100
        dq = (q2 - q1) / q1 * 100
        ed = abs(dq / dp) if dp else 1
        return ("Demand Analysis", f"Price rises from {p1} to {p2} and quantity demanded falls from {q1} to {q2}. |Ed| (point % method) is closest to:",
                fmt(ed), [fmt(ed * 2), fmt(abs(dp)), fmt(abs(dq))], "Ed = (%ΔQ)/(%ΔP).")
    mpc_pct = 20 + (n % 50)
    mpc = mpc_pct / 100
    k = 1 / (1 - mpc)
    return ("Economic Growth", f"If MPC is {fmt(mpc)}, simple Keynesian multiplier is:",
            fmt(k), [fmt(mpc), "1", fmt(k + 1)], "k = 1/(1−MPC).")
    kind = n % 4
    kind = n % 4
    if kind == 0:
        c = rng.choice([40, 50, 60, 70])
        i = rng.choice([10, 20, 30])
        g = rng.choice([10, 15, 20])
        x, m = rng.choice([(5, 8), (10, 6), (12, 12)])
        gdp = c + i + g + (x - m)
        return ("National Income", f"If C={c}, I={i}, G={g}, X={x}, M={m} (same units), GDP (expenditure) is:",
                str(gdp), [str(c + i), str(c + i + g), str(x + m)], "GDP = C+I+G+(X−M).")
    if kind == 1:
        gdp = rng.choice([100, 200, 500])
        dep = rng.choice([10, 20, 25])
        return ("National Income", f"If GDP is {gdp} and depreciation is {dep}, NDP is:",
                str(gdp - dep), [str(gdp + dep), str(gdp), str(dep)], "NDP = GDP − depreciation.")
    if kind == 2:
        p1, q1 = rng.choice([(10, 20), (8, 15), (12, 10)])
        p2, q2 = p1 + rng.choice([2, 4]), q1 - rng.choice([2, 4, 5])
        # % change
        dp = (p2 - p1) / p1 * 100
        dq = (q2 - q1) / q1 * 100
        ed = abs(dq / dp) if dp else 1
        return ("Demand Analysis", f"Price rises from {p1} to {p2} and quantity demanded falls from {q1} to {q2}. |Ed| (point % method) is closest to:",
                fmt(ed), [fmt(ed * 2), fmt(abs(dp)), fmt(abs(dq))], "Ed = (%ΔQ)/(%ΔP).")
    cr = rng.choice([20, 30, 40, 50])
    mpc = cr / 100
    k = 1 / (1 - mpc)
    return ("Economic Growth", f"If MPC is {fmt(mpc)}, simple Keynesian multiplier is:",
            fmt(k), [fmt(mpc), "1", fmt(k + 1)], "k = 1/(1−MPC).")


def fill_gk(n, rng):
    dances = [
        ("Jammu and Kashmir", "Rouf / Dumhal (Kashmiri folk; also regional forms)"),
        ("Punjab", "Bhangra / Giddha"),
        ("Gujarat", "Garba / Dandiya"),
        ("Assam", "Bihu"),
        ("Odisha", "Odissi"),
        ("Tamil Nadu", "Bharatanatyam"),
        ("Kerala", "Kathakali / Mohiniyattam"),
        ("Uttar Pradesh", "Kathak"),
        ("Manipur", "Manipuri"),
        ("Andhra Pradesh / Telangana", "Kuchipudi"),
        ("Rajasthan", "Ghoomar"),
        ("Goa", "Fugdi / Dhalo (folk)"),
    ]
    rivers = [
        ("Jhelum", "Kashmir / Pakistan (Indus system)"),
        ("Chenab", "J&K / Punjab (Indus system)"),
        ("Ravi", "Himachal–Punjab (Indus system)"),
        ("Beas", "Himachal–Punjab"),
        ("Sutlej", "Indus tributary"),
        ("Tawi", "Jammu"),
        ("Lidder", "Pahalgam / Kashmir"),
        ("Sindh (Kashmir)", "Sind Valley"),
        ("Indus", "Ladakh / Tibet origin"),
        ("Ganga", "Uttarakhand to Bay of Bengal"),
        ("Brahmaputra", "Arunachal / Assam"),
        ("Kaveri", "Karnataka–Tamil Nadu"),
        ("Mahanadi", "Chhattisgarh–Odisha"),
        ("Tapti / Tapi", "Arabian Sea"),
        ("Mahadayi / Mandovi", "Goa"),
    ]
    parks = [
        ("Dachigam", "Hangul / Kashmir stag"),
        ("Hemis", "Snow leopard (Ladakh)"),
        ("Kaziranga", "One-horned rhino"),
        ("Jim Corbett", "Tiger (Uttarakhand)"),
        ("Gir", "Asiatic lion"),
        ("Sundarbans", "Royal Bengal tiger / mangrove"),
        ("Periyar", "Elephants / Kerala"),
        ("Kanha", "Tiger / MP"),
        ("Ranthambore", "Tiger / Rajasthan"),
        ("Bandipur", "Tiger / Karnataka"),
    ]
    kind = n % 3
    if kind == 0:
        st, dance = dances[n % len(dances)]
        others = [d for s, d in dances if d != dance][:3]
        return ("Indian Culture, Heritage and Freedom Struggle", f"A classical/folk dance associated with {st} is:", dance, others, f"{dance} is associated with {st}.")
    if kind == 1:
        r, where = rivers[n % len(rivers)]
        others = [w for name, w in rivers if w != where][:3]
        return ("Important Rivers & Lakes", f"The river {r} is associated with which region/system?", where, others, f"{r} — {where}.")
    p, fam = parks[n % len(parks)]
    others = [f for name, f in parks if f != fam][:3]
    return ("Environment, Ecology & Bio-diversity", f"{p} National Park / reserve is famous for:", fam, others, f"{p}: {fam}.")


def accountancy_rows():
    return [
        ("Introduction to Financial Accounting", "The accounting equation is:", "Assets = Liabilities + Capital", ["Assets = Liabilities − Capital", "Assets + Liabilities = Capital", "Capital = Assets + Liabilities"], "Fundamental equation: A = L + C."),
        ("Introduction to Financial Accounting", "Debit the receiver, credit the giver is the rule for:", "Personal accounts", ["Real accounts", "Nominal accounts", "Cash book only"], "Golden rule for personal accounts."),
        ("Introduction to Financial Accounting", "Debit what comes in, credit what goes out applies to:", "Real accounts", ["Personal accounts", "Nominal accounts", "Suspense only"], "Golden rule for real accounts."),
        ("Introduction to Financial Accounting", "Debit all expenses and losses, credit all incomes and gains applies to:", "Nominal accounts", ["Real accounts", "Personal accounts", "Cash accounts only"], "Golden rule for nominal accounts."),
        ("Journal", "A journal is a book of:", "Original entry", ["Final entry", "Only cash", "Only stock"], "Journal records transactions first."),
        ("Journal", "The left side of an account is:", "Debit", ["Credit", "Balance only", "Narration"], "Dr is left; Cr is right."),
        ("Voucher Approach", "A source document used to record a transaction is a:", "Voucher", ["Ledger folio", "Trial balance", "Balance sheet"], "Vouchers support entries."),
        ("Bank Reconciliation Statement", "A BRS is prepared to reconcile:", "Cash book and pass book balances", ["Trial balance and ledger", "Journal and voucher", "Capital and drawings"], "BRS explains timing/recording differences."),
        ("Bank Reconciliation Statement", "Cheques issued but not yet presented cause cash book balance to be:", "Lower than pass book (generally)", ["Always equal", "Unrelated", "Always higher by capital"], "Issued cheques reduce cash book immediately."),
        ("Ledger", "Posting is done from journal to:", "Ledger", ["Trial balance directly", "Balance sheet directly", "Voucher"], "Ledger is the principal book."),
        ("Cash Book", "A cash book records:", "Cash and/or bank transactions", ["Only credit sales", "Only depreciation", "Only outstanding expenses"], "Cash book is both journal and ledger for cash."),
        ("Cash Book", "Petty cash book is used for:", "Small day-to-day expenses", ["Fixed asset purchase only", "Share issue", "Audit report"], "Imprest system often used for petty cash."),
        ("Financial Audit", "An audit is an independent examination of:", "Financial information / accounts", ["Only marketing plans", "Only HR files", "Only production"], "Audit verifies accounts."),
        ("Double entry", "Every debit has a corresponding:", "Credit", ["Asset only", "Expense only", "Narration only"], "Double entry keeps the books in balance."),
        ("Trial Balance", "A trial balance is a statement of:", "Ledger balances", ["Only cash", "Only assets", "Only liabilities"], "TB lists debit and credit balances."),
        ("Trial Balance", "If trial balance agrees, it:", "Does not guarantee error-free books", ["Proves there are zero errors", "Replaces audit", "Is the balance sheet"], "Some errors do not affect TB."),
        ("Trading Account", "Gross profit is:", "Net sales − cost of goods sold", ["Capital − liabilities", "Assets − expenses", "Cash − bank"], "GP from trading account."),
        ("Profit and Loss Account", "Net profit is transferred to:", "Capital account", ["Drawings only", "Cash book only", "Journal proper only"], "NP increases capital."),
        ("Balance Sheet", "Balance sheet shows:", "Financial position on a date", ["Only profit for a year", "Only cash movement", "Only production"], "Position statement of assets and liabilities."),
        ("Balance Sheet", "Outstanding expenses appear on the:", "Liability side", ["Asset side as cash", "Trading credit only", "Nowhere"], "Outstanding expense is a current liability."),
        ("Partnership", "In the absence of partnership deed, interest on capital is:", "Not allowed", ["6% p.a. always", "12% p.a.", "Bank rate"], "Indian Partnership Act: no interest on capital unless agreed."),
        ("Partnership", "In the absence of agreement, profits are shared:", "Equally", ["In capital ratio", "In time ratio", "By seniority"], "Default is equal sharing."),
        ("Social Accounting", "Social accounting tries to measure:", "Social costs and benefits", ["Only cash in till", "Only GST payable", "Only depreciation"], "Accounts for social impact."),
        ("PFMS", "PFMS stands for:", "Public Financial Management System", ["Private Fund Management Scheme", "Public Fund Mutual Scheme", "Payment for Monthly Salary"], "Government payment and tracking system."),
        ("Indian Financial Management System", "The Union Budget is presented by the:", "Finance Minister", ["RBI Governor only", "CAG only", "NITI Aayog CEO only"], "Budget is a Finance Ministry function."),
        ("Taxation", "GST is an example of:", "Indirect tax", ["Direct tax only", "Wealth tax", "Agricultural tax"], "GST is levied on supply of goods/services."),
        ("Taxation", "Income tax is a:", "Direct tax", ["Indirect tax", "Customs only", "GST slab"], "Direct tax is borne by the person on whom levied."),
        ("Cost Accounting", "Prime cost includes:", "Direct material + direct labour + direct expenses", ["Only factory rent", "Only office salaries", "Only depreciation of office"], "Prime cost is direct cost."),
        ("Budgetary control", "A budget is:", "A quantitative plan for a future period", ["Last year’s trial balance", "A voucher", "A cheque"], "Budget is a plan, not a historical TB."),
        ("Developments in Accounting", "Computerised accounting packages are an example of:", "Developments in accounting", ["Only costing of 1800s", "Barter", "Single entry only"], "Software and ERP changed accounting practice."),
        ("Single entry", "Cash-based single entry is:", "Incomplete recording compared with double entry", ["More complete than double entry", "The same as IFRS", "Illegal always"], "Single entry does not record both aspects fully."),
        ("Ledger", "The balance of a nominal account is transferred to:", "Profit and Loss account", ["Cash book", "Balance sheet directly always", "Journal"], "Nominal accounts are closed to P&L."),
        ("Journal", "Narration in a journal entry is:", "A brief explanation of the entry", ["The ledger folio only", "The trial balance total", "GSTIN"], "Narration explains the transaction."),
        ("Financial statements", "Prepaid expense is shown as:", "Current asset", ["Current liability", "Capital", "Drawings"], "Benefit not yet expired is an asset."),
        ("Depreciation (related)", "Depreciation is:", "Allocation of asset cost over useful life", ["Cash paid to bank", "Increase in capital", "A liability to customers"], "Non-cash expense allocating cost."),
    ]


def english_rows():
    return [
        ("Tenses", "She ____ to school every day.", "goes", ["go", "going", "gone"], "Habitual present: goes."),
        ("Tenses", "They ____ the match yesterday.", "won", ["win", "winning", "wins"], "Past simple for a finished action."),
        ("Tenses", "I ____ working here since 2020.", "have been", ["has been", "had", "was being"], "Present perfect continuous with since."),
        ("Articles", "He is ____ honest man.", "an", ["a", "the", "no article"], "Honest begins with a vowel sound."),
        ("Articles", "____ Ganga is a sacred river.", "The", ["A", "An", "No article"], "Rivers take the."),
        ("Articles", "She bought ____ umbrella.", "an", ["a", "the", "no article"], "Umbrella starts with a vowel sound."),
        ("Prepositions", "He is good ____ mathematics.", "at", ["in", "on", "over"], "Good at a subject."),
        ("Prepositions", "The book is ____ the table.", "on", ["in", "at", "over into"], "On = surface."),
        ("Prepositions", "She has been ill ____ Monday.", "since", ["for", "from", "by"], "Since + point of time."),
        ("Prepositions", "We have lived here ____ five years.", "for", ["since", "at", "on"], "For + period."),
        ("Modals", "You ____ wear a helmet. It is compulsory.", "must", ["might", "could", "would"], "Must expresses compulsion."),
        ("Modals", "____ I use your pen?", "May / Can", ["Must", "Should have", "Ought not"], "Permission: may/can."),
        ("Modals", "He ____ be in the office; the lights are on. (inference)", "must", ["should to", "ought not", "used"], "Must for logical deduction."),
        ("Narration", "He said, “I am busy.” (indirect)", "He said that he was busy.", ["He said that I am busy.", "He said that he is busy.", "He said he been busy."], "Present becomes past in reported speech."),
        ("Narration", "She said, “I have finished.”", "She said that she had finished.", ["She said that she has finished.", "She said she finished have.", "She said that I had finished."], "Present perfect → past perfect."),
        ("Active & Passive Voice", "They are playing cricket. (passive)", "Cricket is being played by them.", ["Cricket is played them.", "Cricket was played by them.", "Cricket has played by them."], "Present continuous passive: is being + V3."),
        ("Active & Passive Voice", "Close the door. (passive)", "Let the door be closed.", ["The door closed.", "Door is close.", "Let door closed."], "Imperative passive often uses let."),
        ("Synonyms", "The synonym of 'brief' is:", "short", ["long", "slow", "late"], "Brief = concise/short."),
        ("Synonyms", "The synonym of 'rapid' is:", "quick", ["lazy", "late", "weak"], "Rapid = fast."),
        ("Antonyms", "The antonym of 'ancient' is:", "modern", ["old", "historic", "past"], "Ancient ≠ modern."),
        ("Antonyms", "The antonym of 'scarce' is:", "abundant", ["rare", "little", "few"], "Scarce ≠ plentiful/abundant."),
        ("Idioms and phrases", "'Once in a blue moon' means:", "Very rarely", ["Very often", "Every day", "At night only"], "Idiom for rare occurrence."),
        ("Idioms and phrases", "'Break the ice' means:", "Start a conversation", ["Break glass", "Stop work", "Get angry"], "To initiate social talk."),
        ("Idioms and phrases", "'A blessing in disguise' means:", "Something good that seemed bad at first", ["A hidden curse", "A festival", "A uniform"], "Standard idiom meaning."),
        ("Homonyms / homophones", "They went ____ the market. (to/too/two)", "to", ["too", "two", "tow"], "To = preposition of direction."),
        ("Homonyms / homophones", "This bag is ____ heavy. (to/too/two)", "too", ["to", "two", "tow"], "Too = excessively."),
        ("Homonyms / homophones", "I have ____ books. (to/too/two)", "two", ["to", "too", "tow"], "Two = number 2."),
        ("Pairs of words", "'Accept' means:", "to receive", ["except", "expect", "excerpt"], "Accept vs except."),
        ("Pairs of words", "'Except' means:", "excluding", ["accept", "expect", "access"], "Except = leaving out."),
        ("Clauses", "A clause that cannot stand alone is a:", "Dependent / subordinate clause", ["Simple sentence", "Independent only", "Phrase with no verb always"], "Subordinate clauses need a main clause."),
        ("Rearranging of jumbled sentences", "The correct order of: (P) the exam (Q) he (R) cleared is:", "Q R P", ["P Q R", "R P Q", "Q P R"], "He cleared the exam."),
        ("Comprehension blanks", "Ravi lost ____ keys yesterday. (pronoun/article fit)", "his", ["him", "he", "they"], "Possessive adjective his."),
        ("Tenses", "By next year she ____ her degree.", "will have completed", ["completed", "completing", "complete"], "Future perfect for action done by a time."),
        ("Articles", "____ Himalayas are in the north of India.", "The", ["A", "An", "No article"], "Mountain ranges take the."),
        ("Prepositions", "Divide the sweets ____ the two children.", "between", ["among", "in", "into of"], "Between for two."),
        ("Prepositions", "Divide the sweets ____ the five children.", "among", ["between", "on", "at"], "Among for more than two."),
        ("Modals", "You ____ see a doctor. (advice)", "should", ["must to", "can able", "shall been"], "Should for advice."),
        ("Active & Passive Voice", "Someone has stolen my bike. (passive)", "My bike has been stolen.", ["My bike stole.", "My bike was steal.", "My bike has stole."], "Present perfect passive: has been + V3."),
        ("Idioms and phrases", "'Hit the nail on the head' means:", "Say exactly the right thing", ["Hurt someone", "Do carpentry", "Miss the point"], "Standard idiom."),
        ("Synonyms", "Synonym of 'courage' is:", "bravery", ["fear", "weakness", "doubt"], "Courage ≈ bravery."),
    ]


def science_rows():
    return [
        ("Newton's Laws of Motion", "Newton’s first law is also called the law of:", "Inertia", ["Acceleration", "Energy", "Gravitation only"], "First law: inertia."),
        ("Newton's Laws of Motion", "SI unit of force is:", "Newton", ["Joule", "Watt", "Pascal"], "1 N = 1 kg m/s²."),
        ("Newton's Laws of Motion", "Mass is a measure of:", "Inertia", ["Weight only", "Temperature", "Charge"], "More mass ⇒ more inertia."),
        ("Newton's Laws of Motion", "Weight is:", "Mass × g", ["Mass / g", "Mass + g", "g / mass"], "W = mg."),
        ("Newton's Laws of Motion", "Acceleration is rate of change of:", "Velocity", ["Distance only", "Mass", "Time only"], "a = Δv/Δt."),
        ("Newton's Laws of Motion", "Speed is:", "Distance / time", ["Displacement × time", "Mass × velocity", "Force / area"], "Scalar speed = distance/time."),
        ("Electric Current", "SI unit of electric current is:", "Ampere", ["Volt", "Ohm", "Watt"], "Current in amperes."),
        ("Electric Current", "SI unit of potential difference is:", "Volt", ["Ampere", "Coulomb", "Joule only"], "V = W/Q."),
        ("Electric Current", "Power (electrical) is:", "VI", ["V/I", "V+I", "I/V only always"], "P = VI (DC / ohmic)."),
        ("Electric Current", "Ohm’s law is:", "V = IR", ["P = IV²", "Q = It²", "F = ma only"], "V = IR for ohmic conductors."),
        ("Chemical Equation", "A chemical equation must be:", "Balanced in atoms", ["Unbalanced always", "Without formulae", "Only words"], "Law of conservation of mass."),
        ("Chemical Equation", "2H₂ + O₂ → 2H₂O is a:", "Combination reaction", ["Displacement", "Decomposition only", "Neutralisation only"], "Hydrogen and oxygen combine."),
        ("Chemical Equation", "CaCO₃ → CaO + CO₂ is:", "Decomposition", ["Combination", "Displacement", "Double displacement"], "One reactant gives two products."),
        ("Metals, Non-metals", "Which is a metal?", "Iron", ["Sulphur", "Chlorine", "Neon"], "Iron is metallic."),
        ("Metals, Non-metals", "Which is a non-metal that is liquid at room temperature?", "Bromine", ["Mercury", "Sodium", "Iron"], "Bromine is liquid non-metal; mercury is metal."),
        ("Metals, Non-metals", "Metals are generally:", "Malleable and ductile", ["Gaseous always", "Poor conductors always", "Dull always"], "Typical metallic properties."),
        ("Sources of energy", "Solar energy is a:", "Non-conventional / renewable source", ["Fossil fuel", "Nuclear waste", "Coal type"], "Sun is renewable."),
        ("Sources of energy", "Coal is a:", "Conventional source of energy", ["Tidal energy", "Solar cell", "Wind mill"], "Coal is conventional fossil fuel."),
        ("Sources of energy", "Biomass energy comes from:", "Organic matter", ["Uranium only", "Tides only", "Geothermal steam only"], "Wood, dung, crop waste etc."),
        ("Nutrition", "Photosynthesis occurs mainly in:", "Leaves (chloroplasts)", ["Roots only", "Flowers only", "Seeds only"], "Chlorophyll in leaves."),
        ("Nutrition", "Xylem transports:", "Water and minerals", ["Food from leaves", "Oxygen only", "Pollen only"], "Xylem upward water."),
        ("Nutrition", "Phloem transports:", "Food (sugars)", ["Water only from soil", "Minerals only", "Carbon dioxide only"], "Translocation of food."),
        ("Respiration", "In aerobic respiration, glucose is broken down using:", "Oxygen", ["Nitrogen only", "Argon", "Helium"], "Aerobic = with oxygen."),
        ("Diseases", "A communicable disease is:", "Tuberculosis", ["Diabetes", "Hypertension (primary)", "Scurvy"], "TB spreads by infection."),
        ("Diseases", "A non-communicable disease is:", "Diabetes", ["Cholera", "Measles", "Influenza"], "Diabetes is not infectious."),
        ("Vitamins", "Deficiency of Vitamin C causes:", "Scurvy", ["Rickets", "Night blindness", "Beri-beri"], "Scurvy — Vitamin C."),
        ("Vitamins", "Deficiency of Vitamin D causes:", "Rickets", ["Scurvy", "Beri-beri", "Goitre"], "Rickets — Vitamin D / calcium metabolism."),
        ("Vitamins", "Deficiency of Vitamin A causes:", "Night blindness", ["Scurvy", "Rickets", "Anaemia only"], "Vitamin A — vision."),
        ("Vitamins", "Deficiency of Vitamin B1 (thiamine) causes:", "Beri-beri", ["Scurvy", "Rickets", "Goitre"], "Beri-beri — thiamine."),
        ("Vitamins", "Iodine deficiency causes:", "Goitre", ["Scurvy", "Rickets", "Scurvy and rickets"], "Thyroid enlargement."),
        ("Ecosystem", "Producers in an ecosystem are mainly:", "Green plants", ["Tigers", "Fungi only", "Humans only"], "Autotrophs produce food."),
        ("Ecosystem", "A food chain always starts with:", "Producers", ["Decomposers only", "Carnivores", "Humans"], "Energy enters via producers."),
        ("Environment", "Ozone layer protects us from:", "Harmful UV radiation", ["Infrared only", "Radio waves", "Sound"], "Stratospheric ozone absorbs UV."),
        ("Environment", "Greenhouse effect is due to gases like:", "CO₂, CH₄, water vapour", ["Oxygen only", "Nitrogen only", "Argon only"], "GHGs trap long-wave radiation."),
        ("Environment", "Acid rain is mainly due to:", "Oxides of sulphur and nitrogen", ["Oxygen", "Helium", "Argon"], "SO₂ and NOx."),
        ("Electric Current", "Energy in kWh is the unit of:", "Electrical energy", ["Current", "Resistance", "Charge"], "Board exam unit of energy."),
        ("Newton's Laws of Motion", "If net force on a body is zero, acceleration is:", "Zero", ["Maximum", "Infinite", "g always"], "Newton 2: a = F/m."),
    ]


def computers_rows():
    return [
        ("Fundamentals", "CPU stands for:", "Central Processing Unit", ["Control Process Unit", "Central Program Utility", "Computer Personal Unit"], "CPU is the processor."),
        ("Fundamentals", "ALU is a part of:", "CPU", ["Monitor", "Keyboard", "Printer"], "Arithmetic Logic Unit."),
        ("Input & output Devices", "Which is an input device?", "Keyboard", ["Monitor", "Speaker", "Printer"], "Keyboard feeds data in."),
        ("Input & output Devices", "Which is an output device?", "Monitor", ["Mouse", "Scanner", "Microphone"], "Monitor displays output."),
        ("Input & output Devices", "A scanner is an:", "Input device", ["Output device", "Storage only", "OS"], "Scanner digitises images."),
        ("Storage Media", "1 KB equals:", "1024 bytes", ["1000 bits", "1024 bits", "100 bytes"], "Binary kilo = 1024."),
        ("Storage Media", "RAM is:", "Volatile memory", ["Permanent storage like ROM always", "An output device", "A printer type"], "RAM loses data on power off."),
        ("Storage Media", "ROM is typically:", "Non-volatile", ["Volatile like RAM", "An input device", "A virus"], "ROM retains firmware."),
        ("Operating system", "Which is an operating system?", "Linux", ["MS Word", "Google Chrome only", "Intel"], "Linux is an OS."),
        ("Operating system", "Windows is a:", "Operating system", ["Spreadsheet", "Browser only", "CPU brand"], "Microsoft Windows OS."),
        ("Open Source", "Linux is an example of:", "Open source OS", ["Closed hardware only", "A printer driver only", "A font"], "Linux kernel is open source."),
        ("MS Word", "In MS Word, Ctrl+S is used to:", "Save", ["Print", "Copy", "Cut"], "Standard shortcut."),
        ("MS Word", "In MS Word, Ctrl+C copies and Ctrl+V:", "Pastes", ["Cuts", "Saves", "Prints"], "Clipboard paste."),
        ("MS Excel", "The intersection of a row and a column in Excel is a:", "Cell", ["Workbook", "Chart", "Macro only"], "Cell address like A1."),
        ("MS Excel", "A formula in Excel begins with:", "=", ["#", "$", "&"], "Formulas start with =."),
        ("MS Excel", "SUM(A1:A5) adds values in:", "A1 through A5", ["Only A1", "The whole sheet", "A5 only"], "Range A1:A5."),
        ("MS PowerPoint", "A PowerPoint file is typically a:", "Presentation", ["Spreadsheet", "Database", "Email client"], "PPT/PPTX."),
        ("MS Access", "MS Access is mainly a:", "Database program", ["Browser", "Video editor", "Compiler"], "RDBMS desktop tool."),
        ("PDF", "PDF stands for:", "Portable Document Format", ["Print Document File", "Public Data Form", "Personal Digital File"], "Adobe-originated format."),
        ("Internet and E-mail", "HTTP is a protocol for:", "Web pages", ["Only email", "Only printing", "Only CPU cooling"], "Hypertext Transfer Protocol."),
        ("Internet and E-mail", "An email address contains:", "@", ["# only", "* only", "No symbol"], "user@domain."),
        ("Internet and E-mail", "WWW stands for:", "World Wide Web", ["World Wide Windows", "Web Wide World", "Wide Web Work"], "WWW."),
        ("Virus and Anti-Virus", "A computer virus is a:", "Malicious program", ["Hardware fan", "Type of RAM", "Printer ink"], "Malware that can replicate."),
        ("Virus and Anti-Virus", "Antivirus software is used to:", "Detect and remove malware", ["Increase RAM physically", "Cool the CPU", "Print faster"], "Protects against malware."),
        ("Hardware & Software", "Hardware refers to:", "Physical components", ["Programs only", "Only internet", "Only passwords"], "Tangible parts."),
        ("Hardware & Software", "Software refers to:", "Programs and instructions", ["Monitor glass", "Keyboard keys", "Mouse cable"], "Intangible instructions."),
        ("Hardware & Software", "Firmware is:", "Software embedded in hardware", ["Only cloud storage", "A type of printer", "An email"], "e.g. BIOS/UEFI."),
        ("IT in Governance", "PFMS is an example of:", "IT in public financial governance", ["A computer virus", "A keyboard", "A game"], "Digital payment/tracking of government funds."),
        ("IT in Governance", "e-Governance aims to:", "Deliver government services using ICT", ["Replace electricity", "Ban computers", "Stop internet"], "G2C/G2G digital services."),
        ("Operating system", "The OS manages:", "Hardware and software resources", ["Only one Word file forever", "Only printers in shops", "Only PDF fonts"], "Resource manager."),
        ("Input & output Devices", "A microphone is an:", "Input device", ["Output device", "Storage", "OS"], "Sound input."),
        ("Input & output Devices", "A speaker is an:", "Output device", ["Input device", "CPU", "RAM"], "Sound output."),
        ("MS Excel", "In Excel, a workbook contains:", "Worksheets", ["Only one cell ever", "Only macros", "Only charts without sheets"], "Workbook = file of sheets."),
        ("Fundamentals", "Bit is the short form of:", "Binary digit", ["Byte integer", "Basic IT", "Binary internet"], "0 or 1."),
        ("Fundamentals", "8 bits make:", "1 byte", ["1 KB", "1 MB", "1 nibble"], "Byte = 8 bits."),
        ("Open Source", "Open source software provides:", "Access to source code (generally)", ["No licence ever", "Only hardware", "Only paper books"], "Source can be studied/modified per licence."),
        ("Internet and E-mail", "A URL is a:", "Web address", ["CPU pin", "Type of RAM", "Virus"], "Uniform Resource Locator."),
        ("Hardware & Software", "Human-ware in computer processing refers to:", "People who use/operate the system", ["Only ROM chips", "Only printers", "Only fibre cables"], "The human element."),
    ]


def economics_rows():
    return [
        ("Basic concepts", "Economics is primarily the study of:", "Scarcity and choice", ["Only chemistry", "Only computer hardware", "Only grammar"], "Robbins: scarcity and choice."),
        ("Basic concepts", "Opportunity cost is the:", "Next best alternative foregone", ["Money cost only always", "Sunk cost", "Total revenue"], "Real cost of a choice."),
        ("Basic concepts", "Utility means:", "Want-satisfying power of a good", ["Price only", "Tax only", "Profit only"], "Satisfaction from consumption."),
        ("Fiscal & Monetary Policy", "Fiscal policy is related to:", "Government taxation and spending", ["Only bank rate by RBI", "Only CRR", "Only repo"], "Budgetary policy of government."),
        ("Fiscal & Monetary Policy", "Monetary policy is mainly conducted by:", "RBI", ["Supreme Court", "CAG", "WHO"], "RBI is India’s monetary authority."),
        ("Fiscal & Monetary Policy", "Repo rate is a tool of:", "Monetary policy", ["Fiscal policy only", "Industrial policy only", "Forest policy"], "RBI lends to banks at repo."),
        ("Demand Analysis", "Law of demand states that, other things equal, price and quantity demanded are:", "Inversely related", ["Directly related always", "Unrelated", "Equal"], "Downward sloping demand."),
        ("Demand Analysis", "A shift of demand curve is caused by change in:", "Income, tastes, prices of related goods etc.", ["Only own price (movement)", "Only weather on supply", "Only tax on sellers always"], "Own price → movement; other factors → shift."),
        ("Indifference curve", "An indifference curve shows combinations that give:", "Equal satisfaction", ["Equal cost", "Equal tax", "Equal profit"], "Same utility locus."),
        ("Indifference curve", "Indifference curves are generally:", "Downward sloping and convex to origin", ["Upward sloping", "Vertical always", "Circles"], "Standard IC properties."),
        ("Factor Pricing", "Ricardian theory of rent is associated with:", "Land", ["Labour only", "Capital goods only", "Money"], "Rent of land due to scarcity/fertility."),
        ("Factor Pricing", "Marginal productivity theory is used in:", "Factor pricing", ["Only GST slabs", "Only census", "Only ecology"], "Factors paid according to MP (in theory)."),
        ("Market", "Perfect competition has:", "Many buyers and sellers, homogeneous product", ["One seller", "One buyer only", "No price takers"], "Price takers."),
        ("Market", "A monopoly has:", "A single seller", ["Infinite sellers", "No product", "Only government as buyer always"], "Single seller market."),
        ("Market", "Oligopoly is a market with:", "Few sellers", ["Infinite sellers", "No sellers", "Only one buyer and infinite sellers always"], "Few interdependent firms."),
        ("Factors of production", "The four factors of production are land, labour, capital and:", "Entrepreneurship / organisation", ["GST", "Inflation", "Imports only"], "Classical + organiser."),
        ("Laws of Production", "Law of variable proportions applies in the:", "Short run", ["Very long run only with all factors variable equally", "Never", "Only in monopoly"], "One factor varies, others fixed."),
        ("Economic Growth", "GDP measures:", "Value of final goods and services produced in a country", ["Only population", "Only gold", "Only forest cover"], "National output measure."),
        ("National Income", "NNP = GNP minus:", "Depreciation", ["Exports", "Imports", "Taxes only"], "Net = gross − depreciation."),
        ("National Income", "GDP at market price minus net indirect taxes gives:", "GDP at factor cost", ["NNP", "Personal income", "Disposable income only"], "FC vs MP."),
        ("Developing economy", "A developing economy often has:", "Low per capita income and dependence on agriculture", ["No population", "No villages", "Only services like a mature rich country always"], "Typical structural features."),
        ("Planning vs Market", "A mixed economy has:", "Both public and private sectors", ["Only barter", "Only planning with zero market", "Only foreign firms"], "India is described as mixed."),
        ("Economic Reforms", "Major economic reforms in India began in a big way in:", "1991", ["1947 only", "2019 only", "1950 only"], "LPG reforms 1991."),
        ("Role of RBI", "RBI is the:", "Central bank of India", ["Finance Commission", "NITI Aayog", "SEBI only"], "Banker to government and banks."),
        ("Role of RBI", "Who issues currency notes in India (except one rupee)?", "RBI", ["NITI Aayog", "Supreme Court", "WHO"], "RBI issues notes; ₹1 by Government of India."),
        ("Demand Analysis", "Giffen goods are an exception to:", "Law of demand", ["Law of supply only", "Say’s law only", "Okun’s law"], "Demand may rise with price."),
        ("Fiscal & Monetary Policy", "CRR is:", "Cash Reserve Ratio", ["Credit Rating Rank", "Central Revenue Rate", "Core Repo Rate"], "Bank reserves with RBI."),
        ("Economic Growth", "Real GDP is GDP adjusted for:", "Price changes / inflation", ["Population only", "Forest area", "Literacy only"], "Constant-price measure."),
        ("National Income", "Which is a transfer payment?", "Old-age pension", ["Salary of a teacher for work", "Payment for a laptop", "Rent for a shop used"], "No corresponding current production."),
        ("Market", "Monopolistic competition has:", "Product differentiation", ["A single seller of a homogeneous good only", "No sellers", "Only government"], "Many firms, differentiated products."),
        ("Basic concepts", "Microeconomics studies:", "Individual units / markets", ["The whole economy aggregates only", "Only space science", "Only computers"], "Micro vs macro."),
        ("Basic concepts", "Macroeconomics studies:", "Aggregates like national income", ["A single consumer only", "One firm’s cost only", "One commodity’s utility only"], "Economy-wide variables."),
    ]


def gk_rows():
    states = [
        ("Andhra Pradesh", "Amaravati"),
        ("Arunachal Pradesh", "Itanagar"),
        ("Assam", "Dispur"),
        ("Bihar", "Patna"),
        ("Chhattisgarh", "Raipur"),
        ("Goa", "Panaji"),
        ("Gujarat", "Gandhinagar"),
        ("Haryana", "Chandigarh"),
        ("Himachal Pradesh", "Shimla"),
        ("Jharkhand", "Ranchi"),
        ("Karnataka", "Bengaluru"),
        ("Kerala", "Thiruvananthapuram"),
        ("Madhya Pradesh", "Bhopal"),
        ("Maharashtra", "Mumbai"),
        ("Manipur", "Imphal"),
        ("Meghalaya", "Shillong"),
        ("Mizoram", "Aizawl"),
        ("Nagaland", "Kohima"),
        ("Odisha", "Bhubaneswar"),
        ("Punjab", "Chandigarh"),
        ("Rajasthan", "Jaipur"),
        ("Sikkim", "Gangtok"),
        ("Tamil Nadu", "Chennai"),
        ("Telangana", "Hyderabad"),
        ("Tripura", "Agartala"),
        ("Uttar Pradesh", "Lucknow"),
        ("Uttarakhand", "Dehradun"),
        ("West Bengal", "Kolkata"),
    ]
    rows = []
    other_caps = [c for _, c in states]
    for st, cap in states:
        wrong = [c for c in other_caps if c != cap][:3]
        rows.append(("Political & Physical divisions", f"The capital of {st} is:", cap, wrong, f"{cap} is the capital of {st}."))

    uts = [
        ("Jammu and Kashmir", "Srinagar (summer) / Jammu (winter)"),
        ("Ladakh", "Leh"),
        ("Delhi", "New Delhi"),
        ("Puducherry", "Puducherry"),
        ("Chandigarh", "Chandigarh"),
        ("Andaman and Nicobar Islands", "Port Blair"),
        ("Lakshadweep", "Kavaratti"),
        ("Dadra and Nagar Haveli and Daman and Diu", "Daman"),
    ]
    for ut, cap in uts:
        rows.append(("Political & Physical divisions", f"The capital / headquarters associated with UT {ut} is:", cap, ["Mumbai", "Kolkata", "Chennai"], f"Standard UT headquarters: {cap}."))

    rows.extend([
        ("J&K Reorganisation Act, 2019", "The J&K Reorganisation Act was enacted in:", "2019", ["1947", "1950", "2000"], "Parliament passed it in August 2019."),
        ("J&K Reorganisation Act, 2019", "J&K Reorganisation Act came into force on:", "31 October 2019", ["15 August 1947", "26 January 1950", "5 August 2014"], "Appointed day: 31 October 2019."),
        ("J&K Reorganisation Act, 2019", "The Act reorganised the erstwhile State of J&K into:", "Two Union Territories — J&K and Ladakh", ["Two states", "One UT only", "Three states"], "J&K (with legislature) and Ladakh."),
        ("J&K Reorganisation Act, 2019", "Article 370 was effectively abrogated in:", "August 2019", ["October 1947", "January 1950", "November 2000"], "Constitutional order / Bill process in Aug 2019."),
        ("J&K UT", "The summer capital of J&K is:", "Srinagar", ["Jammu", "Leh", "Kargil"], "Srinagar in summer, Jammu in winter."),
        ("J&K UT", "The winter capital of J&K is:", "Jammu", ["Srinagar", "Anantnag", "Baramulla"], "Darbar move tradition."),
        ("J&K UT", "Wular Lake is in:", "Jammu & Kashmir", ["Rajasthan", "Kerala", "Goa"], "One of India’s largest freshwater lakes."),
        ("J&K UT", "Dal Lake is in:", "Srinagar", ["Jammu", "Leh", "Katra"], "Famous urban lake of Srinagar."),
        ("J&K UT", "Vaishno Devi shrine is near:", "Katra", ["Pahalgam", "Gulmarg", "Leh"], "Reasi district, Jammu region."),
        ("J&K UT", "Amarnath cave shrine is in:", "Kashmir Himalaya", ["Ladakh desert only", "Poonch plains", "Kathua plains"], "Amarnath Yatra."),
        ("J&K UT", "Gulmarg is famous for:", "Skiing / tourism", ["Shipbuilding", "Coffee estates", "Nuclear plants"], "Meadow and ski resort."),
        ("J&K UT", "Pahalgam is on the river:", "Lidder", ["Ganga", "Yamuna", "Narmada"], "Lidder valley."),
        ("J&K UT", "The Jhelum river flows through:", "Kashmir valley / Srinagar", ["Thar desert", "Sundarbans", "Deccan only"], "Vyeth / Jhelum."),
        ("J&K UT", "Chenab is formed by the confluence of Chandra and Bhaga in:", "Himachal / upper Himalaya feeding J&K", ["Kerala", "Goa", "Meghalaya"], "Chenab system."),
        ("J&K UT", "Saffron in J&K is especially associated with:", "Pampore", ["Kargil town market only", "Mumbai", "Chennai"], "Pampore saffron fields."),
        ("J&K UT", "A major apple-producing region of J&K is:", "Kashmir valley (e.g. Shopian / Pulwama belt)", ["Thar", "Sundarbans", "Rann of Kutch"], "Horticulture backbone."),
        ("J&K UT", "Hari Parbat is in:", "Srinagar", ["Jammu city centre", "Leh market", "Katra bus stand"], "Koh-e-Maran."),
        ("J&K UT", "Shankaracharya Temple is in:", "Srinagar", ["Jammu", "Udhampur", "Samba"], "On Gopadri hill."),
        ("J&K UT", "Baharana / Bahu Fort is associated with:", "Jammu", ["Leh", "Kargil", "Kupwara"], "Jammu landmark."),
        ("J&K UT", "Instrument of Accession of J&K was signed in:", "October 1947", ["August 2019", "January 1950", "November 2000"], "26 October 1947 (traditionally cited)."),
        ("J&K UT", "Maharaja Hari Singh was the last ruling prince of:", "Jammu and Kashmir", ["Mysore only", "Hyderabad only", "Travancore only"], "Dogra ruler."),
        ("Current Events / India", "India is a:", "Union of States with a parliamentary system", ["Absolute monarchy", "Only a federation of companies", "City state"], "Constitutional structure."),
        ("Indian Culture, Heritage and Freedom Struggle", "The Indian National Congress was founded in:", "1885", ["1947", "1857", "1919"], "A.O. Hume / 1885."),
        ("Indian Culture, Heritage and Freedom Struggle", "Jallianwala Bagh massacre took place in:", "1919", ["1857", "1942", "1930"], "Amritsar, 13 April 1919."),
        ("Indian Culture, Heritage and Freedom Struggle", "Quit India Movement was launched in:", "1942", ["1919", "1930", "1947"], "August 1942."),
        ("Indian Culture, Heritage and Freedom Struggle", "Dandi March is associated with:", "Salt Satyagraha / 1930", ["1857 revolt", "1947 Partition only", "1962 war"], "Gandhi, 1930."),
        ("Indian Culture, Heritage and Freedom Struggle", "The Revolt of 1857 began at:", "Meerut", ["Mumbai", "Chennai", "Kolkata only as first shot"], "10 May 1857 Meerut."),
        ("Transport & Communication", "After the 2023 redevelopment, which station is cited as having India’s longest railway platform?", "Hubballi (Shree Siddharoodha Swamiji)", ["Howrah", "Chhatrapati Shivaji Maharaj Terminus", "New Delhi"], "Hubballi’s Shree Siddharoodha Swamiji station platform (about 1,507 m) overtook earlier claims such as Gorakhpur."),
        ("Transport & Communication", "NHAI is related to:", "National highways", ["Airports only", "Ports only", "Rail tracks only"], "National Highways Authority of India."),
        ("Demography-Census", "Census of India is conducted by:", "Office of the Registrar General & Census Commissioner", ["RBI", "SEBI", "ISRO"], "Home Ministry organisation."),
        ("Demography-Census", "Sex ratio is:", "Females per 1000 males (in Indian census presentation)", ["Males per km²", "Literacy %", "Births per house"], "Indian Census definition."),
        ("Demography-Census", "Literacy rate in Census of India relates to age:", "7 years and above (standard definition used)", ["0–1 only", "Only graduates", "Only urban males"], "Census literacy definition."),
        ("Important Rivers & Lakes", "The Ganga originates from:", "Gangotri (Bhagirathi) region", ["Nilgiris", "Western Ghats of Kerala only", "Aravallis"], "Himalayan origin."),
        ("Important Rivers & Lakes", "The Yamuna is a tributary of the:", "Ganga", ["Narmada", "Godavari", "Kaveri"], "Joins at Triveni / Prayagraj."),
        ("Important Rivers & Lakes", "The Narmada flows into the:", "Arabian Sea", ["Bay of Bengal", "Caspian Sea", "Pacific"], "West-flowing."),
        ("Important Rivers & Lakes", "Godavari is often called:", "Dakshin Ganga", ["Sorrow of Bihar", "Yellow river", "Nile of India officially"], "Longest peninsular river."),
        ("Important Rivers & Lakes", "Chilika Lake is in:", "Odisha", ["J&K", "Rajasthan", "Punjab"], "Largest coastal lagoon."),
        ("Weather, Climate, Crops", "Monsoon in India is largely:", "South-west summer monsoon", ["Polar easterlies only", "Trade-less vacuum", "Only western disturbance all year"], "June–September core."),
        ("Weather, Climate, Crops", "Western Disturbances affect winter rain in:", "North-west India including J&K", ["Tamil Nadu coast only in January exclusively", "Andaman only", "Lakshadweep only"], "Mediterranean-origin systems."),
        ("Weather, Climate, Crops", "Rice in India needs generally:", "High rainfall / standing water", ["Desert aridity only", "Snow fields", "Zero water"], "Kharif staple."),
        ("Weather, Climate, Crops", "Wheat in India is mainly a:", "Rabi crop", ["Kharif only", "Zaid fruit only", "Plantation of rubber"], "Winter crop."),
        ("Environment, Ecology & Bio-diversity", "Project Tiger was launched in:", "1973", ["1947", "2019", "1991"], "Conservation programme."),
        ("Environment, Ecology & Bio-diversity", "A biodiversity hotspot in India includes:", "Western Ghats / Himalaya (as listed hotspots)", ["Thar as a rainforest", "A shopping mall", "A metro station"], "Conservation geography."),
        ("Environment, Ecology & Bio-diversity", "Kaziranga is famous for:", "One-horned rhinoceros", ["Penguins", "Polar bear", "Kiwi bird as native"], "Assam."),
        ("J&K UT", "The official languages of J&K UT include (as per J&K Official Languages Act, 2020):", "Kashmiri, Dogri, Urdu, Hindi, English", ["Only French", "Only Sanskrit and German", "Only Portuguese"], "Five official languages."),
        ("J&K UT", "Ladakh became a separate UT in:", "2019", ["1947", "1950", "2002"], "Reorganisation Act."),
        ("J&K UT", "Kargil is in:", "Ladakh UT", ["Punjab", "Haryana", "Goa"], "After 2019, Ladakh."),
        ("J&K UT", "The Tawi river is associated with:", "Jammu", ["Mumbai", "Chennai", "Kolkata"], "Flows by Jammu city."),
        ("Indian Culture, Heritage and Freedom Struggle", "The Constitution of India came into force on:", "26 January 1950", ["15 August 1947", "26 November 1948", "2 October 1947"], "Republic Day."),
        ("Indian Culture, Heritage and Freedom Struggle", "The Constituent Assembly adopted the Constitution on:", "26 November 1949", ["26 January 1950", "15 August 1947", "30 January 1948"], "Constitution Day."),
        ("Political & Physical divisions", "India has (as currently constituted):", "28 States and 8 Union Territories", ["50 states", "7 states", "1 state"], "After J&K reorganisation and later UT mergers."),
        ("Transport & Communication", "The headquarters of Indian Railways is in:", "New Delhi (Rail Bhavan)", ["Mumbai CST only as HQ of all IR", "Chennai Central as national HQ", "Howrah as national HQ"], "Ministry of Railways, Delhi."),
        ("Current Events of National and International importance", "UNO headquarters is in:", "New York", ["Geneva only as sole HQ", "Paris", "New Delhi"], "UN HQ New York."),
        ("Current Events of National and International importance", "WHO is related to:", "Health", ["Trade only", "Football only", "Space only"], "World Health Organization."),
        ("Environment, Ecology & Bio-diversity", "Chipko movement is related to:", "Forest conservation", ["Nuclear power", "Metro rail", "GST"], "Tree hugging in Uttarakhand Himalaya."),
    ])
    return rows


def main():
    rng = random.Random(SEED)
    OUT.mkdir(parents=True, exist_ok=True)

    write_bank("mathematics", "Mathematics", gen_mathematics(rng))
    write_bank("statistics", "Statistics", gen_statistics(rng))
    write_bank("accountancy", "Accountancy and Book Keeping", gen_from_theory("faa-accountancy", "Accountancy and Book Keeping", accountancy_rows(), rng, fill_accountancy))
    write_bank("english", "General English", gen_from_theory("faa-english", "General English", english_rows(), rng, fill_english))
    write_bank("science", "General Science", gen_from_theory("faa-science", "General Science", science_rows(), rng, fill_science))
    write_bank("computers", "Knowledge of Computers", gen_from_theory("faa-computers", "Knowledge of Computers", computers_rows(), rng, fill_computers))
    write_bank("economics", "General Economics", gen_from_theory("faa-economics", "General Economics", economics_rows(), rng, fill_economics))
    write_bank("gk-jk", "General Knowledge with special reference to J&K UT", gen_from_theory("faa-gk", "General Knowledge with special reference to J&K UT", gk_rows(), rng, fill_gk))

    # Keep the original latest-pattern paper as an extra pack (do not read the manifest).
    pattern_path = OUT / "latest-pattern.json"
    kept = []
    if pattern_path.exists():
        kept = json.loads(pattern_path.read_text(encoding="utf-8")).get("questions") or []
    write_bank("latest-pattern", "Latest pattern paper", kept)

    # Slim main post file to a manifest
    manifest = {
        "post_id": "accounts-assistant-finance",
        "post_name": "Accounts Assistant (Finance)",
        "category": "Finance",
        "category_id": "finance",
        "kind": "multi_subject",
        "question_count": 8 * N + len(kept),
        "subject_files": [
            "qbanks/finance/faa/gk-jk.json",
            "qbanks/finance/faa/accountancy.json",
            "qbanks/finance/faa/english.json",
            "qbanks/finance/faa/statistics.json",
            "qbanks/finance/faa/mathematics.json",
            "qbanks/finance/faa/economics.json",
            "qbanks/finance/faa/science.json",
            "qbanks/finance/faa/computers.json",
            "qbanks/finance/faa/latest-pattern.json",
        ],
        "questions": [],
        "pool_note": "Official Advt. 10 of 2025 eight-subject bank plus retained latest-pattern PDF set.",
    }
    src_manifest = ROOT / "data" / "qbanks" / "finance" / "accounts-assistant-finance.json"
    src_manifest.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Manifest written", manifest["question_count"])


if __name__ == "__main__":
    main()
