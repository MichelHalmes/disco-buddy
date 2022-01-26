from os import path, listdir, mkdir
import argparse

from pydub import AudioSegment

SONG_FOLDER = path.abspath(path.join(__file__, '../../../songs'))
SHRINK_FOLDER = path.join(SONG_FOLDER, "_shrink")
CUT_START = 10

def shrink_file(filename, CUT_DURATION, BITRATE):
    if not filename.endswith(".mp3") or path.exists(path.join(SHRINK_FOLDER, filename)):
        return
    print("Shrinking: ", filename)

    # If this fails, it's because ffmpeg is not installed...
    segment = AudioSegment.from_mp3(path.join(SONG_FOLDER, filename))

    idx_start = CUT_START * 1000
    idx_end = (CUT_START + CUT_DURATION) * 1000
    if len(segment) < idx_end:
        print(f"Song '{filename}' is only {len(segment) / 1000,}s (<{idx_end / 1000}s)")
        return
    segment = segment[idx_start:idx_end].fade_in(2000).fade_out(3000)

    segment.export(path.join(SHRINK_FOLDER, filename), format="mp3", bitrate="%sK" % BITRATE)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--duration', dest='duration', type=int,
                        help='Duration of the song to shrink')
    parser.add_argument('--bitrate', dest='bitrate',
                        type=int, help='MP3 bitrate')
    args = parser.parse_args()

    CUT_DURATION = args.duration
    BITRATE = args.bitrate
    print(f"Shrinking songs to {CUT_DURATION} seconds!" )

    if not path.exists(SHRINK_FOLDER):
        mkdir(SHRINK_FOLDER)

    for filename in listdir(SONG_FOLDER):
        shrink_file(filename, CUT_DURATION, BITRATE)

main()
