from os import path, listdir, mkdir
from pydub import AudioSegment

import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--duration', dest='duration', type=int, default=60, help='Duration of the song to shrink')
args = parser.parse_args()


SONG_FOLDER = path.abspath(path.join(__file__, '../../../songs'))
SHRINK_FOLDER = path.join(SONG_FOLDER, "shrink")
CUT_START = 10
CUT_DURATION = args.duration

print "Shrinking songs to %i seconds!" % CUT_DURATION

if not path.exists(SHRINK_FOLDER):
    mkdir(SHRINK_FOLDER)


for filename in listdir(SONG_FOLDER):
    if not filename.endswith(".mp3") or path.exists(path.join(SHRINK_FOLDER, filename)):
        continue
    print "Shrinking: ", filename
    segment = AudioSegment.from_mp3(path.join(SONG_FOLDER, filename))
    idx_start = CUT_START * 1000
    idx_end = (CUT_START + CUT_DURATION) * 1000
    segment = segment[idx_start:idx_end].fade_in(2000).fade_out(3000)

    segment.export(path.join(SHRINK_FOLDER, filename), format="mp3", bitrate="84K")

