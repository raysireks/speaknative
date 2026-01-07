import json
import os

PHRASES_MANIFEST_PATH = 'src/data/phrases-manifest.json'

# --- Conjugation Logic ---

PRONOUNS = ['1s', '2s', '3s', '1p', '3p']
TENSES = ['present', 'past', 'future']

# Standard endings
ENDINGS = {
    'ar': {
        'present': {'1s': 'o', '2s': 'as', '3s': 'a', '1p': 'amos', '3p': 'an'},
        'past': {'1s': 'é', '2s': 'aste', '3s': 'ó', '1p': 'amos', '3p': 'aron'},
        'future': {'1s': 'aré', '2s': 'arás', '3s': 'ará', '1p': 'aremos', '3p': 'arán'}
    },
    'er': {
        'present': {'1s': 'o', '2s': 'es', '3s': 'e', '1p': 'emos', '3p': 'en'},
        'past': {'1s': 'í', '2s': 'iste', '3s': 'ió', '1p': 'imos', '3p': 'ieron'},
        'future': {'1s': 'eré', '2s': 'erás', '3s': 'erá', '1p': 'eremos', '3p': 'erán'}
    },
    'ir': {
        'present': {'1s': 'o', '2s': 'es', '3s': 'e', '1p': 'imos', '3p': 'en'},
        'past': {'1s': 'í', '2s': 'iste', '3s': 'ió', '1p': 'imos', '3p': 'ieron'},
        'future': {'1s': 'iré', '2s': 'irás', '3s': 'irá', '1p': 'iremos', '3p': 'irán'}
    }
}

# English pronouns mapping (approximate for generation)
EN_PRONOUNS = {
    '1s': 'I', '2s': 'You', '3s': 'He/She', '1p': 'We', '3p': 'They'
}

def conjugate_regular_es(inf, type_override=None):
    if type_override:
        ending_type = type_override
    elif inf.endswith('ar'): ending_type = 'ar'
    elif inf.endswith('er'): ending_type = 'er'
    elif inf.endswith('ir'): ending_type = 'ir'
    else: return {} # Should not happen for standard verbs
    
    stem = inf[:-2]
    result = {}
    for tense in TENSES:
        result[tense] = {}
        for p in PRONOUNS:
            suffix = ENDINGS[ending_type][tense][p]
            result[tense][p] = stem + suffix
    return result

def conjugate_regular_en(inf_en):
    # Simplified English conjugation
    # inf_en e.g. "to walk" -> verb "walk"
    verb = inf_en.replace("to ", "")
    
    result = {'present': {}, 'past': {}, 'future': {}}
    
    # Present
    for p in PRONOUNS:
        if p == '3s': result['present'][p] = verb + "s" # heuristic
        else: result['present'][p] = verb
        
    # Past (heuristic: +ed)
    past_form = verb + "ed"
    if verb.endswith("e"): past_form = verb + "d"
    for p in PRONOUNS:
        result['past'][p] = past_form
        
    # Future
    for p in PRONOUNS:
        result['future'][p] = "will " + verb
        
    return result

