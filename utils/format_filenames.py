from os import path, listdir, mkdir
import re
import shutil

shutil.rmtree('./renamed', ignore_errors=True)

mkdir('./renamed')

for filename in listdir('./'):
    if not filename.endswith('.mp3'):
        continue
    song = filename[:-len('.mp3')]

    new_song = re.sub(r'^[\d\s_\-\.]*','', song) # Remove song number
    new_song = new_song.replace('_', ' ')
    new_song = re.sub(r'(\w{2,}\.\w)', lambda m: m.group(1).replace('.', ' ') , new_song) # No dots as spaces
    new_song = re.sub(r'\s*\-\s*', ' - ' , new_song) # Spaces around dash
    new_song = re.sub(r'((^|\s)\w)', lambda m: m.group(1).upper() , new_song) # Camel Case
    new_song = re.sub(r'\s*\(\d{4}\)', '', new_song) # Replace dates

    print song, "----", new_song


    shutil.copyfile(filename, path.join( './renamed', new_song+'.mp3'))
    






