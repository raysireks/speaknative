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
    "ser": {
        "present": {"1s": "soy", "2s": "eres", "3s": "es", "1p": "somos", "3p": "son"},
        "past": {"1s": "fui", "2s": "fuiste", "3s": "fue", "1p": "fuimos", "3p": "fueron"},
        "future": {"1s": "seré", "2s": "serás", "3s": "será", "1p": "seremos", "3p": "serán"}
    },
    "estar": {
        "present": {"1s": "estoy", "2s": "estás", "3s": "está", "1p": "estamos", "3p": "están"},
        "past": {"1s": "estuve", "2s": "estuviste", "3s": "estuvo", "1p": "estuvimos", "3p": "estuvieron"},
        # Future is regular
    },
    "ir": {
        "present": {"1s": "voy", "2s": "vas", "3s": "va", "1p": "vamos", "3p": "van"},
        "past": {"1s": "fui", "2s": "fuiste", "3s": "fue", "1p": "fuimos", "3p": "fueron"},
        "future": {"1s": "iré", "2s": "irás", "3s": "irá", "1p": "iremos", "3p": "irán"}
    },
    "tener": {
        "present": {"1s": "tengo", "2s": "tienes", "3s": "tiene", "1p": "tenemos", "3p": "tienen"},
        "past": {"1s": "tuve", "2s": "tuviste", "3s": "tuvo", "1p": "tuvimos", "3p": "tuvieron"},
        "future": {"1s": "tendré", "2s": "tendrás", "3s": "tendrá", "1p": "tendremos", "3p": "tendrán"}
    },
    "hacer": {
        "present": {"1s": "hago", "2s": "haces", "3s": "hace"}, # partial override ok
        "past": {"1s": "hice", "2s": "hiciste", "3s": "hizo", "1p": "hicimos", "3p": "hicieron"},
        "future": {"1s": "haré", "2s": "harás", "3s": "hará", "1p": "haremos", "3p": "harán"}
    }
}

IRREGULARS_EN = {
    "ser": { # to be
        "present": {"1s": "am", "2s": "are", "3s": "is", "1p": "are", "3p": "are"},
        "past": {"1s": "was", "2s": "were", "3s": "was", "1p": "were", "3p": "were"},
    },
    "estar": { # to be
         "present": {"1s": "am", "2s": "are", "3s": "is", "1p": "are", "3p": "are"},
        "past": {"1s": "was", "2s": "were", "3s": "was", "1p": "were", "3p": "were"},
    },
    "ir": { # to go
        "past": {"1s": "went", "2s": "went", "3s": "went", "1p": "went", "3p": "went"},
    },
     "tener": { # to have
        "present": {"3s": "has"},
        "past": {"1s": "had", "2s": "had", "3s": "had", "1p": "had", "3p": "had"},
    },
    "hacer": { # to do/make
        "present": {"3s": "does"},
        "past": {"1s": "did", "2s": "did", "3s": "did", "1p": "did", "3p": "did"}
    }
    # Add more English irregulars as needed for the top list
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