# Irregular data and specific overrides
# Structure: "verb_id": { "tense": { "pronoun": "form" } }
IRREGULARS_ES = {
    # --- SER ---
    "ser": {
        "present": {"1s": "soy", "2s": "eres", "3s": "es", "1p": "somos", "3p": "son"},
        "past": {"1s": "fui", "2s": "fuiste", "3s": "fue", "1p": "fuimos", "3p": "fueron"},
        "future": {"1s": "seré", "2s": "serás", "3s": "será", "1p": "seremos", "3p": "serán"}
    },
    # --- ESTAR ---
    "estar": {
        "present": {"1s": "estoy", "2s": "estás", "3s": "está", "1p": "estamos", "3p": "están"},
        "past": {"1s": "estuve", "2s": "estuviste", "3s": "estuvo", "1p": "estuvimos", "3p": "estuvieron"},
    },
    # --- IR ---
    "ir": {
        "present": {"1s": "voy", "2s": "vas", "3s": "va", "1p": "vamos", "3p": "van"},
        "past": {"1s": "fui", "2s": "fuiste", "3s": "fue", "1p": "fuimos", "3p": "fueron"},
        "future": {"1s": "iré", "2s": "irás", "3s": "irá", "1p": "iremos", "3p": "irán"}
    },
    # --- TENER ---
    "tener": {
        "present": {"1s": "tengo", "2s": "tienes", "3s": "tiene", "1p": "tenemos", "3p": "tienen"},
        "past": {"1s": "tuve", "2s": "tuviste", "3s": "tuvo", "1p": "tuvimos", "3p": "tuvieron"},
        "future": {"1s": "tendré", "2s": "tendrás", "3s": "tendrá", "1p": "tendremos", "3p": "tendrán"}
    },
    # --- HACER ---
    "hacer": {
        "present": {"1s": "hago"},
        "past": {"1s": "hice", "2s": "hiciste", "3s": "hizo", "1p": "hicimos", "3p": "hicieron"},
        "future": {"1s": "haré", "2s": "harás", "3s": "hará", "1p": "haremos", "3p": "harán"}
    },
    # --- PODER ---
    "poder": {
        "present": {"1s": "puedo", "2s": "puedes", "3s": "puede", "1p": "podemos", "3p": "pueden"}, # Stem o->ue
        "past": {"1s": "pude", "2s": "pudiste", "3s": "pudo", "1p": "pudimos", "3p": "pudieron"},
        "future": {"1s": "podré", "2s": "podrás", "3s": "podrá", "1p": "podremos", "3p": "podrán"}
    },
    # --- DECIR ---
    "decir": {
        "present": {"1s": "digo", "2s": "dices", "3s": "dice", "1p": "decimos", "3p": "dicen"},
        "past": {"1s": "dije", "2s": "dijiste", "3s": "dijo", "1p": "dijimos", "3p": "dijeron"},
        "future": {"1s": "diré", "2s": "dirás", "3s": "dirá", "1p": "diremos", "3p": "dirán"}
    },
    # --- VENIR ---
    "venir": {
        "present": {"1s": "vengo", "2s": "vienes", "3s": "viene", "1p": "venimos", "3p": "vienen"},
        "past": {"1s": "vine", "2s": "viniste", "3s": "vino", "1p": "vinimos", "3p": "vinieron"},
        "future": {"1s": "vendré", "2s": "vendrás", "3s": "vendrá", "1p": "vendremos", "3p": "vendrán"}
    },
    # --- VER ---
    "ver": {
        "present": {"1s": "veo", "2s": "ves", "3s": "ve", "1p": "vemos", "3p": "ven"},
        "past": {"1s": "vi", "2s": "viste", "3s": "vio", "1p": "vimos", "3p": "vieron"}, # No accents on monosyllables mostly
    },
    # --- DAR ---
    "dar": {
        "present": {"1s": "doy", "2s": "das", "3s": "da", "1p": "damos", "3p": "dan"},
        "past": {"1s": "di", "2s": "diste", "3s": "dio", "1p": "dimos", "3p": "dieron"},
    },
    # --- SABER ---
    "saber": {
        "present": {"1s": "sé", "2s": "sabes", "3s": "sabe", "1p": "sabemos", "3p": "saben"},
        "past": {"1s": "supe", "2s": "supiste", "3s": "supo", "1p": "supimos", "3p": "supieron"},
        "future": {"1s": "sabré", "2s": "sabrás", "3s": "sabrá", "1p": "sabremos", "3p": "sabrán"}
    },
    # --- QUERER ---
    "querer": {
        "present": {"1s": "quiero", "2s": "quieres", "3s": "quiere", "1p": "queremos", "3p": "quieren"}, # e->ie
        "past": {"1s": "quise", "2s": "quisiste", "3s": "quiso", "1p": "quisimos", "3p": "quisieron"},
        "future": {"1s": "querré", "2s": "querrás", "3s": "querrá", "1p": "querremos", "3p": "querrán"}
    },
    # --- PONER ---
    "poner": {
        "present": {"1s": "pongo"},
        "past": {"1s": "puse", "2s": "pusiste", "3s": "puso", "1p": "pusimos", "3p": "pusieron"},
        "future": {"1s": "pondré", "2s": "pondrás", "3s": "pondrá", "1p": "pondremos", "3p": "pondrán"}
    },
    # --- PARECER ---
    "parecer": { # zco
        "present": {"1s": "parezco"},
    },
    # --- CREER ---
    "creer": {
        "past": {"3s": "creyó", "3p": "creyeron"}
    },
    # --- SEGUIR ---
    "seguir": { # e -> i
        "present": {"1s": "sigo", "2s": "sigues", "3s": "sigue", "1p": "seguimos", "3p": "siguen"},
        "past": {"3s": "siguió", "3p": "siguieron"}
    },
    # --- ENCONTRAR ---
    "encontrar": { # o -> ue
        "present": {"1s": "encuentro", "2s": "encuentras", "3s": "encuentra", "1p": "encontramos", "3p": "encuentran"},
    },
    # --- CONTAR ---
    "contar": { # o -> ue
        "present": {"1s": "cuento", "2s": "cuentas", "3s": "cuenta", "1p": "contamos", "3p": "cuentan"},
    },
    # --- EMPEZAR ---
    "empezar": { # e -> ie
        "present": {"1s": "empiezo", "2s": "empiezas", "3s": "empieza", "1p": "empezamos", "3p": "empiezan"},
        "past": {"1s": "empecé"}
    },
    # --- PERDER ---
    "perder": { # e -> ie
        "present": {"1s": "pierdo", "2s": "pierdes", "3s": "pierde", "1p": "perdemos", "3p": "pierden"},
    },
    # --- PRODUCIR ---
    "producir": { # zco, j-past
        "present": {"1s": "produzco"},
        "past": {"1s": "produje", "2s": "produjiste", "3s": "produjo", "1p": "produjimos", "3p": "produjeron"},
    },
    # --- ENTENDER ---
    "entender": { # e -> ie
        "present": {"1s": "entiendo", "2s": "entiendes", "3s": "entiende", "1p": "entendemos", "3p": "entienden"},
    },
    # --- PEDIR ---
    "pedir": { # e -> i
        "present": {"1s": "pido", "2s": "pides", "3s": "pide", "1p": "pedimos", "3p": "piden"},
        "past": {"3s": "pidió", "3p": "pidieron"}
    },
    # --- RECORDAR ---
    "recordar": { # o -> ue
        "present": {"1s": "recuerdo", "2s": "recuerdas", "3s": "recuerda", "1p": "recordamos", "3p": "recuerdan"},
    },
    # --- APARECER ---
    "aparecer": { # zco
        "present": {"1s": "aparezco"},
    },
    # --- CONSEGUIR ---
    "conseguir": { # e -> i
        "present": {"1s": "consigo", "2s": "consigues", "3s": "consigue", "1p": "conseguimos", "3p": "consiguen"},
        "past": {"3s": "consiguió", "3p": "consiguieron"}
    },
    # --- COMENZAR ---
    "comenzar": { # e -> ie
        "present": {"1s": "comienzo", "2s": "comienzas", "3s": "comienza", "1p": "comenzamos", "3p": "comienzan"},
        "past": {"1s": "comencé"}
    },
    # --- SERVIR ---
    "servir": { # e -> i
        "present": {"1s": "sirvo", "2s": "sirves", "3s": "sirve", "1p": "servimos", "3p": "sirven"},
        "past": {"3s": "sirvió", "3p": "sirvieron"}
    },
     # --- SACAR ---
    "sacar": {
        "past": {"1s": "saqué"}
    },
     # --- BUSCAR ---
    "buscar": {
        "past": {"1s": "busqué"}
    },
     # --- LLEGAR ---
    "llegar": {
        "past": {"1s": "llegué"}
    }
}

