import re, math
from os import path, listdir, mkdir
from collections import Counter

WORD = re.compile(r'\w+')
STOP_WORDS = "the mix remix original don not".split(' ')
def text_to_vector(text):
    text = re.sub(r'.mp3$', '', re.sub(r'^[\d\s]+' , '', text))
    words = WORD.findall(text)
    words = [w.lower() for w in words if len(w) > 2 and w.lower() not in STOP_WORDS]
    # print text, words
    return Counter(words)

def get_cosine(vec1, vec2):
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])

    sum1 = sum([vec1[x]**2 for x in vec1.keys()])
    sum2 = sum([vec2[x]**2 for x in vec2.keys()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)

    if not denominator:
        return 0.0
    else:
        return float(numerator) / denominator



# text1 = 'This is a foo bar sentence .'
# text2 = 'This sentence is similar to a foo bar .'

# cosine = get_cosine(text1, text2)

# print 'Cosine:', cosine

SONG_FOLDER = path.abspath(path.join(__file__, '../../../songs'))

song_list = listdir(SONG_FOLDER)

for s1 in range(len(song_list)):
    for s2 in range(s1 + 1, len(song_list)):
        vec1 = text_to_vector(song_list[s1])
        vec2 = text_to_vector(song_list[s2])

        cosine = get_cosine(vec1, vec2)
        if cosine > 0.65:
            print song_list[s1], '\n', song_list[s2], '\n'