IRREGULARS_EN = {
    # TO BE
    "ser": { 
        "present": {"1s": "am", "2s": "are", "3s": "is", "1p": "are", "3p": "are"},
        "past": {"1s": "was", "2s": "were", "3s": "was", "1p": "were", "3p": "were"},
    },
    "estar": {
         "present": {"1s": "am", "2s": "are", "3s": "is", "1p": "are", "3p": "are"},
        "past": {"1s": "was", "2s": "were", "3s": "was", "1p": "were", "3p": "were"},
    },
    # TO HAVE
     "tener": {
        "present": {"3s": "has"},
        "past": {"1s": "had", "2s": "had", "3s": "had", "1p": "had", "3p": "had"},
    },
    # TO DO
    "hacer": {
        "present": {"3s": "does"},
        "past": {"1s": "did", "2s": "did", "3s": "did", "1p": "did", "3p": "did"}
    },
    # TO GO
    "ir": {
        "present": {"3s": "goes"},
        "past": {"1s": "went", "2s": "went", "3s": "went", "1p": "went", "3p": "went"},
    },
    # TO SAY
    "decir": {
        "present": {"3s": "says"},
        "past": {"1s": "said", "2s": "said", "3s": "said", "1p": "said", "3p": "said"},
    },
    # TO COME
    "venir": { 
        "past": {"1s": "came", "2s": "came", "3s": "came", "1p": "came", "3p": "came"},
    },
    # TO SEE
    "ver": {
        "past": {"1s": "saw", "2s": "saw", "3s": "saw", "1p": "saw", "3p": "saw"},
        "future": {"1s": "will see"} # Regular future default is fine, just listing keys
    },
    # TO GIVE
    "dar": {
        "past": {"1s": "gave", "2s": "gave", "3s": "gave", "1p": "gave", "3p": "gave"},
    },
    # TO KNOW
    "saber": {
        "past": {"1s": "knew", "2s": "knew", "3s": "knew", "1p": "knew", "3p": "knew"},
    },
     # TO GIVE (already done)
     # TO FIND
    "encontrar": {
        "past": {"1s": "found", "2s": "found", "3s": "found", "1p": "found", "3p": "found"},
    },
     # TO TELL (CONTAR?)
    "contar": {
        "past": {"1s": "told", "2s": "told", "3s": "told", "1p": "told", "3p": "told"}, # Contar = to count/tell
    },
     # TO LOSE
    "perder": {
        "past": {"1s": "lost", "2s": "lost", "3s": "lost", "1p": "lost", "3p": "lost"},
    },
      # TO UNDERSTAND
    "entender": {
        "past": {"1s": "understood", "2s": "understood", "3s": "understood", "1p": "understood", "3p": "understood"},
    },
    # TO WRITE
    "escribir": {
        "past": {"1s": "wrote", "2s": "wrote", "3s": "wrote", "1p": "wrote", "3p": "wrote"},
    },
    # TO GET
    "conseguir": {
        "past": {"1s": "got", "2s": "got", "3s": "got", "1p": "got", "3p": "got"},
    },
    # TO GET (alternative?)
    
    # TO PUT
    "poner": {
        "past": {"1s": "put", "2s": "put", "3s": "put", "1p": "put", "3p": "put"},
    },
    # TO LEAVE
    "dejar": {
        "past": {"1s": "left", "2s": "left", "3s": "left", "1p": "left", "3p": "left"},
    }
}

TOP_VERBS = [
    ("ser", "ser", "to be"),
    ("estar", "estar", "to be"),
    ("tener", "tener", "to have"),
    ("hacer", "hacer", "to do"),
    ("ir", "ir", "to go"),
    ("poder", "poder", "to be able"),
    ("decir", "decir", "to say"),
    ("venir", "venir", "to come"),
    ("ver", "ver", "to see"),
    ("dar", "dar", "to give"),
    ("saber", "saber", "to know"),
    ("querer", "querer", "to want"),
    ("llegar", "llegar", "to arrive"),
    ("pasar", "pasar", "to pass"),
    ("deber", "deber", "to owe/must"),
    ("poner", "poner", "to put"),
    ("parecer", "parecer", "to seem"),
    ("quedar", "quedar", "to stay"),
    ("creer", "creer", "to believe"),
    ("hablar", "hablar", "to speak"),
    ("llevar", "llevar", "to carry"),
    ("dejar", "dejar", "to leave"),
    ("seguir", "seguir", "to follow"),
    ("encontrar", "encontrar", "to find"),
    ("llamar", "llamar", "to call"),
    ("vivir", "vivir", "to live"),
    ("tratar", "tratar", "to try"),
    ("mirar", "mirar", "to look"),
    ("contar", "contar", "to count/tell"),
    ("empezar", "empezar", "to start"),
    ("esperar", "esperar", "to wait"),
    ("buscar", "buscar", "to search"),
    ("existir", "existir", "to exist"),
    ("entrar", "entrar", "to enter"),
    ("trabajar", "trabajar", "to work"),
    ("escribir", "escribir", "to write"),
    ("perder", "perder", "to lose"),
    ("producir", "producir", "to produce"),
    ("ocurrir", "ocurrir", "to occur"),
    ("entender", "entender", "to understand"),
    ("pedir", "pedir", "to ask for"),
    ("recibir", "recibir", "to receive"),
    ("recordar", "recordar", "to remember"),
    ("terminar", "terminar", "to finish"),
    ("permitir", "permitir", "to allow"),
    ("aparecer", "aparecer", "to appear"),
    ("conseguir", "conseguir", "to get"),
    ("comenzar", "comenzar", "to begin"),
    ("servir", "servir", "to serve"),
    ("sacar", "sacar", "to take out")
]

def generate_verb_entry(id_val, inf_es, inf_en):
    # Determine base regular conjugations
    es_conj = conjugate_regular_es(inf_es)
    en_conj = conjugate_regular_en(inf_en)
    
    # Apply irregular overrides ES
    if id_val in IRREGULARS_ES:
        for tense, forms in IRREGULARS_ES[id_val].items():
            es_conj[tense].update(forms)
            
    # Apply irregular overrides EN
    if id_val in IRREGULARS_EN:
        for tense, forms in IRREGULARS_EN[id_val].items():
            en_conj[tense].update(forms)

    # Specific common irregulars not fully in IRREGULARS_ES but needed
    # 'tener' future is irregular
    if id_val == 'tener' and 'future' not in IRREGULARS_ES['tener']:
         # added above actually
         pass
         
    return {
        "id": id_val,
        "infinitive": {
             "co-cartagena": inf_es,
             "co-medellin": inf_es,
             "us-ca": inf_en
        },
        "data": {
            "co-cartagena": es_conj,
            "co-medellin": es_conj, # Assuming same for MVP
            "us-ca": en_conj
        }
    }


VERBS_MANIFEST_PATH = 'src/data/verbs-manifest.json'

# ... (Conjugation Logic maintained above, but script structure simplifies)

def main():
    # No need to read existing phrases manifest anymore
    
    generated_verbs = []
    for (vid, inf_es, inf_en) in TOP_VERBS:
        generated_verbs.append(generate_verb_entry(vid, inf_es, inf_en))

    # Just dump the list
    with open(VERBS_MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(generated_verbs, f, indent=4, ensure_ascii=False)
        
    print(f"Successfully wrote {len(generated_verbs)} verbs to {VERBS_MANIFEST_PATH}.")

if __name__ == "__main__":
    main()
